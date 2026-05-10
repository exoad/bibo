#!/bin/bash
# Skill Tracker Report Generator
# Generates usage reports from skill tracking data

TRACKER_DIR="${HOME}/bibo/.pi/skill-tracker"
DATA_FILE="${TRACKER_DIR}/usage.jsonl"
SKILLS_DIR="${HOME}/bibo/skills"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
DAYS=30
OUTPUT="table"
ACTION="report"

while [[ $# -gt 0 ]]; do
    case $1 in
        --days|-d)
            DAYS="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT="$2"
            shift 2
            ;;
        --action|-a)
            ACTION="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Check if data file exists
if [[ ! -f "$DATA_FILE" ]]; then
    echo "No usage data found. Run skill-tracker to log usage first."
    exit 1
fi

# Get cutoff date
CUTOFF=$(date -v-${DAYS}d +%Y-%m-%d 2>/dev/null || date -d "${DAYS} days ago" +%Y-%m-%d 2>/dev/null || echo "")

# Filter entries by date if we have a valid cutoff
filter_by_date() {
    if [[ -n "$CUTOFF" ]]; then
        while IFS= read -r line; do
            ts=$(echo "$line" | grep -o '"timestamp":"[^"]*"' | sed 's/"timestamp":"//;s/"$//')
            if [[ "$ts" > "$CUTOFF" || "$ts" == "$CUTOFF" ]]; then
                echo "$line"
            fi
        done
    else
        cat
    fi
}

# Generate stats report
generate_stats() {
    echo -e "${BLUE}=== Skill Tracker Stats ===${NC}"
    echo ""
    
    # Total entries
    total=$(cat "$DATA_FILE" | wc -l)
    echo -e "Total usage entries: ${GREEN}$total${NC}"
    
    # Entries in period
    if [[ -n "$CUTOFF" ]]; then
        period_total=$(cat "$DATA_FILE" | filter_by_date | wc -l)
        echo -e "Entries in last $DAYS days: ${GREEN}$period_total${NC}"
    fi
    
    # Unique skills used
    used_skills=$(grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | sed 's/"skill_name":"//;s/"$//' | sort -u | wc -l)
    echo -e "Unique skills used: ${GREEN}$used_skills${NC}"
    
    # Available skills
    if [[ -d "$SKILLS_DIR" ]]; then
        available=$(find "$SKILLS_DIR" -name "SKILL.md" -exec dirname {} \; | xargs -n1 basename | sort -u | wc -l)
        echo -e "Available skills: ${GREEN}$available${NC}"
        unused=$((available - used_skills))
        if [[ $unused -gt 0 ]]; then
            echo -e "Unused skills: ${YELLOW}$unused${NC}"
        fi
    fi
    
    # Correctness breakdown
    proper=$(grep '"correctness":"proper"' "$DATA_FILE" | wc -l)
    improper=$(grep '"correctness":"improper"' "$DATA_FILE" | wc -l)
    unknown=$(grep '"correctness":"unknown"' "$DATA_FILE" | wc -l)
    
    echo ""
    echo -e "Correctness breakdown:"
    echo -e "  ${GREEN}Proper:${NC}   $proper"
    echo -e "  ${RED}Improper:${NC} $improper"
    echo -e "  ${YELLOW}Unknown:${NC}  $unknown"
    
    # Most used skill
    echo ""
    echo -e "${BLUE}Top 5 Most Used Skills:${NC}"
    grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | \
        sed 's/"skill_name":"//;s/"$//' | \
        sort | uniq -c | sort -rn | head -5 | \
        while read count skill; do
            echo -e "  ${GREEN}$skill${NC}: $count uses"
        done
    
    # Skills needing review
    need_review=$(grep '"correctness":"unknown"' "$DATA_FILE" | wc -l)
    if [[ $need_review -gt 0 ]]; then
        echo ""
        echo -e "${YELLOW}$need_review entries need correctness review${NC}"
    fi
}

# Generate table report
generate_table() {
    echo -e "${BLUE}=== Skill Usage Report (Last $DAYS Days) ===${NC}"
    echo ""
    
    # Header
    printf "%-25s | %6s | %7s | %8s | %6s\n" "Skill" "Uses" "Proper" "Improper" "Rate"
    printf "%s\n" "-------------------------|--------|--------|----------|------"
    
    # Get all skills and their stats
    grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | \
        sed 's/"skill_name":"//;s/"$//' | \
        sort -u | \
        while read skill; do
            # Count entries for this skill in period
            if [[ -n "$CUTOFF" ]]; then
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE" | filter_by_date)
            else
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE")
            fi
            
            total=$(echo "$entries" | wc -l)
            proper=$(echo "$entries" | grep '"correctness":"proper"' | wc -l)
            improper=$(echo "$entries" | grep '"correctness":"improper"' | wc -l)
            
            if [[ $total -gt 0 ]]; then
                rate=$(( proper * 100 / (proper + improper) ))
                if [[ $improper -gt 0 ]]; then
                    printf "%-25s | %6d | %7d | %8d | %5d%%\n" "$skill" "$total" "$proper" "$improper" "$rate"
                else
                    printf "%-25s | %6d | %7d | %8d | ${GREEN}%5d%%${NC}\n" "$skill" "$total" "$proper" "$improper" "$rate"
                fi
            fi
        done
    
    # Unused skills section
    if [[ -d "$SKILLS_DIR" ]]; then
        echo ""
        echo -e "${YELLOW}=== Unused Skills (Candidates for Pruning) ===${NC}"
        
        used_skills=$(grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | sed 's/"skill_name":"//;s/"$//' | sort -u)
        
        find "$SKILLS_DIR" -name "SKILL.md" -exec dirname {} \; | \
            xargs -n1 basename | \
            sort -u | \
            while read skill; do
                if ! echo "$used_skills" | grep -q "^${skill}$"; then
                    echo "  - $skill"
                fi
            done
    fi
}

# Generate JSON report
generate_json() {
    echo "{"
    echo "  \"period_days\": $DAYS,"
    echo "  \"generated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"skills\": ["
    
    first=true
    grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | \
        sed 's/"skill_name":"//;s/"$//' | \
        sort -u | \
        while read skill; do
            if [[ "$first" == "true" ]]; then
                first=false
            else
                echo ","
            fi
            
            if [[ -n "$CUTOFF" ]]; then
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE" | filter_by_date)
            else
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE")
            fi
            
            total=$(echo "$entries" | wc -l)
            proper=$(echo "$entries" | grep '"correctness":"proper"' | wc -l)
            improper=$(echo "$entries" | grep '"correctness":"improper"' | wc -l)
            unknown=$(echo "$entries" | grep '"correctness":"unknown"' | wc -l)
            
            echo -n "    {\"name\":\"$skill\",\"total\":$total,\"proper\":$proper,\"improper\":$improper,\"unknown\":$unknown}"
        done
    
    echo ""
    echo "  ]"
    echo "}"
}

# Generate markdown report
generate_markdown() {
    echo "# Skill Usage Report"
    echo ""
    echo "**Period:** Last $DAYS days  "
    echo "**Generated:** $(date)"
    echo ""
    
    echo "## Usage Summary"
    echo ""
    echo "| Skill | Uses | Proper | Improper | Rate |"
    echo "|-------|------|--------|----------|------|"
    
    grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | \
        sed 's/"skill_name":"//;s/"$//' | \
        sort -u | \
        while read skill; do
            if [[ -n "$CUTOFF" ]]; then
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE" | filter_by_date)
            else
                entries=$(grep "\"skill_name\":\"$skill\"" "$DATA_FILE")
            fi
            
            total=$(echo "$entries" | wc -l)
            proper=$(echo "$entries" | grep '"correctness":"proper"' | wc -l)
            improper=$(echo "$entries" | grep '"correctness":"improper"' | wc -l)
            
            if [[ $((proper + improper)) -gt 0 ]]; then
                rate=$(( proper * 100 / (proper + improper) ))
            else
                rate="N/A"
            fi
            
            echo "| $skill | $total | $proper | $improper | $rate |"
        done
    
    # Unused skills
    if [[ -d "$SKILLS_DIR" ]]; then
        echo ""
        echo "## Unused Skills"
        echo ""
        echo "These skills are available but have not been used in the tracked period:"
        echo ""
        
        used_skills=$(grep -o '"skill_name":"[^"]*"' "$DATA_FILE" | sed 's/"skill_name":"//;s/"$//' | sort -u)
        
        find "$SKILLS_DIR" -name "SKILL.md" -exec dirname {} \; | \
            xargs -n1 basename | \
            sort -u | \
            while read skill; do
                if ! echo "$used_skills" | grep -q "^${skill}$"; then
                    echo "- $skill"
                fi
            done
    fi
    
    echo ""
    echo "---"
    echo "*Report generated by skill-tracker*"
}

# Main execution
case "$ACTION" in
    stats)
        generate_stats
        ;;
    report)
        case "$OUTPUT" in
            json)
                generate_json
                ;;
            markdown|md)
                generate_markdown
                ;;
            *)
                generate_table
                ;;
        esac
        ;;
    *)
        echo "Unknown action: $ACTION"
        echo "Use: stats, report"
        exit 1
        ;;
esac
