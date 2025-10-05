'use client';

import React, { useEffect, useState } from 'react';

type Profile = {
  name: string;
  email: string;
  address?: string | null;
  phoneNumber?: string | null;
};

export default function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  async function loadProfile() {
    try {
      setInitialLoading(true);
      const res = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to load profile (${res.status})`);
      const prof: Profile = data;
      setForm((f) => ({
        ...f,
        name: prof.name ?? '',
        email: (prof.email ?? '').toLowerCase(),
        address: prof.address ?? '',
        phoneNumber: prof.phoneNumber ?? '',
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setMessage(null);
      setError(null);
      loadProfile();
    }
  }, [open]);

  function onChange<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const emailLower = form.email.trim().toLowerCase();
    if (!form.name.trim()) return setError('Name is required');
    if (!emailLower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return setError('Valid email is required');
    if (!form.password || form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: emailLower,
          password: form.password,
          address: form.address.trim(),
          phoneNumber: form.phoneNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile');
      setMessage('Profile updated successfully');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    setError(null);
    setMessage(null);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-2xl bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <button aria-label="Close" onClick={onClose} className="p-2 rounded-md hover:bg-gray-100">✕</button>
        </div>

        {initialLoading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={onChange('name')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange('email')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={onChange('phoneNumber')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="(555) 555-5555"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={onChange('address')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="123 Main St"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={onChange('password')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={onChange('confirmPassword')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Reset Password Fields
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

