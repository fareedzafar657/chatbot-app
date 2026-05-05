'use client';

import { useState } from 'react';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { updatePassword } from 'aws-amplify/auth';

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

export function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSavePassword = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setSaving(false);
    }
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
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            onClick={handleSavePassword}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all mt-1 disabled:opacity-60 ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-[#18181B] hover:bg-black text-white'
            }`}
          >
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</>
            ) : saved ? (
              <><Check className="w-3.5 h-3.5" /> Updated!</>
            ) : (
              'Update password'
            )}
          </button>
        </div>
      </Section>
    </div>
  );
}
