const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status} error`);
  }

  return data;
}

export function getFilePreviewUrl(documentId: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return `${API_BASE_URL}/documents/${documentId}/file?token=${encodeURIComponent(token || '')}`;
}
