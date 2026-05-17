'use client';

import { useState, useEffect, type ElementType } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare, Zap, DollarSign, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import type { UsageStats, DailyUsage } from '@/shared/types';

const MODEL_COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD'];
const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 3 months'];
const PERIOD_DAYS: Record<string, number> = {
  'Last 7 days': 7,
  'Last 30 days': 30,
  'Last 3 months': 90,
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatModelId(modelId: string): string {
  const map: Record<string, string> = {
    'amazon.nova-micro-v1:0': 'Amazon Nova Micro',
    'amazon.nova-lite-v1:0': 'Amazon Nova Lite',
    'amazon.nova-pro-v1:0': 'Amazon Nova Pro',
    'anthropic.claude-3-sonnet-20240229-v1:0': 'Claude 3 Sonnet',
    'anthropic.claude-3-haiku-20240307-v1:0': 'Claude 3 Haiku',
  };
  return map[modelId] ?? modelId;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function filterByPeriod(data: DailyUsage[], period: string): DailyUsage[] {
  const days = PERIOD_DAYS[period] ?? 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.date >= cutoffStr);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-gray-100 bg-white">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
        style={{ background: color + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-[22px] font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-[12px] text-gray-500 mb-1">{label}</div>
      <div className="text-[11px] font-medium text-gray-400">{sub}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { tokens: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-[12px]">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      <p className="text-gray-600">{payload[0].value} messages</p>
      <p className="text-gray-400">{(payload[0].payload.tokens / 1000).toFixed(1)}K tokens</p>
    </div>
  );
}

export function UsageTab() {
  const [period, setPeriod] = useState('Last 30 days');
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUsageStats()
      .then(setStats)
      .catch(() => setError('Failed to load usage data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-10 text-center text-[13px] text-gray-500">{error ?? 'No data available.'}</div>
    );
  }

  const filtered = filterByPeriod(stats.dailyUsage, period);
  const tickCount = filtered.length <= 7 ? filtered.length : 6;
  const chartData = filtered.map((d, i) => ({
    displayDate: i % Math.max(1, Math.floor(filtered.length / tickCount)) === 0 ? formatDate(d.date) : '',
    messages: d.messageCount,
    tokens: d.inputTokens + d.outputTokens,
  }));

  const modelBreakdown = stats.modelBreakdown;

  const totalMsgs = filtered.reduce((s, d) => s + d.messageCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total messages"
          value={stats.totalMessages.toLocaleString()}
          sub="All time"
          color="#6366F1"
        />
        <StatCard
          icon={Zap}
          label="Tokens used"
          value={formatTokens(stats.totalTokens)}
          sub="Input + output"
          color="#8B5CF6"
        />
        <StatCard
          icon={DollarSign}
          label="Estimated cost"
          value={`$${stats.estimatedCostUsd.toFixed(4)}`}
          sub="All time"
          color="#06B6D4"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">Daily Messages</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {totalMsgs.toLocaleString()} total in selected period
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {p.replace('Last ', '')}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            barSize={period === 'Last 7 days' ? 28 : 10}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#F3F4F6" strokeDasharray="0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F3FF' }} />
            <Bar dataKey="messages" fill="#6366F1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">Model Breakdown</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">Usage split across AI models</p>
          </div>
          <button className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {modelBreakdown.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-gray-400">No model data available.</div>
        ) : (
          <>
        <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-0.5">
          {modelBreakdown.map((m, i) => (
            <div
              key={m.modelId}
              style={{ width: `${m.percentage}%`, background: MODEL_COLORS[i % MODEL_COLORS.length] }}
              className="rounded-full"
            />
          ))}
        </div>

        <div className="space-y-3">
          {modelBreakdown.map((m, i) => (
            <div key={m.modelId} className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-gray-800 font-medium">{formatModelId(m.modelId)}</span>
                  <span className="text-[12px] text-gray-500">
                    {formatTokens(m.tokenCount)} tokens
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.percentage}%`, background: MODEL_COLORS[i % MODEL_COLORS.length] }}
                  />
                </div>
              </div>
              <span className="text-[12px] font-semibold text-gray-700 w-9 text-right flex-shrink-0">
                {m.percentage}%
              </span>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
