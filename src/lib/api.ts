// ═══════════════════════════════════════════════════════════
// 🌐 API Helper
// Wrapper for fetch that automatically adds JWT token
// Super Admin: auto-appends selectedClinicId for data isolation
// ═══════════════════════════════════════════════════════════

import { useAppStore } from './store';

/**
 * Build URL with clinicId query param for super_admin data isolation.
 * When a super_admin is viewing a specific clinic, we append ?clinicId=xxx
 * to all data API calls so the backend knows which clinic's data to return.
 */
function buildUrlWithClinicContext(url: string): string {
  const state = useAppStore.getState();
  const user = state.user;

  // Skip clinicId injection for super-admin routes (they have their own clinic ID in the URL path)
  if (url.startsWith('/api/super-admin/')) return url;

  // Only for super_admin who has selected a specific clinic to view
  if (user?.role === 'super_admin' && state.selectedClinicId) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}clinicId=${state.selectedClinicId}`;
  }

  return url;
}

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().token;

  // Build headers - handle both plain objects and Headers instances
  let existingHeaders: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        existingHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers as [string, string][]) {
        existingHeaders[key] = value;
      }
    } else {
      existingHeaders = { ...(options.headers as Record<string, string> || {}) };
    }
  }

  const headers: Record<string, string> = { ...existingHeaders };

  // Add JSON content type for POST/PUT/PATCH
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token if available
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-append clinicId for super_admin context
  const finalUrl = buildUrlWithClinicContext(url);

  return fetch(finalUrl, {
    ...options,
    headers,
  });
}

/**
 * Global fetch wrapper that auto-adds JWT token for ALL /api/ requests.
 * This is a monkey-patch on window.fetch that ensures even components
 * using raw fetch() will include the auth token.
 */
let _originalFetch: typeof fetch | null = null;

export function installGlobalApiFetch() {
  if (typeof window === 'undefined') return;
  if (_originalFetch) return; // Already installed

  _originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '';

    // Only intercept /api/ requests
    if (url.startsWith('/api/')) {
      const state = useAppStore.getState();
      const token = state.token;

      // Safely extract existing headers regardless of type
      let existingHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => { existingHeaders[key] = value; });
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers as [string, string][]) { existingHeaders[key] = value; }
        } else {
          existingHeaders = { ...(init.headers as Record<string, string> || {}) };
        }
      }

      const headers: Record<string, string> = { ...existingHeaders };

      // Add JWT token if available and not already set
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Add Content-Type for POST/PUT/PATCH if not set
      if (init?.method && ['POST', 'PUT', 'PATCH'].includes(init.method) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Build URL with clinic context for super_admin (skip super-admin routes)
      let finalUrl = url;
      if (url.startsWith('/api/super-admin/')) {
        // Super-admin routes have their own clinic ID in the URL path
        finalUrl = url;
      } else if (state.user?.role === 'super_admin' && state.selectedClinicId) {
        const separator = url.includes('?') ? '&' : '?';
        finalUrl = `${url}${separator}clinicId=${state.selectedClinicId}`;
      }

      return _originalFetch!(finalUrl, {
        ...init,
        headers,
      });
    }

    return _originalFetch!(input, init);
  };
}

// Helper for GET requests
export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'خطأ في الاتصال');
  }
  return res.json();
}

// Helper for POST requests
export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  try {
    const res = await apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Safely parse JSON with fallback
    let data: any;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) throw new Error('خطأ في الاتصال بالخادم');
      throw new Error('استجابة غير صالحة من الخادم');
    }
    
    if (!res.ok) {
      const error: any = new Error(data?.error || 'خطأ في العملية');
      error.data = data;
      error.status = res.status;
      throw error;
    }
    return data as T;
  } catch (err: any) {
    // Re-throw if already our custom error
    if (err.data || err.status) throw err;
    // Network or other fetch errors
    throw new Error(err.message || 'خطأ في الاتصال');
  }
}

// Helper for PUT requests
export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطأ في التحديث');
  return data;
}

// Helper for DELETE requests
export async function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطأ في الحذف');
  return data;
}
