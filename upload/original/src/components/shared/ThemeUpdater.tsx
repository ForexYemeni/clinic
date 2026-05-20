'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { applyClinicTheme, type ClinicColorKey } from '@/lib/clinic-theme';

/**
 * ThemeUpdater - Applies clinic branding dynamically across the entire app.
 * 
 * - Updates CSS custom properties for all color shades
 * - Updates Tailwind theme variables (--primary, --ring, --medical, etc.)
 * - Updates PWA meta theme-color
 * - Re-applies on dark/light mode toggle
 * - Re-applies when primaryColor changes
 */
export function ThemeUpdater() {
  const { clinicSettings, theme } = useAppStore();
  const primaryColor = (clinicSettings.primaryColor || 'emerald') as ClinicColorKey;

  useEffect(() => {
    applyClinicTheme(primaryColor);
  }, [primaryColor, theme]);

  return null; // No UI rendered
}
