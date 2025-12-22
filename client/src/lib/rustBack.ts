import React, { useContext } from "react";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { getLoginUrl } from "@/const";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";

async function callRustBack(method: string, input?: any) {
  // Prefer explicit API URL from environment; default to modern `/api` endpoint
  const API_URL =
    (import.meta as any).env?.VITE_API_URL ??
    (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api");

  // Debug: log which API URL is being used
  try {
    console.debug("[rustBack] API_URL ->", API_URL);
  } catch (e) {}

  // Adapter: map common rustApi.* method names to REST endpoints under /api
  const parts = method.split(".");
  const ns = parts[0];
  const action = parts[1] || "";

  // Helper to build query string from input
  const buildQS = (obj: any) => {
    if (!obj) return "";
    const params = new URLSearchParams();
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (v === undefined || v === null) return;
      params.append(k, String(v));
    });
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  // Post namespace mapping
  if (ns === "post") {
    if (action === "getFeed") {
      // map { limit, page, q, tag } -> GET /posts?per_page=&page=&q=&tag=
      const qmap: any = {};
      if (input?.limit) qmap.per_page = input.limit;
      if (input?.page) qmap.page = input.page;
      if (input?.q) qmap.q = input.q;
      if (input?.tag) qmap.tag = input.tag;
      const url = `${API_URL}/posts${buildQS(qmap)}`;
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error(`api_error:${res.status}`);
      const json = await res.json();
      return json;
    }

    if (action === "create" || action === "createPost") {
      const url = `${API_URL}/posts`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input || {}),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`api_error:${res.status}:${txt}`);
      }
      return await res.json();
    }

    if (action === "getById" || action === "get") {
      const id = (input && (input.id ?? input)) || "";
      const url = `${API_URL}/posts/${id}`;
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error(`api_error:${res.status}`);
      return await res.json();
    }

    if (action === "getUserPosts") {
      const qmap: any = {};
      if (input?.userId) qmap.author_id = input.userId;
      if (input?.includeUnpublished)
        qmap.includeUnpublished = input.includeUnpublished;
      const url = `${API_URL}/posts${buildQS(qmap)}`;
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error(`api_error:${res.status}`);
      return await res.json();
    }
  }

  // Search namespace mapping
  if (ns === "search") {
    if (action === "posts") {
      const qmap: any = {};
      if (input?.q) qmap.q = input.q;
      if (input?.tag) qmap.tag = input.tag;
      if (input?.page) qmap.page = input.page;
      const url = `${API_URL}/posts${buildQS(qmap)}`;
      const res = await fetch(url, { method: "GET", credentials: "include" });
      if (!res.ok) throw new Error(`api_error:${res.status}`);
      return await res.json();
    }
  }

  // Fallback: original rustBack RPC-style POST
  const body = {
    id: 1,
    method: "query",
    params: { path: method, input: input === undefined ? null : input },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const json = await res.json();

  // Handle batch responses
  if (Array.isArray(json)) {
    const first = json[0];
    if (first.error) {
      const msg = first.error.message || "rustback_error";
      // Redirect to login if server signalled unauthorized, but avoid loop when already on login page
      if (typeof window !== "undefined" && msg === UNAUTHED_ERR_MSG) {
        try {
          const loginUrl = getLoginUrl();
          const loginPath = new URL(loginUrl, window.location.origin).pathname;
          if (window.location.pathname !== loginPath) {
            window.location.replace(loginUrl);
          }
        } catch (e) {
          // fallback
          if (window.location.pathname !== "/login") {
            window.location.replace(getLoginUrl());
          }
        }
        throw new Error(msg);
      }
      throw new Error(msg);
    }
    return first.result?.data;
  }

  if (json.error) {
    const msg = json.error.message || "rustback_error";
    if (typeof window !== "undefined" && msg === UNAUTHED_ERR_MSG) {
      try {
        const loginUrl = getLoginUrl();
        const loginPath = new URL(loginUrl, window.location.origin).pathname;
        if (window.location.pathname !== loginPath) {
          window.location.replace(loginUrl);
        }
      } catch (e) {
        if (window.location.pathname !== "/login") {
          window.location.replace(getLoginUrl());
        }
      }
      throw new Error(msg);
    }
    throw new Error(msg);
  }

  return json.result?.data;
}

const RustBackContext = React.createContext<{
  queryClient?: QueryClient;
  client?: any;
}>({});

function makeUtilsProxy(
  pathParts: string[] = [],
  queryClient?: QueryClient
): any {
  const handler: ProxyHandler<any> = {
    get(target, prop: string) {
      // If the target already has this property (e.g., attached helpers), return it.
      if (prop in (target as any)) {
        return (target as any)[prop];
      }
      if (prop === "invalidate") {
        return (input?: any) => {
          if (!queryClient) return;
          const key = [pathParts.join("."), input ?? null];
          // invalidate by prefix when only path provided
          if (input === undefined) {
            (queryClient as any).invalidateQueries([pathParts.join(".")]);
          } else {
            (queryClient as any).invalidateQueries(key);
          }
        };
      }

      if (prop === "getQueryData") {
        return (input?: any) =>
          queryClient?.getQueryData([pathParts.join("."), input ?? null]);
      }

      if (prop === "setQueryData") {
        return (input: any, data: any) =>
          queryClient?.setQueryData([pathParts.join("."), input ?? null], data);
      }

      return makeUtilsProxy([...pathParts, prop], queryClient);
    },
  };

  return new Proxy({}, handler);
}

function makeProxy(pathParts: string[] = []): any {
  const handler: ProxyHandler<any> = {
    get(target, prop: string) {
      // If the target already has this property (e.g., createClient/Provider), return it.
      if (prop in (target as any)) {
        return (target as any)[prop];
      }
      // root-level helper: useUtils()
      if (pathParts.length === 0 && prop === "useUtils") {
        return function useRustBackUtils() {
          const ctx = useContext(RustBackContext);
          return makeUtilsProxy([], ctx.queryClient);
        };
      }

      // createClient / Provider access will be defined on exported object, not here
      if (prop === "useQuery") {
        return function useRustBackQuery(input?: any, options?: any) {
          const key = [pathParts.join("."), input ?? null];
          const queryFn = () => callRustBack(pathParts.join("."), input);
          const q = useQuery({
            queryKey: key,
            queryFn,
            ...(options || {}),
          } as any);
          return {
            ...q,
            data: q.data,
            refetch: q.refetch,
          };
        };
      }

      if (prop === "useMutation") {
        return function useRustBackMutation(options?: any) {
          const mutation = useMutation({
            mutationFn: (vars: any) => callRustBack(pathParts.join("."), vars),
            ...(options || {}),
          } as any);

          return {
            ...mutation,
            isPending: mutation.status === "pending",
            mutate: mutation.mutate,
            mutateAsync: mutation.mutateAsync,
          };
        };
      }

      return makeProxy([...pathParts, prop]);
    },
  };

  return new Proxy({}, handler);
}

const base = makeProxy();

// Export the rustApi proxy. This intentionally does NOT expose tRPC-compatible
// `createClient`/`Provider` shims — frontend should use `rustApi.*` hooks directly
// and the plain `/api` endpoint (configurable via `VITE_API_URL`).
export const rustApi = base;
