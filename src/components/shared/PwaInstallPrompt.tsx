'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download, Sparkles, Monitor, Share, PlusCircle, ChevronLeft } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < threeDaysMs) {
          return true;
        }
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
    return false;
  });

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Capture beforeinstallprompt for Chrome/Android
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show immediately when the event fires
      if (!dismissed) setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setVisible(false);
      setDeferredPrompt(null);
    });

    // For iOS or browsers without beforeinstallprompt, show after a short delay
    if (ios && !dismissed) {
      setTimeout(() => setVisible(true), 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [dismissed]);

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
        setIsStandalone(true);
      }
    } catch {
      // Prompt failed
    }
    setDeferredPrompt(null);
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  }, [deferredPrompt]);

  if (isStandalone || (dismissed && !visible)) return null;

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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border shadow-2xl shadow-black/15 dark:shadow-black/40 overflow-hidden">
            {/* Gradient header strip */}
            <div className="h-1.5 bg-gradient-to-l from-emerald-400 via-green-500 to-teal-500" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <div className="p-5 pt-4">
              {/* Top section with icon */}
              <div className="flex items-start gap-4 mb-4">
                {/* App icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-green-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <div className="relative">
                    <img 
                      src="/icons/icon-192x192.png" 
                      alt="" 
                      className="w-10 h-10 rounded-xl" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }} 
                    />
                    <Smartphone className="w-8 h-8 text-white absolute inset-0 m-auto" style={{ zIndex: 0 }} />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 pr-6 pt-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <h3 className="text-sm font-bold text-foreground">تثبيت التطبيق على جهازك</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isIOS 
                      ? 'أضف التطبيق إلى شاشتك الرئيسية للوصول السريع'
                      : 'أضف التطبيق إلى شاشتك الرئيسية للوصول السريع والعمل بدون إنترنت'
                    }
                  </p>
                </div>
              </div>

              {/* Features list */}
              {!isIOS && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 px-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    وصول سريع من الشاشة الرئيسية
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    يعمل بدون إنترنت
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    تجربة أصلية بدون متصفح
                  </div>
                </div>
              )}

              {/* iOS Instructions */}
              {isIOS && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 space-y-2">
                  <p className="text-xs font-bold text-foreground mb-1.5">خطوات التثبيت:</p>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Share className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </span>
                    <p className="text-[11px] text-muted-foreground">اضغط على زر المشاركة في أسفل المتصفح</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PlusCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </span>
                    <p className="text-[11px] text-muted-foreground">اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {deferredPrompt ? (
                  <>
                    <button
                      onClick={handleInstall}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      تثبيت الآن
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="h-12 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
                    >
                      لاحقاً
                    </button>
                  </>
                ) : isIOS ? (
                  <>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 h-12 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
                    >
                      فهمت، سأقوم بالتثبيت
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="h-12 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
                    >
                      لاحقاً
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 h-12 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 active:scale-95 transition-transform"
                    >
                      تم التثبيت
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="h-12 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium text-muted-foreground active:scale-95 transition-transform"
                    >
                      لاحقاً
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dashboard PWA Install Banner Card ───
// This is a prominent card that shows on the dashboard itself
export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const dismissedAt = localStorage.getItem('pwa-banner-dismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDaysMs) {
          return true;
        }
        localStorage.removeItem('pwa-banner-dismissed');
      }
    }
    return false;
  });
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsStandalone(true);
        }
      } catch {}
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', String(Date.now()));
  }, []);

  if (isStandalone || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-lg shadow-emerald-500/10"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-bl from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20" />
      
      {/* Decorative circles */}
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200/30 dark:bg-emerald-700/10 rounded-full" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-teal-200/30 dark:bg-teal-700/10 rounded-full" />

      <div className="relative p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/60 dark:bg-gray-700/60 flex items-center justify-center hover:bg-white dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>

        {!showIOSGuide ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              {/* App icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10" />
                <div className="relative flex items-center justify-center">
                  <img 
                    src="/icons/icon-192x192.png" 
                    alt="" 
                    className="w-9 h-9 rounded-xl" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} 
                  />
                  <Smartphone className="w-6 h-6 text-white absolute" style={{ zIndex: 0 }} />
                </div>
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">ثبّت التطبيق على جهازك</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  وصول سريع من الشاشة الرئيسية • يعمل بدون إنترنت
                </p>
              </div>
            </div>

            {/* Feature badges */}
            <div className="flex gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                وصول فوري
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                بدون إنترنت
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                بدون متصفح
              </span>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 h-11 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 active:scale-[0.97] transition-transform"
            >
              <Download className="w-5 h-5" />
              {deferredPrompt ? 'تثبيت التطبيق الآن' : isIOS ? 'كيفية التثبيت' : 'تثبيت التطبيق'}
            </button>
          </>
        ) : (
          /* iOS Installation Guide */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground">تثبيت على iPhone / iPad</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 bg-white/60 dark:bg-gray-700/40 rounded-xl p-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">اضغط على زر المشاركة</p>
                  <p className="text-[10px] text-muted-foreground">الموجود في أسفل المتصفح (أعلى الشاشة)</p>
                </div>
                <Share className="w-5 h-5 text-blue-500 flex-shrink-0" />
              </div>

              <div className="flex items-start gap-2.5 bg-white/60 dark:bg-gray-700/40 rounded-xl p-2.5">
                <span className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">اختر &quot;إضافة إلى الشاشة الرئيسية&quot;</p>
                  <p className="text-[10px] text-muted-foreground">قد تحتاج للتمرير للأسفل لإيجادها</p>
                </div>
                <PlusCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>

              <div className="flex items-start gap-2.5 bg-white/60 dark:bg-gray-700/40 rounded-xl p-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">اضغط &quot;إضافة&quot;</p>
                  <p className="text-[10px] text-muted-foreground">سيظهر التطبيق على شاشتك الرئيسية</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full h-10 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-medium text-muted-foreground active:scale-[0.97] transition-transform"
            >
              تم التثبيت / لاحقاً
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
