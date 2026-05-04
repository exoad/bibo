// === CostTracking Component ===
// Display estimated cost tracking from sessions

import { useMemo } from 'react';
import { useSessions } from '../../hooks/useData';
import { TrendUp, TrendDown, CurrencyDollar } from '@phosphor-icons/react';

// Pricing per 1K tokens (input + output averaged, or input pricing)
// Based on latest API pricing as of 2026-05-04
// Format: $ per 1K tokens (input pricing shown, output is typically 2-5x higher)
const MODEL_COST_PER_1K_TOKENS: Record<string, number> = {
  // OpenAI Models (https://platform.openai.com/docs/pricing)
  'gpt-4o': 0.0025,              // $2.50 / MTok input
  'gpt-4o-mini': 0.00015,        // $0.15 / MTok input
  'gpt-4.1': 0.002,              // $2.00 / MTok input
  'gpt-4.1-mini': 0.0004,        // $0.40 / MTok input
  'gpt-4.1-nano': 0.0001,        // $0.10 / MTok input
  'o3': 0.002,                   // $2.00 / MTok input
  'o3-pro': 0.020,               // $20.00 / MTok input
  'o3-mini': 0.0011,             // $1.10 / MTok input
  'o4-mini': 0.0011,             // $1.10 / MTok input (same as o3-mini)
  
  // Anthropic Claude Models (https://docs.anthropic.com/en/about-claude/pricing)
  'claude-opus-4.7': 0.005,      // $5.00 / MTok input
  'claude-opus-4.6': 0.005,      // $5.00 / MTok input
  'claude-opus-4.5': 0.005,      // $5.00 / MTok input
  'claude-opus-4': 0.005,        // $5.00 / MTok input
  'claude-opus': 0.005,          // $5.00 / MTok input
  'claude-sonnet-4.6': 0.003,    // $3.00 / MTok input
  'claude-sonnet-4.5': 0.003,    // $3.00 / MTok input
  'claude-sonnet-4': 0.003,      // $3.00 / MTok input
  'claude-sonnet': 0.003,        // $3.00 / MTok input
  'claude-haiku-4.5': 0.001,     // $1.00 / MTok input
  'claude-haiku-4': 0.001,       // $1.00 / MTok input
  'claude-haiku': 0.001,         // $1.00 / MTok input
  'claude-3-haiku': 0.001,       // $1.00 / MTok input
  'claude-3-sonnet': 0.003,      // $3.00 / MTok input
  'claude-3-opus': 0.005,        // $5.00 / MTok input
  
  // Local/Custom Models (estimated)
  'qwen3.6': 0.0005,
  'qwen3.6-flash': 0.0002,
  'llama-3.3-70b': 0.0008,
  'llama-3.1-70b': 0.0008,
  'default': 0.0003,
};

// Helper to find matching cost entry for a model ID
function getModelCost(modelId: string): number {
  const normalized = modelId?.toLowerCase() || '';
  
  // Exact match first
  if (MODEL_COST_PER_1K_TOKENS[normalized]) {
    return MODEL_COST_PER_1K_TOKENS[normalized];
  }
  
  // Try to match partial model names
  for (const [key, cost] of Object.entries(MODEL_COST_PER_1K_TOKENS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return cost;
    }
  }
  
  // Provider-specific fallbacks
  if (normalized.includes('claude') || normalized.includes('anthropic')) {
    return MODEL_COST_PER_1K_TOKENS['claude-sonnet']; // Default to sonnet pricing
  }
  if (normalized.includes('gpt-4') || normalized.includes('openai')) {
    return MODEL_COST_PER_1K_TOKENS['gpt-4o']; // Default to gpt-4o pricing
  }
  if (normalized.includes('o3') || normalized.includes('o4')) {
    return MODEL_COST_PER_1K_TOKENS['o3']; // Default to o3 pricing
  }
  
  return MODEL_COST_PER_1K_TOKENS.default;
}

export function CostTracking() {
  const { data: sessions } = useSessions({ enabled: true });

  const costData = useMemo(() => {
    if (!sessions) return null;
    
    let totalCost = 0;
    let totalTokens = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const dailyCosts: Record<string, number> = {};
    const modelCosts: Record<string, number> = {};
    const modelUsage: Record<string, { sessions: number; tokens: number; cost: number }> = {};
    
    sessions.forEach(session => {
      // More accurate token estimation:
      // - User messages (input): ~200 tokens per message
      // - Assistant messages (output): ~800 tokens per message (includes tool calls, reasoning)
      const messageCount = session.messageCount || 0;
      const estimatedInputTokens = Math.ceil(messageCount * 0.4) * 200; // 40% are user messages
      const estimatedOutputTokens = Math.ceil(messageCount * 0.6) * 800; // 60% are assistant/tool messages
      const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;
      
      const model = session.modelId?.toLowerCase() || 'default';
      const costPer1K = getModelCost(model);
      
      // Apply a 2.5x multiplier to account for output being more expensive than input
      // Most models charge 2-5x more for output tokens
      const adjustedCostPer1K = costPer1K * 2.5;
      const sessionCost = (estimatedTotalTokens / 1000) * adjustedCostPer1K;
      
      totalCost += sessionCost;
      totalTokens += estimatedTotalTokens;
      totalInputTokens += estimatedInputTokens;
      totalOutputTokens += estimatedOutputTokens;
      
      // Group by date
      const date = new Date(session.timestamp).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + sessionCost;
      
      // Group by model (normalize model name)
      const normalizedModel = model || 'unknown';
      modelCosts[normalizedModel] = (modelCosts[normalizedModel] || 0) + sessionCost;
      
      if (!modelUsage[normalizedModel]) {
        modelUsage[normalizedModel] = { sessions: 0, tokens: 0, cost: 0 };
      }
      modelUsage[normalizedModel].sessions += 1;
      modelUsage[normalizedModel].tokens += estimatedTotalTokens;
      modelUsage[normalizedModel].cost += sessionCost;
    });
    
    // Calculate trends
    const dates = Object.keys(dailyCosts).sort();
    const recentCost = dates.slice(-7).reduce((sum, date) => sum + dailyCosts[date], 0);
    const previousCost = dates.slice(-14, -7).reduce((sum, date) => sum + dailyCosts[date], 0);
    const trend = previousCost > 0 ? ((recentCost - previousCost) / previousCost) * 100 : 0;
    
    return {
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      recentCost,
      trend,
      dailyCosts,
      modelCosts,
      modelUsage,
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
          <div className="text-right">
            <span className="text-sm font-medium text-fg1">
              {(costData.totalTokens / 1000).toFixed(1)}K
            </span>
            <div className="text-xs text-fg4">
              ↓{(costData.totalInputTokens / 1000).toFixed(0)}K ↑{(costData.totalOutputTokens / 1000).toFixed(0)}K
            </div>
          </div>
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
            {Object.entries(costData.modelUsage)
              .sort(([, a], [, b]) => b.cost - a.cost)
              .slice(0, 5)
              .map(([model, usage]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                    <span className="text-xs text-fg4 truncate" title={model}>{model}</span>
                    <span className="text-xs text-fg-muted">
                      {usage.sessions} sess · {(usage.tokens / 1000).toFixed(0)}K tok
                    </span>
                  </div>
                  <span className="text-xs font-medium text-fg1">${usage.cost.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}