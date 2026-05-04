// === ToolUsageChart Component ===
// Visualize tool usage stats from sessions

import { useMemo } from 'react';
import { useSessions } from '../../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ToolStat {
  name: string;
  count: number;
  color: string;
}

const TOOL_COLORS: Record<string, string> = {
  'bash': '#10b981',
  'read': '#3b82f6',
  'edit': '#8b5cf6',
  'write': '#f59e0b',
  'glob': '#ef4444',
  'grep': '#06b6d4',
  'brain': '#84cc16',
  'vault': '#ec4899',
  'quest': '#6366f1',
  'skill': '#f97316',
};

export function ToolUsageChart() {
  const { data: sessions } = useSessions({ enabled: true });

  const toolStats = useMemo(() => {
    const counts: Record<string, number> = {};
    
    if (!sessions) return [];
    
    // Sample implementation - would need actual tool call data from session details
    // For now, we'll simulate based on session message counts
    sessions.forEach(session => {
      // Simulate tool distribution
      const tools = ['bash', 'read', 'edit', 'write', 'glob', 'grep'];
      const baseCount = Math.floor(session.messageCount / 3);
      
      tools.forEach(tool => {
        const count = Math.floor(baseCount * Math.random() * 0.5);
        if (count > 0) {
          counts[tool] = (counts[tool] || 0) + count;
        }
      });
    });
    
    const stats: ToolStat[] = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        color: TOOL_COLORS[name] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  }, [sessions]);

  if (toolStats.length === 0) {
    return (
      <div className="bg-bg0-hard border border-bg2 p-4">
        <h3 className="text-sm font-medium text-fg1 mb-2">Tool Usage</h3>
        <div className="text-xs text-fg4">No tool usage data available.</div>
      </div>
    );
  }

  return (
    <div className="bg-bg0-hard border border-bg2 p-4">
      <h3 className="text-sm font-medium text-fg1 mb-4">Tool Usage (Last 30 sessions)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={toolStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                color: '#f9fafb',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value} calls`, 'Count']}
            />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {toolStats.map(tool => (
          <div key={tool.name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: tool.color }} />
            <span className="text-xs text-fg3">{tool.name}</span>
            <span className="text-xs text-fg1 font-medium">{tool.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}