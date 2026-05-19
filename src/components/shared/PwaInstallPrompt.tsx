'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed')) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay before showing for better UX
      setTimeout(() => setVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      handleDismiss();
    }, 15000);
    return () => clearTimeout(timer);
  }, [visible, handleDismiss]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // User accepted
      }
    } catch {
      // Prompt failed
    }
    setDeferredPrompt(null);
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }, [deferredPrompt]);

  if (dismissed && !visible) return null;

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
              className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="p-4 flex items-center gap-4">
              {/* Gradient icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-sm font-bold text-foreground">تثبيت التطبيق</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  أضف التطبيق إلى شاشتك الرئيسية للوصول السريع
                </p>
              </div>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/25 active:scale-95 transition-transform flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                تثبيت
              </button>
            </div>

            {/* Dismiss link */}
            <div className="px-4 pb-3 flex justify-start">
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
