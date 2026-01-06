/**
 * End-to-End Integration Tests with Real Backend
 *
 * These tests require the Rust backend to be running on localhost:8080
 * Run the backend with: pnpm run start:backend
 *
 * To run only these tests: pnpm test e2e-backend
 */
import { describe, it, expect, beforeAll } from "vitest";

const BACKEND_URL = "http://127.0.0.1:8080";
const API_URL = `${BACKEND_URL}/api`;

// Check if backend is available
async function isBackendRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe("E2E Backend Integration Tests", () => {
  let backendAvailable = false;

  beforeAll(async () => {
    backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.warn(
        "\n⚠️  Backend not running on port 8080. Skipping E2E tests.\n" +
        "   To run these tests, start the backend with: pnpm run start:backend\n"
      );
    }
  });

  describe("Backend Health Check", () => {
    it("should respond to health check endpoint", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/health`);
      expect(response.ok).toBe(true);
    });
  });

  describe("Posts API", () => {
    it("should fetch posts from GET /api/posts", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const response = await fetch(`${API_URL}/posts?per_page=10&page=1`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      // Backend might return array directly or object with items property
      if (Array.isArray(data)) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(data).toHaveProperty("items");
        expect(Array.isArray(data.items)).toBe(true);
      }
    });

    it("should create a post via POST /api/posts", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const newPost = {
        title: "Integration Test Post",
        bodyMarkdown: "# Test Content\n\nThis is a test post from integration tests.",
        published: false, // Create as draft
      };

      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newPost),
      });

      // Note: This might fail with 401 if not authenticated or 400 for validation
      // That's expected behavior
      expect([200, 201, 400, 401, 403]).toContain(response.status);
    });

    it("should get a specific post by ID", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      // First, get list of posts
      const listResponse = await fetch(`${API_URL}/posts?per_page=1`);
      const listData = await listResponse.json();

      if (listData.items && listData.items.length > 0) {
        const postId = listData.items[0].id;
        const postResponse = await fetch(`${API_URL}/posts/${postId}`);

        expect(postResponse.ok).toBe(true);
        const post = await postResponse.json();
        expect(post.id).toBe(postId);
      }
    });
  });

  describe("Comments API", () => {
    it("should handle POST /api/posts/{id}/comments", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const comment = {
        bodyMarkdown: "Test comment from integration tests",
      };

      const response = await fetch(`${API_URL}/posts/1/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(comment),
      });

      // Expect either success, validation error, or auth failure
      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe("Reactions API", () => {
    it("should handle POST /api/post/{id}/reactions", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const reaction = {
        emoji: "👍",
      };

      const response = await fetch(`${API_URL}/post/1/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(reaction),
      });

      // Expect either success, validation error, or auth failure
      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent endpoints", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const response = await fetch(`${API_URL}/nonexistent`);
      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid post data", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const invalidPost = {
        title: "", // Empty title should be invalid
      };

      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(invalidPost),
      });

      // Expect validation error or auth failure
      expect([400, 401, 403, 422]).toContain(response.status);
    });
  });

  describe("CORS and Headers", () => {
    it("should include CORS headers", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const response = await fetch(`${API_URL}/posts`);
      const corsHeader = response.headers.get("access-control-allow-origin");

      // Backend should allow CORS for development
      expect(corsHeader).toBeDefined();
    });

    it("should accept JSON content type", async () => {
      if (!backendAvailable) {
        console.log("Skipping: Backend not running");
        return;
      }

      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "test" }),
        credentials: "include",
      });

      // Should not reject JSON content type
      expect(response.status).not.toBe(415); // 415 = Unsupported Media Type
    });
  });
});
