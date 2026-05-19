// ═══════════════════════════════════════════════════════════
// 🌐 API Helper
// Wrapper for fetch that automatically adds JWT token
// ═══════════════════════════════════════════════════════════

import { useAppStore } from './store';

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

  return fetch(url, {
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
