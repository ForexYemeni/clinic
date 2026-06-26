// ─── PWA Install Prompt Global State ───
// Captures the beforeinstallprompt event at app level
// so ALL components (bottom sheet + dashboard banner) can use it

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _isStandalone = false;
let _isIOS = false;
let _listeners: Listener[] = [];

function _notify() {
  _listeners.forEach(l => l());
}

if (typeof window !== 'undefined') {
  // Check standalone immediately
  _isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;

  // Detect iOS
  const ua = window.navigator.userAgent;
  _isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

  // Capture beforeinstallprompt ONCE at the global level
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    _notify();
  });

  // Clear on install
  window.addEventListener('appinstalled', () => {
    _isStandalone = true;
    _deferredPrompt = null;
    _notify();
  });

  // Listen for display-mode changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    _isStandalone = e.matches;
    if (_isStandalone) {
      _deferredPrompt = null;
    }
    _notify();
  });
}

export function getPwaState() {
  return {
    deferredPrompt: _deferredPrompt,
    isStandalone: _isStandalone,
    isIOS: _isIOS,
    canInstall: !_isStandalone && (_deferredPrompt !== null || _isIOS),
  };
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!_deferredPrompt) {
    return 'unavailable';
  }
  try {
    await _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      _isStandalone = true;
    }
    _deferredPrompt = null;
    _notify();
    return outcome;
  } catch {
    _deferredPrompt = null;
    _notify();
    return 'unavailable';
  }
}

export function subscribe(listener: Listener): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(l => l !== listener);
  };
}
