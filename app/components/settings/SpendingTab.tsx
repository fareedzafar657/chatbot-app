'use client';

import { useState } from 'react';
import { CreditCard, Download, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Section } from './Section';

const INVOICES = [
  { id: 'inv-1', date: 'May 1, 2026', amount: '$20.00', status: 'Upcoming', plan: 'Pro Plan' },
  { id: 'inv-2', date: 'Apr 1, 2026', amount: '$18.40', status: 'Paid', plan: 'Pro Plan' },
  { id: 'inv-3', date: 'Mar 1, 2026', amount: '$20.00', status: 'Paid', plan: 'Pro Plan' },
  { id: 'inv-4', date: 'Feb 1, 2026', amount: '$20.00', status: 'Paid', plan: 'Pro Plan' },
  { id: 'inv-5', date: 'Jan 1, 2026', amount: '$16.80', status: 'Paid', plan: 'Pro Plan' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: ['5 messages/day', 'GPT-3.5 only', 'No API access'],
    current: false,
  },
  {
    name: 'Pro',
    price: '$20',
    features: ['Unlimited messages', 'All models', 'API access', 'Branch manager'],
    current: true,
  },
  {
    name: 'Team',
    price: '$60',
    features: ['Everything in Pro', 'Up to 5 seats', 'Team analytics', 'Priority support'],
    current: false,
  },
];

export function SpendingTab() {
  const [limit, setLimit] = useState(50);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const currentUsage = 18.4;
  const percentUsed = (currentUsage / limit) * 100;

  return (
    <div>
      <Section title="Current Plan" description="Manage your subscription and billing.">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-xl border p-4 transition-all relative',
                plan.current ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              {plan.current && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Current
                  </span>
                </div>
              )}
              <div className="text-[13px] font-semibold text-gray-900 mb-0.5">{plan.name}</div>
              <div className="mb-3">
                <span className="text-[20px] font-bold text-gray-900">{plan.price}</span>
                <span className="text-[11px] text-gray-500">/mo</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                    <Check className="w-3 h-3 text-violet-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button className="w-full py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 text-gray-700 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all">
                  {plan.price === '$0' ? 'Downgrade' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="text-[12px] text-gray-600">
            Your plan renews on{' '}
            <span className="font-semibold text-gray-800">June 1, 2026</span>.
          </div>
          <button className="ml-auto text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors flex-shrink-0">
            Cancel plan
          </button>
        </div>
      </Section>

      <Section title="Payment Method" description="Your current payment method on file.">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white mb-3">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-gray-900">Visa ending in 4242</div>
            <div className="text-[11px] text-gray-500">Expires 08/2028</div>
          </div>
          <button className="text-[12px] text-gray-600 hover:text-violet-700 font-medium transition-colors">
            Update
          </button>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-violet-700 font-medium transition-colors">
          <span className="text-lg leading-none">+</span> Add payment method
        </button>
      </Section>

      <Section
        title="Spending Limit"
        description="Set a monthly spending cap to avoid unexpected charges."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[13px] font-medium text-gray-800">
                  This Month&apos;s Spending
                </span>
                <div className="text-[11px] text-gray-500 mt-0.5">May 1 – May 31, 2026</div>
              </div>
              <div className="text-right">
                <span className="text-[18px] font-bold text-gray-900">
                  ${currentUsage.toFixed(2)}
                </span>
                <div className="text-[11px] text-gray-500">of ${limit} limit</div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-gray-400">${currentUsage.toFixed(2)} used</span>
              <span className="text-[11px] text-gray-400">
                ${(limit - currentUsage).toFixed(2)} remaining
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-gray-700">Monthly limit</label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-500">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) =>
                    setLimit(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-16 px-2 py-1 text-[13px] font-medium border border-gray-200 rounded-lg bg-white text-center outline-none focus:border-violet-400 transition-all"
                />
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={500}
              step={10}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-[11px] text-gray-400 mt-1">
              <span>$10</span>
              <span>$500</span>
            </div>
          </div>

          <div className={cn(
            'flex items-start gap-3 p-3 rounded-xl border transition-all',
            alertEnabled ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
          )}>
            <AlertCircle className={cn(
              'w-4 h-4 mt-0.5 flex-shrink-0',
              alertEnabled ? 'text-amber-500' : 'text-gray-400'
            )} />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-gray-800">Spending alert</div>
              <div className="text-[12px] text-gray-500">
                Email me when I reach 80% of my limit
              </div>
            </div>
            <button
              onClick={() => setAlertEnabled((p) => !p)}
              className={cn(
                'flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                alertEnabled ? 'bg-amber-500' : 'bg-gray-200'
              )}
            >
              <span className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                alertEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
              )} />
            </button>
          </div>
        </div>
      </Section>

      <Section title="Billing History" description="Download past invoices for your records.">
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Date', 'Description', 'Amount', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={cn(
                    'border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors',
                    i === 0 ? 'bg-violet-50/40' : ''
                  )}
                >
                  <td className="px-4 py-3 text-[13px] text-gray-700">{inv.date}</td>
                  <td className="px-4 py-3 text-[13px] text-gray-700">{inv.plan}</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-900">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-violet-50 text-violet-700 border border-violet-100'
                      )}
                    >
                      {inv.status === 'Paid' && <Check className="w-2.5 h-2.5 mr-1" />}
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
