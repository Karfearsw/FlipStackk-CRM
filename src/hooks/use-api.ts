"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type ApiError = {
  message: string;
  status?: number;
};

async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'api_request_start', details: { url, method: options?.method || 'GET', ts: Date.now() } })
    }).catch(() => {});
  } catch {}

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };

    try {
      const errorData = await response.json();
      error.message = errorData.error || errorData.message || error.message;
    } catch {
      // Use default error message if response is not JSON
    }

    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'api_request_error', details: { url, status: error.status, message: error.message, ts: Date.now() } })
      }).catch(() => {});
    } catch {}

    throw error;
  }

  return response.json();
}

export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string,
  options?: Omit<UseQueryOptions<T, ApiError>, "queryKey" | "queryFn">
) {
  const router = useRouter();
  const { toast } = useToast();

  return useQuery<T, ApiError>({
    queryKey,
    queryFn: () => fetchApi<T>(url),
    ...options,
    meta: {
      onError: (error: ApiError) => {
        if (error.status === 401) {
          router.push("/auth");
          toast({
            title: "Authentication Required",
            description: "Please log in to continue",
            variant: "destructive",
          });
        }
      },
      ...options?.meta,
    },
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables, unknown>
) {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    onError: (error, variables, context, ...rest) => {
      if (error.status === 401) {
        router.push("/auth");
        toast({
          title: "Authentication Required",
          description: "Please log in to continue",
          variant: "destructive",
        });
      }
      if (options?.onError) {
        (options.onError as any)(error, variables, context, ...rest);
      }
    },
    ...options,
  });
}

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return fetchApi<T>(url, options);
}

export async function apiGet<T>(url: string): Promise<T> {
  return fetchApi<T>(url, { method: "GET" });
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  return fetchApi<T>(url, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  return fetchApi<T>(url, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  return fetchApi<T>(url, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T>(url: string): Promise<T> {
  return fetchApi<T>(url, { method: "DELETE" });
}
