'use client';

import { useState } from 'react';
import {
  Eye, EyeOff, Shield, Key, Monitor, Smartphone, Copy, Plus, Trash2, Check,
} from 'lucide-react';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex gap-8">
        <div className="w-[220px] flex-shrink-0">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-0.5">{title}</h3>
          {description && (
            <p className="text-[12px] text-gray-500 leading-relaxed">{description}</p>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: 'k1',
    name: 'Production',
    prefix: 'sk-prod-a1B2...',
    created: 'Apr 12, 2026',
    lastUsed: '2 hours ago',
  },
  {
    id: 'k2',
    name: 'Development',
    prefix: 'sk-dev-x9Y8...',
    created: 'Mar 28, 2026',
    lastUsed: '5 days ago',
  },
];

const SESSIONS = [
  {
    id: 's1',
    device: 'Chrome on macOS',
    location: 'San Francisco, US',
    lastActive: 'Active now',
    icon: Monitor,
    current: true,
  },
  {
    id: 's2',
    device: 'Safari on iPhone',
    location: 'San Francisco, US',
    lastActive: '2 days ago',
    icon: Smartphone,
    current: false,
  },
  {
    id: 's3',
    device: 'Chrome on Windows',
    location: 'New York, US',
    lastActive: '5 days ago',
    icon: Monitor,
    current: false,
  },
];

export function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const createKey = () => {
    const newKey: ApiKey = {
      id: `k${Date.now()}`,
      name: `Key ${apiKeys.length + 1}`,
      prefix: 'sk-new-' + Math.random().toString(36).slice(2, 6) + '...',
      created: 'May 3, 2026',
      lastUsed: 'Never',
    };
    setApiKeys((prev) => [...prev, newKey]);
  };

  const handleSavePassword = () => {
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  return (
    <div>
      <Section
        title="Change Password"
        description="Update your account password. Use a strong, unique password."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
              Current password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <button
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2 pr-10 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
              <button
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
          <button
            onClick={handleSavePassword}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all mt-1 ${
              passwordSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-[#18181B] hover:bg-black text-white'
            }`}
          >
            {passwordSaved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Updated!
              </>
            ) : (
              'Update password'
            )}
          </button>
        </div>
      </Section>

      <Section
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account."
      >
        <div
          className={`rounded-xl border p-4 transition-all ${
            twoFactor ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                twoFactor ? 'bg-emerald-100' : 'bg-gray-100'
              }`}
            >
              <Shield
                className={`${twoFactor ? 'text-emerald-600' : 'text-gray-500'}`}
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-gray-900">Authenticator App</div>
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    {twoFactor ? 'Enabled — using an authenticator app' : 'Not configured'}
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactor((p) => !p)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                    twoFactor
                      ? 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-violet-400 hover:text-violet-700'
                  }`}
                >
                  {twoFactor ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Active Sessions" description="Manage all your active login sessions.">
        <div className="space-y-2">
          {SESSIONS.map((session) => {
            const Icon = session.icon;
            return (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-gray-800">{session.device}</span>
                    {session.current && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {session.location} · {session.lastActive}
                  </div>
                </div>
                {!session.current && (
                  <button className="text-[12px] text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button className="text-[12px] text-red-600 hover:text-red-700 font-medium mt-3 transition-colors">
          Sign out of all other sessions
        </button>
      </Section>

      <Section title="API Keys" description="Manage your API keys for programmatic access.">
        <div className="space-y-2 mb-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white"
            >
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Key className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-800">{key.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-[11px] text-gray-500 font-mono">{key.prefix}</code>
                  <span className="text-gray-300">·</span>
                  <span className="text-[11px] text-gray-400">Last used {key.lastUsed}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(key.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {copiedId === key.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => revokeKey(key.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={createKey}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium text-gray-700 border border-gray-200 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Create new key
        </button>
      </Section>
    </div>
  );
}
