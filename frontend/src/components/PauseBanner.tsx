'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app';
import { getSettings } from '@/lib/api';

export function PauseBanner() {
  const { settings, setSettings } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadSettings() {
      const response = await getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    }
    loadSettings();
  }, [mounted, setSettings]);

  if (!mounted) return null;
  if (!settings?.is_paused) return null;

  return (
    <div className="px-4 pt-20 md:pt-24">
      <div className="pause-banner">
        <div className="flex items-center justify-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium">
            {settings.pause_message || 'New subscriptions are temporarily paused. Existing subscribers retain access.'}
          </p>
        </div>
      </div>
    </div>
  );
}
