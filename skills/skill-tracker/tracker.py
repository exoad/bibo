#!/usr/bin/env python3
"""
Skill Tracker - Core tracking and reporting module
"""

import json
import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class UsageEntry:
    id: str
    skill_name: str
    timestamp: str
    trigger_source: str
    correctness: str  # "proper", "improper", "unknown"
    notes: str
    session_id: str
    context: str = ""


class SkillTracker:
    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            base_dir = Path.home() / "bibo" / ".pi" / "skill-tracker"
        self.base_dir = Path(base_dir)
        self.data_file = self.base_dir / "usage.jsonl"
        self.config_file = self.base_dir / "config.json"
        self.skills_dir = Path.home() / "bibo" / "skills"

        self._ensure_dirs()

    def _ensure_dirs(self):
        """Ensure data directory exists"""
        self.base_dir.mkdir(parents=True, exist_ok=True)
        if not self.data_file.exists():
            self.data_file.touch()

    def log_usage(
        self,
        skill_name: str,
        correctness: str = "unknown",
        notes: str = "",
        trigger_source: str = "/skill",
        context: str = "",
        session_id: Optional[str] = None,
    ) -> UsageEntry:
        """Log a skill usage event"""
        entry = UsageEntry(
            id=str(uuid.uuid4())[:8],
            skill_name=skill_name,
            timestamp=datetime.utcnow().isoformat() + "Z",
            trigger_source=trigger_source,
            correctness=correctness,
            notes=notes,
            session_id=session_id or str(int(datetime.utcnow().timestamp())),
            context=context,
        )

        with open(self.data_file, "a") as f:
            f.write(json.dumps(asdict(entry)) + "\n")

        return entry

    def load_entries(self, days: Optional[int] = None) -> list[UsageEntry]:
        """Load all entries, optionally filtered by days"""
        entries = []
        cutoff = None
        if days:
            cutoff = datetime.utcnow() - timedelta(days=days)

        if not self.data_file.exists():
            return entries

        with open(self.data_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if cutoff:
                        entry_time = datetime.fromisoformat(
                            data["timestamp"].replace("Z", "+00:00")
                        )
                        cutoff_aware = cutoff.replace(tzinfo=entry_time.tzinfo)
                        if entry_time < cutoff_aware:
                            continue
                    entries.append(UsageEntry(**data))
                except (json.JSONDecodeError, KeyError, ValueError):
                    continue

        return entries

    def get_stats(self, days: Optional[int] = None) -> dict:
        """Get overall statistics"""
        entries = self.load_entries(days)

        total = len(entries)
        proper = sum(1 for e in entries if e.correctness == "proper")
        improper = sum(1 for e in entries if e.correctness == "improper")
        unknown = sum(1 for e in entries if e.correctness == "unknown")

        # Skill counts
        skill_counts = defaultdict(
            lambda: {"total": 0, "proper": 0, "improper": 0, "unknown": 0}
        )
        for e in entries:
            skill_counts[e.skill_name]["total"] += 1
            skill_counts[e.skill_name][e.correctness] += 1

        # Available skills
        available = set()
        if self.skills_dir.exists():
            for skill_dir in self.skills_dir.iterdir():
                if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                    available.add(skill_dir.name)

        used = set(e.skill_name for e in entries)
        unused = available - used

        return {
            "total_entries": total,
            "proper": proper,
            "improper": improper,
            "unknown": unknown,
            "skill_stats": dict(skill_counts),
            "available_skills": len(available),
            "used_skills": len(used),
            "unused_skills": sorted(unused),
            "period_days": days,
        }

    def mark_correctness(
        self, entry_id: str, correctness: str, notes: str = ""
    ) -> bool:
        """Mark an entry's correctness. Returns True if found and updated."""
        if correctness not in ("proper", "improper", "unknown"):
            raise ValueError("correctness must be 'proper', 'improper', or 'unknown'")

        entries = []
        found = False

        with open(self.data_file) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if data.get("id") == entry_id:
                        data["correctness"] = correctness
                        if notes:
                            data["notes"] = notes
                        found = True
                    entries.append(data)
                except json.JSONDecodeError:
                    continue

        if found:
            with open(self.data_file, "w") as f:
                for entry in entries:
                    f.write(json.dumps(entry) + "\n")

        return found

    def get_needing_review(self, limit: int = 10) -> list[UsageEntry]:
        """Get entries with unknown correctness for review"""
        entries = self.load_entries()
        unknown = [e for e in entries if e.correctness == "unknown"]
        return unknown[-limit:]

    def generate_report(self, days: int = 30, format: str = "table") -> str:
        """Generate a formatted report"""
        stats = self.get_stats(days)

        if format == "json":
            return json.dumps(stats, indent=2)

        if format == "markdown":
            return self._markdown_report(stats, days)

        return self._table_report(stats, days)

    def _table_report(self, stats: dict, days: int) -> str:
        lines = [
            "=== Skill Usage Report (Last {} Days) ===".format(days),
            "",
            f"{'Skill':<25} | {'Uses':>6} | {'Proper':>7} | {'Improper':>8} | {'Rate':>6}",
            "-" * 25 + "|" + "-" * 8 + "|" + "-" * 9 + "|" + "-" * 10 + "|" + "-" * 7,
        ]

        for skill, counts in sorted(
            stats["skill_stats"].items(), key=lambda x: -x[1]["total"]
        ):
            total = counts["total"]
            proper = counts["proper"]
            improper = counts["improper"]
            judged = proper + improper
            rate = f"{proper * 100 // judged}%" if judged > 0 else "N/A"

            lines.append(
                f"{skill:<25} | {total:>6} | {proper:>7} | {improper:>8} | {rate:>6}"
            )

        if stats["unused_skills"]:
            lines.extend(["", "=== Unused Skills (Candidates for Pruning) ===", ""])
            for skill in stats["unused_skills"]:
                lines.append(f"  - {skill}")

        return "\n".join(lines)

    def _markdown_report(self, stats: dict, days: int) -> str:
        lines = [
            "# Skill Usage Report",
            "",
            f"**Period:** Last {days} days",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Summary",
            "",
            f"- Total entries: {stats['total_entries']}",
            f"- Proper usage: {stats['proper']}",
            f"- Improper usage: {stats['improper']}",
            f"- Needs review: {stats['unknown']}",
            f"- Available skills: {stats['available_skills']}",
            f"- Used skills: {stats['used_skills']}",
            "",
            "## Usage by Skill",
            "",
            "| Skill | Uses | Proper | Improper | Rate |",
            "|-------|------|--------|----------|------|",
        ]

        for skill, counts in sorted(
            stats["skill_stats"].items(), key=lambda x: -x[1]["total"]
        ):
            total = counts["total"]
            proper = counts["proper"]
            improper = counts["improper"]
            judged = proper + improper
            rate = f"{proper * 100 // judged}%" if judged > 0 else "N/A"
            lines.append(f"| {skill} | {total} | {proper} | {improper} | {rate} |")

        if stats["unused_skills"]:
            lines.extend(
                [
                    "",
                    "## Unused Skills",
                    "",
                    "These skills are available but have not been used:",
                    "",
                ]
            )
            for skill in stats["unused_skills"]:
                lines.append(f"- {skill}")

        lines.extend(["", "---", "*Generated by skill-tracker*"])

        return "\n".join(lines)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Skill Tracker")
    parser.add_argument("action", choices=["log", "report", "stats", "mark", "review"])
    parser.add_argument("--skill", "-s", help="Skill name")
    parser.add_argument(
        "--correctness",
        "-c",
        choices=["proper", "improper", "unknown"],
        default="unknown",
    )
    parser.add_argument("--notes", "-n", default="", help="Notes about usage")
    parser.add_argument("--context", help="Context of the usage")
    parser.add_argument(
        "--days", "-d", type=int, default=30, help="Days to include in report"
    )
    parser.add_argument(
        "--format", "-f", choices=["table", "json", "markdown"], default="table"
    )
    parser.add_argument("--entry-id", help="Entry ID for mark action")

    args = parser.parse_args()

    tracker = SkillTracker()

    if args.action == "log":
        if not args.skill:
            print("Error: --skill required for log action", file=sys.stderr)
            sys.exit(1)
        entry = tracker.log_usage(
            skill_name=args.skill,
            correctness=args.correctness,
            notes=args.notes,
            context=args.context or "",
        )
        print(f"Logged: {entry.skill_name} ({entry.correctness}) - ID: {entry.id}")

    elif args.action == "report":
        print(tracker.generate_report(days=args.days, format=args.format))

    elif args.action == "stats":
        stats = tracker.get_stats(args.days)
        print(f"Total entries: {stats['total_entries']}")
        print(
            f"Proper: {stats['proper']}, Improper: {stats['improper']}, Unknown: {stats['unknown']}"
        )
        print(f"Skills: {stats['used_skills']}/{stats['available_skills']} used")
        if stats["unused_skills"]:
            print(
                f"\nUnused ({len(stats['unused_skills'])}): {', '.join(stats['unused_skills'][:5])}..."
            )

    elif args.action == "mark":
        if not args.entry_id:
            print("Error: --entry-id required for mark action", file=sys.stderr)
            sys.exit(1)
        if tracker.mark_correctness(args.entry_id, args.correctness, args.notes):
            print(f"Marked {args.entry_id} as {args.correctness}")
        else:
            print(f"Entry {args.entry_id} not found", file=sys.stderr)
            sys.exit(1)

    elif args.action == "review":
        entries = tracker.get_needing_review()
        if not entries:
            print("No entries need review!")
        else:
            print(f"\n{len(entries)} entries need review:\n")
            for e in entries:
                print(f"ID: {e.id} | Skill: {e.skill_name} | Time: {e.timestamp}")
                print(f"  Context: {e.context or 'N/A'}")
                print(f"  Notes: {e.notes or 'N/A'}")
                print()


if __name__ == "__main__":
    main()
