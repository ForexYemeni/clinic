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

  // Only for super_admin who has selected a specific clinic to view
  if (user?.role === 'super_admin' && state.selectedClinicId) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}clinicId=${state.selectedClinicId}`;
  }

  return url;
}

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().token;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Add JSON content type for POST/PUT/PATCH
  if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-append clinicId for super_admin context
  const finalUrl = buildUrlWithClinicContext(url);

  return fetch(finalUrl, {
    ...options,
    headers,
  });
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
  const res = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'خطأ في العملية');
  return data;
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
