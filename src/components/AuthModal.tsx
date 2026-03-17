'use client';

import { useState } from 'react';
import { X, User, LogOut, Save } from 'lucide-react';
import { useWalletStore, createProfile } from '@/lib/store';

type View = 'main' | 'signup' | 'profile';

interface Props {
  onClose: () => void;
}

const AVATAR_COLORS = ['#00E5A0', '#627EEA', '#9945FF', '#FF007A', '#F7931A', '#28A0F0'];

export function AuthModal({ onClose }: Props) {
  const { profile, setProfile, clearProfile } = useWalletStore();
  const [view, setView] = useState<View>(profile ? 'profile' : 'main');
  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [chosenColor, setChosenColor] = useState(profile?.avatarColor ?? AVATAR_COLORS[0]);
  const [saved, setSaved] = useState(false);

  function handleSignUp() {
    if (!name.trim()) return;
    const p = createProfile(name.trim(), email.trim() || undefined);
    setProfile({ ...p, avatarColor: chosenColor });
    setSaved(true);
    setTimeout(onClose, 900);
  }

  function handleUpdateProfile() {
    if (!profile || !name.trim()) return;
    setProfile({ ...profile, displayName: name.trim(), email: email.trim() || undefined, avatarColor: chosenColor });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleSignOut() {
    clearProfile();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[400px] bg-[#0E1117] border border-[#1E2530] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2530]">
          <div>
            <div className="text-[14px] font-black text-slate-100">
              {profile ? 'Your Profile' : 'Create Profile'}
            </div>
            <div className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
              Pablito saves your bags locally
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">

          {/* Landing — no profile */}
          {view === 'main' && !profile && (
            <div>
              <div className="text-center py-4 mb-5">
                <div className="text-5xl mb-3">🧳</div>
                <div className="text-[13px] font-bold text-slate-300 mb-1">Save your bags</div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Create a profile to keep your wallets and preferences saved across sessions.
                  Everything stays on your device.
                </div>
              </div>
              <button
                onClick={() => setView('signup')}
                className="w-full py-3 rounded-xl bg-brand/15 border border-brand/30 text-brand text-[12px] font-bold hover:bg-brand/25 transition-all"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                CREATE PROFILE
              </button>
              <div className="mt-3 text-center text-[10px] text-slate-600" style={{ fontFamily: 'var(--font-mono)' }}>
                No account required · Stored locally
              </div>
            </div>
          )}

          {/* Sign up form */}
          {view === 'signup' && (
            <div className="space-y-4">
              {/* Avatar color picker */}
              <div>
                <label className="text-[10px] text-slate-500 mb-2 block uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                  Avatar color
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setChosenColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: chosenColor === c ? '#fff' : 'transparent',
                        transform: chosenColor === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                  Display name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name or alias…"
                  className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="For future cloud sync…"
                  className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <button
                onClick={handleSignUp}
                disabled={!name.trim() || saved}
                className="w-full py-2.5 rounded-xl bg-brand/15 border border-brand/30 text-brand text-[12px] font-bold hover:bg-brand/25 transition-all disabled:opacity-50"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {saved ? '✓ SAVED' : 'SAVE PROFILE'}
              </button>
            </div>
          )}

          {/* Profile view (already has one) */}
          {view === 'profile' && profile && (
            <div className="space-y-4">
              {/* Avatar preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080A0D] border border-[#1E2530]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-black text-[#080A0D] flex-shrink-0"
                  style={{ background: chosenColor }}
                >
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-200">{profile.displayName}</div>
                  <div className="text-[10px] text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>
                    {profile.email ?? 'No email · local profile'}
                  </div>
                </div>
              </div>

              {/* Avatar color picker */}
              <div>
                <label className="text-[10px] text-slate-500 mb-2 block uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                  Avatar color
                </label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setChosenColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: chosenColor === c ? '#fff' : 'transparent',
                        transform: chosenColor === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                  Display name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[13px] text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 mb-1 block" style={{ fontFamily: 'var(--font-mono)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#080A0D] border border-[#1E2530] rounded-xl px-3 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/50"
                  placeholder="Email (optional)"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand/15 border border-brand/30 text-brand text-[11px] font-bold hover:bg-brand/25 transition-all"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <Save size={12} />
                  {saved ? 'SAVED ✓' : 'SAVE'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-[11px] font-bold hover:bg-red-500/10 transition-all"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <LogOut size={12} />
                  SIGN OUT
                </button>
              </div>

              <div className="text-[10px] text-slate-700 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
                Your profile is stored locally on this device
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
