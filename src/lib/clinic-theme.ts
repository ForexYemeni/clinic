// ═══════════════════════════════════════════════════════════
// 🎨 Dynamic Clinic Branding System
// Maps primaryColor key → full color palette + CSS classes
// ═══════════════════════════════════════════════════════════

export type ClinicColorKey = 'emerald' | 'teal' | 'blue' | 'indigo' | 'purple' | 'red' | 'orange' | 'amber';

interface ColorShades {
  50: string; 100: string; 200: string; 300: string;
  400: string; 500: string; 600: string; 700: string;
  800: string; 900: string; 950: string;
}

// Full Tailwind color palettes for each primary color option
export const COLOR_PALETTES: Record<ClinicColorKey, ColorShades> = {
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22',
  },
  teal: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a', 950: '#042f2e',
  },
  blue: {
    50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
    400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
    800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
  },
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
  },
  purple: {
    50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
    400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
    800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
  },
  red: {
    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
    800: '#991b1b', 900: '#7f1d1d', 950: '#450a0a',
  },
  orange: {
    50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
    400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
    800: '#9a3412', 900: '#7c2d12', 950: '#431407',
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03',
  },
};

// Secondary/gradient color for each primary (teal-like complement)
export const GRADIENT_COLORS: Record<ClinicColorKey, { from: string; to: string }> = {
  emerald: { from: '#059669', to: '#0d9488' },
  teal:    { from: '#0d9488', to: '#0891b2' },
  blue:    { from: '#2563eb', to: '#0891b2' },
  indigo:  { from: '#4f46e5', to: '#6366f1' },
  purple:  { from: '#9333ea', to: '#a855f7' },
  red:     { from: '#dc2626', to: '#ea580c' },
  orange:  { from: '#ea580c', to: '#d97706' },
  amber:   { from: '#d97706', to: '#ea580c' },
};

// Apply theme CSS variables to :root
export function applyClinicTheme(primaryColor: ClinicColorKey) {
  const root = document.documentElement;
  const palette = COLOR_PALETTES[primaryColor];
  const gradient = GRADIENT_COLORS[primaryColor];

  if (!palette || !gradient) return;

  // Set all shade CSS variables
  (Object.entries(palette) as [keyof ColorShades, string][]).forEach(([shade, hex]) => {
    root.style.setProperty(`--clinic-${shade}`, hex);
  });

  // Set gradient variables
  root.style.setProperty('--clinic-gradient-from', gradient.from);
  root.style.setProperty('--clinic-gradient-to', gradient.to);

  // Update Tailwind theme CSS vars for primary
  root.style.setProperty('--primary', hexToOklch(palette[600], 0.55, 0.15));
  root.style.setProperty('--primary-foreground', '#ffffff');
  root.style.setProperty('--ring', hexToOklch(palette[600], 0.55, 0.15));
  root.style.setProperty('--chart-1', hexToOklch(palette[600], 0.55, 0.15));
  root.style.setProperty('--medical', hexToOklch(palette[600], 0.55, 0.15));
  root.style.setProperty('--medical-foreground', '#ffffff');
  root.style.setProperty('--medical-light', hexToOklch(palette[100], 0.95, 0.04));

  // Dark mode overrides
  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', hexToOklch(palette[500], 0.65, 0.15));
    root.style.setProperty('--primary-foreground', palette[950]);
    root.style.setProperty('--ring', hexToOklch(palette[500], 0.65, 0.15));
    root.style.setProperty('--chart-1', hexToOklch(palette[500], 0.65, 0.15));
    root.style.setProperty('--medical', hexToOklch(palette[500], 0.65, 0.15));
    root.style.setProperty('--medical-foreground', palette[950]);
    root.style.setProperty('--medical-light', hexToOklch(palette[900], 0.24, 0.04));
  }

  // Update meta theme-color for PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', palette[600]);
  }

  // Update sidebar vars too
  root.style.setProperty('--sidebar-primary', hexToOklch(palette[600], 0.55, 0.15));
  root.style.setProperty('--sidebar-ring', hexToOklch(palette[600], 0.55, 0.15));
}

// Simple hex → oklch approximation (for CSS vars)
function hexToOklch(hex: string, lightness: number, chroma: number): string {
  // We use a simplified approach: just return the hex color
  // since the oklch conversion is complex and hex works in all contexts
  return hex;
}

// Get Tailwind class maps for a given color key
// These return FULL class strings that survive Tailwind purging
export function getClinicClasses(color: ClinicColorKey) {
  // Full class name maps - these must be complete strings for Tailwind to detect them
  const classMap: Record<string, string> = {};

  const shades: (keyof ColorShades)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  shades.forEach(shade => {
    classMap[`bg${shade}`] = `bg-${color}-${shade}`;
    classMap[`text${shade}`] = `text-${color}-${shade}`;
    classMap[`border${shade}`] = `border-${color}-${shade}`;
    classMap[`ring${shade}`] = `ring-${color}-${shade}`;
    classMap[`from${shade}`] = `from-${color}-${shade}`;
    classMap[`to${shade}`] = `to-${color}-${shade}`;
    classMap[`shadow${shade}`] = `shadow-${color}-${shade}`;
  });

  // Dark mode variants
  shades.forEach(shade => {
    classMap[`darkBg${shade}`] = `dark:bg-${color}-${shade}`;
    classMap[`darkText${shade}`] = `dark:text-${color}-${shade}`;
  });

  // Special compound classes
  classMap['bgLight'] = `bg-${color}-50`;
  classMap['bgCard'] = `bg-${color}-100`;
  classMap['bgMedium'] = `bg-${color}-500`;
  classMap['bgStrong'] = `bg-${color}-600`;
  classMap['bgDeep'] = `bg-${color}-700`;
  classMap['textLight'] = `text-${color}-600`;
  classMap['textStrong'] = `text-${color}-700`;
  classMap['textDark'] = `text-${color}-800`;
  classMap['ringFocus'] = `ring-${color}-500`;
  classMap['gradient'] = `from-${color}-600 to-teal-600`;
  classMap['gradientL'] = `from-${color}-600 to-teal-600`;
  classMap['shadow'] = `shadow-${color}-200 dark:shadow-${color}-900/40`;
  classMap['shadowDeep'] = `shadow-${color}-600/20`;

  // Icon/container backgrounds
  classMap['iconBg'] = `bg-${color}-100 dark:bg-${color}-900/30`;
  classMap['iconText'] = `text-${color}-600 dark:text-${color}-400`;
  classMap['activeTab'] = `text-${color}-600 dark:text-${color}-400`;
  classMap['activeTabBg'] = `bg-${color}-50 dark:bg-${color}-900/30`;

  return classMap;
}

// Type for the class map
export type ClinicClassMap = ReturnType<typeof getClinicClasses>;
