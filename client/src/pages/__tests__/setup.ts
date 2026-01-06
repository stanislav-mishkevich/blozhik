// Test setup utilities for page component tests
import { vi } from "vitest";

// Mock authentication hook
export const mockAuthHook = (overrides = {}) => ({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  logout: vi.fn(),
  ...overrides,
});

// Mock authenticated user
export const mockAuthenticatedUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  displayName: "Test User",
  role: "user",
};

// Mock admin user
export const mockAdminUser = {
  ...mockAuthenticatedUser,
  role: "admin",
};

// Mock location hook
export const mockLocationHook = () => {
  const location = "/";
  const setLocation = vi.fn();
  return [location, setLocation] as const;
};

// Mock React Query mutation
export const mockMutation = (overrides = {}) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: vi.fn(),
  ...overrides,
});

// Mock React Query query
export const mockQuery = (overrides = {}) => ({
  data: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

// Helper to create mock post data
export const mockPost = (overrides = {}) => ({
  id: 1,
  title: "Test Post",
  bodyMarkdown: "Test content",
  authorId: 1,
  authorUsername: "testuser",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  published: true,
  ...overrides,
});

// Helper to create mock comment data
export const mockComment = (overrides = {}) => ({
  id: 1,
  body: "Test comment",
  authorId: 1,
  authorUsername: "testuser",
  postId: 1,
  createdAt: new Date().toISOString(),
  ...overrides,
});
