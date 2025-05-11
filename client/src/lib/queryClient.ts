import { QueryClient } from "@tanstack/react-query";
import type { QueryFunction } from "@tanstack/react-query";
import type { InitialAIAnalysisResponse, AIQuery, AIMessage, BookLending } from "./types";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('token');
  console.log(`[apiRequest for ${url}] Token from localStorage:`, token ? token.substring(0, 20) + "..." : null);
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

// New API functions for AI features
export async function fetchInitialAIAnalysis(): Promise<InitialAIAnalysisResponse> {
  const response = await apiRequest("GET", "/api/ai/initial-analysis");
  return response.json();
}

export async function postAIChatMessage(payload: AIQuery): Promise<AIMessage> {
  const response = await apiRequest("POST", "/api/ai/chat", payload);
  return response.json();
}

// New API functions for BookLending
export async function fetchMyActiveLendings(): Promise<BookLending[]> {
  const response = await apiRequest("GET", "/api/book-lendings/my-active");
  return response.json();
}

export async function fetchMyActiveLendingsCount(): Promise<number> {
  const response = await apiRequest("GET", "/api/book-lendings/my-active/count");
  const count = await response.json(); // Assuming backend returns a simple number for count
  return Number(count); // Ensure it's a number
}

export async function fetchMyTotalLendingsCount(): Promise<number> {
  const response = await apiRequest("GET", "/api/book-lendings/my-total/count");
  const count = await response.json();
  return Number(count);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    console.log(`[getQueryFn for ${queryKey[0]}] Token from localStorage:`, token ? token.substring(0, 20) + "..." : null);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
