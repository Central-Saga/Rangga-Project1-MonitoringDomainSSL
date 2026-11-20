export async function apiFetch(url: string, options: RequestInit = {}): Promise<{
  error: 'network_error' | 'api_error' | 'unauthorized' | 'forbidden' | 'resource_not_found' | 'validation_error' | 'rate_limited' | 'service_unavailable' | 'payload_too_large' | 'bad_request' | 'server_error' | null;
  data: any;
  status: number;
  offline: boolean;
}> {
  try {
    // Add CSRF token header for Laravel Sanctum
    const headers = {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest',
    };
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      // Handle specific error status codes
      if (response.status === 404) {
        return { error: 'resource_not_found', data: {}, status: 404, offline: false };
      }
      if (response.status === 500) {
        return { error: 'server_error', data: {}, status: 500, offline: false };
      }
      if (response.status === 401) {
        return { error: 'unauthorized', data: {}, status: 401, offline: false };
      }
      if (response.status === 403) {
        return { error: 'forbidden', data: {}, status: 403, offline: false };
      }
      if (response.status === 429) {
        return { error: 'rate_limited', data: {}, status: 429, offline: false };
      }
      if (response.status === 422) {
        return { error: 'validation_error', data: {}, status: 422, offline: false };
      }
      if (response.status === 503) {
        return { error: 'service_unavailable', data: {}, status: 503, offline: false };
      }
      if (response.status === 413) {
        return { error: 'payload_too_large', data: {}, status: 413, offline: false };
      }
      if (response.status === 400) {
        return { error: 'bad_request', data: {}, status: 400, offline: false };
      }
      if (response.status === 408) {
        return { error: 'request_timeout', data: {}, status: 408, offline: false };
      }
      return { error: 'api_error', data: {}, status: response.status, offline: false };
    }
    
    const data = await response.json().catch(() => ({}));
    return { error: null, data, status: response.status, offline: false };
  } catch (error: any) {
    // Network error or offline
    return { 
      error: 'network_error', 
      data: {}, 
      status: 0, 
      offline: !navigator.onLine 
    };
  }
}

export function formatRupiah(value: string | number | null | undefined): string {
  const num = Number(value ?? 0);
  return "Rp " + num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function expiryText(days: number): string {
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  return `${days} hari lagi`;
}

export function expiryColor(days: number, status: string): string {
  if (status === "expired" || days < 0) return "bg-danger-soft text-danger";
  if (days <= 7) return "bg-danger-soft text-danger";
  if (days <= 30) return "bg-warn-soft text-warn";
  return "bg-ok-soft text-ok";
}

export const assetTypeColor: Record<string, string> = {
  domain: "bg-info-soft text-info",
  hosting: "bg-accent-soft text-accent",
  ssl: "bg-ok-soft text-ok",
  vps: "bg-warn-soft text-warn",
};

export const statusColor: Record<string, string> = {
  active: "bg-ok-soft text-ok",
  expired: "bg-danger-soft text-danger",
  suspended: "bg-subtle text-soft",
  on_hold: "bg-warn-soft text-warn",
  completed: "bg-info-soft text-info",
  paid: "bg-ok-soft text-ok",
  pending: "bg-warn-soft text-warn",
};