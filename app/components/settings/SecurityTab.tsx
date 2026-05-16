'use client';

import { useState } from 'react';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { updatePassword } from 'aws-amplify/auth';
import { cn } from '@/lib/cn';
import { Section } from './Section';

interface PasswordFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show?: boolean;
  onToggleShow?: () => void;
}

function PasswordField({ label, placeholder, value, onChange, show, onToggleShow }: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all',
            onToggleShow ? 'pr-10' : ''
          )}
        />
        {onToggleShow && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
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
    } catch {
      setError('Failed to update password. Please check your current password and try again.');
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
          <PasswordField
            label="Current password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((p) => !p)}
          />
          <PasswordField
            label="New password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((p) => !p)}
          />
          <PasswordField
            label="Confirm new password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            onClick={handleSavePassword}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all mt-1 disabled:opacity-60',
              saved ? 'bg-emerald-600 text-white' : 'bg-[#18181B] hover:bg-black text-white'
            )}
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
