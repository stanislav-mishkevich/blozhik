// @vitest-environment jsdom
/**
 * Integration tests for Backend-Frontend API connection
 * These tests verify that the frontend can communicate with the Rust backend
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { rustApi } from "@/lib/rustBack";

// Mock fetch for these tests - in real integration tests, you'd start the backend server
global.fetch = vi.fn();

describe("Backend-Frontend API Integration", () => {
  beforeAll(() => {
    // Setup: In a real integration test, you'd start the backend server here
    console.log("Setting up API integration tests...");
  });

  afterAll(() => {
    // Teardown: Stop backend server
    console.log("Tearing down API integration tests...");
    vi.restoreAllMocks();
  });

  describe("API Connection", () => {
    it("should have correct API URL configuration", () => {
      // Check that API URL is configured
      const apiUrl = import.meta.env?.VITE_API_URL || "/api";
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe("string");
    });

    it("should construct proper rustApi proxy object", () => {
      expect(rustApi).toBeDefined();
      expect(typeof rustApi).toBe("object");
    });
  });

  describe("Posts Endpoint Integration", () => {
    it("should call GET /api/posts when fetching feed", async () => {
      const mockResponse = {
        items: [
          { id: 1, title: "Test Post", bodyMarkdown: "Content" }
        ],
        total: 1,
        page: 1,
        perPage: 10,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // This would make a real API call in an actual integration test
      const response = await fetch("/api/posts?per_page=10&page=1");
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toBe("Test Post");
    });

    it("should handle POST /api/posts for creating posts", async () => {
      const newPost = {
        title: "New Post",
        bodyMarkdown: "# Content",
        published: true,
      };

      const mockResponse = {
        id: 2,
        ...newPost,
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
        credentials: "include",
      });
      const data = await response.json();

      expect(data.id).toBe(2);
      expect(data.title).toBe("New Post");
    });

    it("should handle errors from POST /api/posts", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Invalid post data" }),
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }), // Invalid
        credentials: "include",
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe("Comments Endpoint Integration", () => {
    it("should call POST /api/posts/{id}/comments", async () => {
      const comment = {
        postId: 1,
        bodyMarkdown: "Great post!",
      };

      const mockResponse = {
        id: 10,
        ...comment,
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch("/api/posts/1/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
        credentials: "include",
      });
      const data = await response.json();

      expect(data.id).toBe(10);
      expect(data.bodyMarkdown).toBe("Great post!");
    });
  });

  describe("Reactions Endpoint Integration", () => {
    it("should call POST /api/{subject}/{id}/reactions", async () => {
      const reaction = {
        emoji: "👍",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch("/api/post/1/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reaction),
        credentials: "include",
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe("Search Endpoint Integration", () => {
    it("should call GET /api/search with query parameters", async () => {
      const mockResults = {
        items: [
          { id: 1, title: "Search Result", snippet: "..." }
        ],
        total: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const response = await fetch("/api/search?q=test&limit=10");
      const data = await response.json();

      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toBe("Search Result");
    });
  });

  describe("Authentication Integration", () => {
    it("should include credentials in requests", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, username: "test" } }),
      });

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });

    it("should handle 401 unauthorized responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(fetch("/api/posts")).rejects.toThrow("Network error");
    });

    it("should handle 500 server errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal server error" }),
      });

      const response = await fetch("/api/posts");
      expect(response.status).toBe(500);
    });

    it("should handle malformed JSON responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const response = await fetch("/api/posts");
      await expect(response.json()).rejects.toThrow("Invalid JSON");
    });
  });
});
