'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { fetchApi } from '@/lib/api';
import { ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res.token) {
        login(res.token);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600/20 text-teal-400 mb-4 border border-teal-500/30">
          <FileCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Three-Way Match Engine</h2>
        <p className="mt-2 text-sm text-slate-400">PO, GRN & Invoice Automated Reconciliation Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-4 shadow-xl border border-slate-700/60 sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300">Username / Email</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Demo Bearer token auth is configured. Any login credentials will generate static JWT.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
