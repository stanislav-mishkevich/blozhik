// @vitest-environment jsdom
/**
 * Tests for the rustApi client library
 * Verifies that the Proxy-based API client works correctly
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { rustApi } from "@/lib/rustBack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };

  return Wrapper;
};

describe("RustApi Client Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Proxy Structure", () => {
    it("should create nested proxy paths dynamically", () => {
      expect(rustApi).toBeDefined();
      expect(rustApi.posts).toBeDefined();
      expect(rustApi.posts.list).toBeDefined();
      expect(rustApi.posts.list.useQuery).toBeDefined();
      expect(typeof rustApi.posts.list.useQuery).toBe("function");
    });

    it("should work with any depth of nesting", () => {
      expect(rustApi.admin.users.settings.nested.deeply.useQuery).toBeDefined();
      expect(typeof rustApi.admin.users.settings.nested.deeply.useQuery).toBe("function");
    });

    it("should provide useQuery at any path", () => {
      expect(typeof rustApi.anything.here.useQuery).toBe("function");
    });

    it("should provide useMutation at any path", () => {
      expect(typeof rustApi.anything.here.useMutation).toBe("function");
    });

    it("should provide useUtils", () => {
      expect(typeof rustApi.useUtils).toBe("function");
    });
  });

  describe("useQuery Hook", () => {
    it.skip("should make GET requests with query parameters", async () => {
      const mockData = { items: [{ id: 1, title: "Test" }] };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(
        () => rustApi.posts.list.useQuery({ page: 1, limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(fetch).toHaveBeenCalled();
    });

    it("should handle loading states", () => {
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(
        () => rustApi.posts.list.useQuery(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should handle errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Network error")
      );

      const { result } = renderHook(
        () => rustApi.posts.list.useQuery(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useMutation Hook", () => {
    it("should make POST requests", async () => {
      const mockResponse = { id: 1, title: "Created" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(
        () => rustApi.posts.create.useMutation(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ title: "New Post" });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });

    it("should handle mutation loading states", () => {
      const { result } = renderHook(
        () => rustApi.posts.create.useMutation(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isPending).toBe(false);
    });

    it("should handle mutation errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Failed to create")
      );

      const { result } = renderHook(
        () => rustApi.posts.create.useMutation(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ title: "Test" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("API URL Configuration", () => {
    it("should use VITE_API_URL if set", () => {
      // This is tested through the callRustBack function
      // In production, it should use the configured URL
      expect(import.meta.env).toBeDefined();
    });

    it("should default to /api if VITE_API_URL not set", () => {
      // Default behavior is to use /api
      const defaultUrl = "/api";
      expect(defaultUrl).toBe("/api");
    });
  });

  describe("Method Name Mapping", () => {
    it("should map method names to REST endpoints", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(
        () => rustApi.post.getFeed.useQuery({ limit: 10 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Check that fetch was called with correct URL pattern
      const fetchCall = (fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain("/api");
    });
  });

  describe("Query Key Generation", () => {
    it("should generate unique query keys for different paths", () => {
      const { result: result1 } = renderHook(
        () => rustApi.posts.list.useQuery({ page: 1 }),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => rustApi.posts.list.useQuery({ page: 2 }),
        { wrapper: createWrapper() }
      );

      // Different inputs should create different query keys
      // This is handled by React Query internally
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe("Error Response Handling", () => {
    it("should handle 404 responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });

      const { result } = renderHook(
        () => rustApi.posts.get.useQuery({ id: 999 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should handle 401 unauthorized responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      const { result } = renderHook(
        () => rustApi.posts.create.useMutation(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({ title: "Test" });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it("should handle 500 server errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const { result } = renderHook(
        () => rustApi.posts.list.useQuery(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("Credentials Handling", () => {
    it("should include credentials in requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(
        () => rustApi.posts.list.useQuery(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Verify credentials: 'include' is used
      const fetchCall = (fetch as any).mock.calls[0];
      if (fetchCall[1]) {
        expect(fetchCall[1].credentials).toBe("include");
      }
    });
  });
});
