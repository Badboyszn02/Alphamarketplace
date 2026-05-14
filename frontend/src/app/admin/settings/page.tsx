'use client';

import { useState, useEffect } from 'react';
import { getSettings, adminUpdateSettings } from '@/lib/api';
import { useAppStore } from '@/stores/app';
import type { SiteSettings } from '@/types';

export default function AdminSettingsPage() {
  const { addToast, setSettings: setGlobalSettings, settings: globalSettings } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isPaused, setIsPaused] = useState(globalSettings?.is_paused ?? false);
  const [pauseMessage, setPauseMessage] = useState(globalSettings?.pause_message ?? '');

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await getSettings();
        console.log('Admin settings API response:', response);
        if (response.success && response.data) {
          setIsPaused(response.data.is_paused);
          setPauseMessage(response.data.pause_message);
          setGlobalSettings(response.data);
        } else {
          console.error('Failed to load settings:', response.error);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
      setLoading(false);
    }
    loadSettings();
  }, [setGlobalSettings]);

  async function handleSave() {
    setSaving(true);

    const response = await adminUpdateSettings({
      is_paused: isPaused,
      pause_message: pauseMessage.trim(),
    });

    if (response.success && response.data) {
      addToast('success', 'Settings saved');
      setGlobalSettings(response.data);
    } else {
      addToast('error', response.error || 'Failed to save settings');
    }

    setSaving(false);
  }

  async function togglePause() {
    const newPaused = !isPaused;
    setIsPaused(newPaused);

    const response = await adminUpdateSettings({
      is_paused: newPaused,
      pause_message: pauseMessage.trim(),
    });

    if (response.success && response.data) {
      addToast('success', newPaused ? 'Subscriptions paused' : 'Subscriptions resumed');
      setGlobalSettings(response.data);
    } else {
      setIsPaused(!newPaused);
      addToast('error', response.error || 'Failed to update');
    }
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton h-8 w-1/3 mb-8" />
        <div className="space-y-6 max-w-xl">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Settings</h1>
        <p className="text-text-secondary">Manage subscription pausing and site messages.</p>
      </div>

      <div className="max-w-xl space-y-8">

        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary mb-1">
                Pause Subscriptions
              </h3>
              <p className="text-text-secondary text-sm">
                When enabled, new subscriptions and renewals are blocked. Existing subscribers keep access until expiry.
              </p>
            </div>
            <button
              onClick={togglePause}
              className={`relative w-14 h-7 rounded-full transition-colors ${isPaused ? 'bg-amber-600' : 'bg-bg-tertiary'
                }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${isPaused ? 'left-8' : 'left-1'
                  }`}
              />
            </button>
          </div>

          {isPaused && (
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-600/30">
              <p className="text-amber-200 text-sm">
                Subscriptions are currently paused. New users cannot subscribe.
              </p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-display text-lg font-semibold text-text-primary mb-4">
            Pause Message
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            This message is shown to users when subscriptions are paused.
          </p>

          <textarea
            value={pauseMessage}
            onChange={(e) => setPauseMessage(e.target.value)}
            placeholder="New subscriptions are temporarily paused. Please check back later."
            rows={3}
            className="w-full mb-4"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Message'}
          </button>
        </div>

        <div className="card p-6 bg-bg-tertiary/50">
          <h3 className="font-display font-semibold text-text-primary mb-3">
            How Pausing Works
          </h3>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              New subscriptions are blocked
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Existing subscribers retain full access
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Access expires normally at subscription end
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Renewals are also blocked while paused
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Resume anytime to allow new subscriptions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
