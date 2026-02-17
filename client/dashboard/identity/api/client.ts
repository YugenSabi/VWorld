import { API_CONFIG, buildApiUrl } from './config';

interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

export class ApiClientError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function buildUrlWithParams(url: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  const data = isJson ? await response.json() : await response.text();

  if (response.ok) {
    return data as T;
  }

  const errorData = isJson ? (data as ApiError) : { message: data as string };
  throw new ApiClientError(
    errorData.message || 'Unknown error occurred',
    response.status,
    errorData.code,
    errorData.details,
  );
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeout = API_CONFIG.timeout, ...fetchOptions } = options;

  const url = buildApiUrl(endpoint);
  const fullUrl = buildUrlWithParams(url, params);

  const headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && fetchOptions.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiClientError('Request timeout', 408, 'TIMEOUT');
      }
      throw new ApiClientError(error.message, undefined, 'NETWORK_ERROR');
    }

    throw new ApiClientError('Unknown error occurred');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete: <T>(endpoint: string, options?: RequestOptions) => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
