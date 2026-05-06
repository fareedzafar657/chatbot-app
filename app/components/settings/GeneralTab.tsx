'use client';

import { useState } from 'react';
import { Check, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

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

export function GeneralTab() {
  const user = useAuthStore((state) => state.user);
  const updateName = useAuthStore((state) => state.updateName);
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateName(name.trim() || (user?.name ?? ''));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Section title="Profile" description="Your public profile information.">
        <div className="flex items-start gap-5 mb-5">
          <div className="relative flex-shrink-0 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-white text-[18px] font-semibold">{user?.initials ?? 'JD'}</span>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">Email</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                />
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <Check className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-600 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all leading-relaxed"
          />
        </div>
      </Section>

      <Section title="Language & Region" description="Set your preferred language and format.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Language</label>
            <Select
              value={language}
              onChange={setLanguage}
              options={[
                'English (US)',
                'English (UK)',
                'French',
                'German',
                'Spanish',
                'Japanese',
              ]}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Timezone</label>
            <Select
              value="UTC-8 (Pacific)"
              onChange={() => {}}
              options={[
                'UTC-8 (Pacific)',
                'UTC-5 (Eastern)',
                'UTC+0 (GMT)',
                'UTC+1 (CET)',
                'UTC+8 (CST)',
                'UTC+9 (JST)',
              ]}
            />
          </div>
        </div>
      </Section>

      <div className="pt-6 space-y-2">
        {saveError && (
          <p className="text-[12px] text-red-600">{saveError}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-60 ${
            saved ? 'bg-emerald-600 text-white' : 'bg-[#18181B] hover:bg-black text-white shadow-sm'
          }`}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </div>
  );
}
