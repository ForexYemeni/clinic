'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      // Use localStorage for persistence across sessions
      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        // Show again after 3 days
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < threeDaysMs) {
          return true;
        }
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
    return false;
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setVisible(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch {
      // Prompt failed
    }
    setDeferredPrompt(null);
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  }, [deferredPrompt]);

  if (isInstalled || (dismissed && !visible)) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="p-5">
              {/* Top section with icon */}
              <div className="flex items-start gap-4 mb-4">
                {/* App icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                  <img src="/icon-512.png" alt="" className="w-10 h-10 rounded-xl" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />
                  <Smartphone className="w-6 h-6 text-white absolute" />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 pr-4 pt-0.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">تثبيت التطبيق</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    أضف التطبيق إلى شاشتك الرئيسية للوصول السريع والعمل بدون إنترنت
                  </p>
                </div>
              </div>

              {/* Features list */}
              <div className="flex gap-3 mb-4 px-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  وصول سريع
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  يعمل بدون إنترنت
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  بدون إعلانات
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-green-500/25 active:scale-95 transition-transform"
                >
                  <Download className="w-4 h-4" />
                  تثبيت الآن
                </button>
                <button
                  onClick={handleDismiss}
                  className="h-11 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
