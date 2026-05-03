'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MessageSquare, Zap, Activity, Download } from 'lucide-react';

const DAILY_DATA = (() => {
  const values = [
    12, 28, 19, 34, 45, 38, 22, 15, 41, 53, 47, 29, 18, 36, 44, 31, 27, 55, 48, 33, 20, 14, 39,
    52, 41, 26, 17, 43, 51, 37,
  ];
  const now = new Date('2026-05-03');
  return values.map((messages, i) => {
    const date = new Date(now.getTime() - (29 - i) * 86400000);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages,
      tokens: messages * 820 + Math.floor(Math.random() * 2000),
    };
  });
})();

const MODEL_DATA = [
  { model: 'GPT-4o', messages: 812, tokens: '620K', percent: 65, color: '#6366F1' },
  { model: 'Claude 3.5 Sonnet', messages: 312, tokens: '198K', percent: 25, color: '#8B5CF6' },
  { model: 'GPT-4o mini', messages: 98, tokens: '62K', percent: 8, color: '#A78BFA' },
  { model: 'GPT-3.5 Turbo', messages: 25, tokens: '12K', percent: 2, color: '#C4B5FD' },
];

const totalMessages = DAILY_DATA.reduce((s, d) => s + d.messages, 0);
const totalTokens = DAILY_DATA.reduce((s, d) => s + d.tokens, 0);

const PERIODS = ['Last 7 days', 'Last 30 days', 'Last 3 months'];

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: string;
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
      <div className="text-[11px] font-medium" style={{ color }}>
        {delta}
      </div>
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

  const sliceCount = period === 'Last 7 days' ? 7 : period === 'Last 30 days' ? 30 : 90;
  const displayData = DAILY_DATA.slice(-Math.min(sliceCount, DAILY_DATA.length));
  const tickCount = displayData.length <= 7 ? displayData.length : 6;

  const displayedData = displayData.map((d, i) => ({
    ...d,
    displayDate: i % Math.floor(displayData.length / tickCount) === 0 ? d.date : '',
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total messages"
          value={totalMessages.toLocaleString()}
          delta="↑ 12% vs last month"
          color="#6366F1"
        />
        <StatCard
          icon={Zap}
          label="Tokens used"
          value={`${(totalTokens / 1000).toFixed(0)}K`}
          delta="↑ 8% vs last month"
          color="#8B5CF6"
        />
        <StatCard
          icon={Activity}
          label="Avg. per day"
          value={Math.round(totalMessages / 30).toString()}
          delta="↑ 4% vs last month"
          color="#06B6D4"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[13px] font-semibold text-gray-900">Daily Messages</h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {totalMessages.toLocaleString()} total over 30 days
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.replace('Last ', '')}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={displayedData}
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

        <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-0.5">
          {MODEL_DATA.map((m) => (
            <div
              key={m.model}
              style={{ width: `${m.percent}%`, background: m.color }}
              className="rounded-full"
            />
          ))}
        </div>

        <div className="space-y-3">
          {MODEL_DATA.map((m) => (
            <div key={m.model} className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: m.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-gray-800 font-medium">{m.model}</span>
                  <span className="text-[12px] text-gray-500">
                    {m.messages.toLocaleString()} msgs · {m.tokens} tokens
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${m.percent}%`, background: m.color }}
                  />
                </div>
              </div>
              <span className="text-[12px] font-semibold text-gray-700 w-9 text-right flex-shrink-0">
                {m.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
