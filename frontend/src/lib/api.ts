export async function apiFetch(url: string, options: RequestInit = {}): Promise<{
  error: 'network_error' | 'api_error' | 'unauthorized' | 'forbidden' | 'resource_not_found' | 'validation_error' | 'rate_limited' | 'service_unavailable' | 'payload_too_large' | 'bad_request' | 'server_error' | 'request_timeout' | 'method_not_allowed' | 'expectation_failed' | 'conflict' | 'not_acceptable' | 'proxy_authentication_required' | 'gone' | 'length_required' | 'precondition_failed' | 'uri_too_long' | 'unsupported_media_type' | 'range_not_satisfiable' | 'im_a_teapot' | 'payment_required' | 'misdirected_request' | 'token_expired' | 'enhance' | 'locked' | 'request_header_fields_too_large' | 'too_early' | 'upgrade_required' | 'unavailable_for_legal_reasons' | 'request_limit_exceeded' | 'loop_detected' | null;
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
      if (response.status === 405) {
        return { error: 'method_not_allowed', data: {}, status: 405, offline: false };
      }
      if (response.status === 417) {
        return { error: 'expectation_failed', data: {}, status: 417, offline: false };
      }
      if (response.status === 409) {
        return { error: 'conflict', data: {}, status: 409, offline: false };
      }
      if (response.status === 406) {
        return { error: 'not_acceptable', data: {}, status: 406, offline: false };
      }
      if (response.status === 407) {
        return { error: 'proxy_authentication_required', data: {}, status: 407, offline: false };
      }
      if (response.status === 410) {
        return { error: 'gone', data: {}, status: 410, offline: false };
      }
      if (response.status === 411) {
        return { error: 'length_required', data: {}, status: 411, offline: false };
      }
      if (response.status === 412) {
        return { error: 'precondition_failed', data: {}, status: 412, offline: false };
      }
      if (response.status === 414) {
        return { error: 'uri_too_long', data: {}, status: 414, offline: false };
      }
      if (response.status === 415) {
        return { error: 'unsupported_media_type', data: {}, status: 415, offline: false };
      }
      if (response.status === 416) {
        return { error: 'range_not_satisfiable', data: {}, status: 416, offline: false };
      }
      if (response.status === 418) {
        return { error: 'im_a_teapot', data: {}, status: 418, offline: false };
      }
      if (response.status === 402) {
        return { error: 'payment_required', data: {}, status: 402, offline: false };
      }
      if (response.status === 421) {
        return { error: 'misdirected_request', data: {}, status: 421, offline: false };
      }
      if (response.status === 419) {
        return { error: 'token_expired', data: {}, status: 419, offline: false };
      }
      if (response.status === 420) {
        return { error: 'enhance', data: {}, status: 420, offline: false };
      }
      if (response.status === 423) {
        return { error: 'locked', data: {}, status: 423, offline: false };
      }
      if (response.status === 428) {
        return { error: 'request_header_fields_too_large', data: {}, status: 428, offline: false };
      }
      if (response.status === 424) {
        return { error: 'failed_dependency', data: {}, status: 424, offline: false };
      }
      if (response.status === 425) {
        return { error: 'too_early', data: {}, status: 425, offline: false };
      }
      if (response.status === 426) {
        return { error: 'upgrade_required', data: {}, status: 426, offline: false };
      }
      if (response.status === 427) {
        return { error: 'unavailable_for_legal_reasons', data: {}, status: 427, offline: false };
      }
      if (response.status === 428) {
        return { error: 'request_header_fields_too_large', data: {}, status: 428, offline: false };
      }
      if (response.status === 429) {
        return { error: 'rate_limited', data: {}, status: 429, offline: false };
      }
      if (response.status === 431) {
        return { error: 'request_header_fields_too_large', data: {}, status: 431, offline: false };
      }
      if (response.status === 438) {
        return { error: 'loop_detected', data: {}, status: 438, offline: false };
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