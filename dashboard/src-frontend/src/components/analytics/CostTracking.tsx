// === CostTracking Component ===
// Display estimated cost tracking from sessions

import { useMemo } from 'react';
import { useSessions } from '../../hooks/useData';
import { TrendUp, TrendDown, CurrencyDollar } from '@phosphor-icons/react';

const MODEL_COST_PER_1K_TOKENS: Record<string, number> = {
  'qwen3.6': 0.0005,
  'qwen3.6-flash': 0.0002,
  'claude-3-haiku': 0.00025,
  'gpt-4o-mini': 0.00015,
  'llama-3.3-70b': 0.0008,
  'default': 0.0003,
};

export function CostTracking() {
  const { data: sessions } = useSessions({ enabled: true });

  const costData = useMemo(() => {
    if (!sessions) return null;
    
    let totalCost = 0;
    let totalTokens = 0;
    const dailyCosts: Record<string, number> = {};
    const modelCosts: Record<string, number> = {};
    
    sessions.forEach(session => {
      // Estimate tokens based on message count (rough approximation)
      const estimatedTokens = session.messageCount * 500; // ~500 tokens per message
      const model = session.modelId?.toLowerCase() || 'default';
      const costPer1K = MODEL_COST_PER_1K_TOKENS[model] || MODEL_COST_PER_1K_TOKENS.default;
      const sessionCost = (estimatedTokens / 1000) * costPer1K;
      
      totalCost += sessionCost;
      totalTokens += estimatedTokens;
      
      // Group by date
      const date = new Date(session.timestamp).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + sessionCost;
      
      // Group by model
      modelCosts[model] = (modelCosts[model] || 0) + sessionCost;
    });
    
    // Calculate trends
    const dates = Object.keys(dailyCosts).sort();
    const recentCost = dates.slice(-7).reduce((sum, date) => sum + dailyCosts[date], 0);
    const previousCost = dates.slice(-14, -7).reduce((sum, date) => sum + dailyCosts[date], 0);
    const trend = previousCost > 0 ? ((recentCost - previousCost) / previousCost) * 100 : 0;
    
    return {
      totalCost,
      totalTokens,
      recentCost,
      trend,
      dailyCosts,
      modelCosts,
    };
  }, [sessions]);

  if (!costData || costData.totalCost === 0) {
    return (
      <div className="bg-bg0-hard border border-bg2 p-4">
        <h3 className="text-sm font-medium text-fg1 mb-2">Cost Tracking</h3>
        <div className="text-xs text-fg4">No cost data available.</div>
      </div>
    );
  }

  return (
    <div className="bg-bg0-hard border border-bg2 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-fg1">Cost Tracking</h3>
        <CurrencyDollar className="w-4 h-4 text-fg4" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg3">Total Estimated Cost</span>
          <span className="text-lg font-bold text-fg1">
            ${costData.totalCost.toFixed(4)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg3">Total Tokens</span>
          <span className="text-sm font-medium text-fg1">
            {(costData.totalTokens / 1000).toFixed(1)}K
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg3">Last 7 Days</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-fg1">
              ${costData.recentCost.toFixed(4)}
            </span>
            {costData.trend !== 0 && (
              <div className={`flex items-center gap-0.5 text-xs ${costData.trend > 0 ? 'text-red-bright' : 'text-green-bright'}`}>
                {costData.trend > 0 ? <TrendUp className="w-3 h-3" /> : <TrendDown className="w-3 h-3" />}
                {Math.abs(costData.trend).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-3 border-t border-bg2">
          <h4 className="text-xs font-medium text-fg3 mb-2">Cost by Model</h4>
          <div className="space-y-1">
            {Object.entries(costData.modelCosts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([model, cost]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-xs text-fg4 truncate">{model}</span>
                  <span className="text-xs text-fg1">${cost.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}