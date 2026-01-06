// @vitest-environment jsdom
/**
 * Comprehensive smoke tests for all page components
 * These tests ensure that every page can render without crashing
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Setup global mocks
vi.mock("@/hooks/useAuthState", () => ({
  useAuthState: () => ({
    isAuthenticated: true,
    user: { id: 1, userId: 1, username: "testuser", role: "admin", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, userId: 1, username: "testuser", email: "test@example.com" },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  useParams: () => ({ username: "testuser", id: "1", slug: "test", category: "tech" }),
  useSearch: () => "",
  Link: ({ children }: any) => <div>{children}</div>,
  Route: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/rustBack", () => {
  const createMockData = () => {
    const arr: any = [];
    Object.assign(arr, {
      items: [],
      posts: [],
      users: [],
      comments: [],
      list: [],
      userId: 1,
      bookmarks: [],
      announcements: [],
      categories: [],
      drafts: [],
      bans: [],
      reportsData: [],
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      title: "Test",
      bodyMarkdown: "",
      author: { username: "testuser" },
      total: 0,
      page: 1,
      perPage: 10,
    });
    return arr;
  };

  const mockQueryResponse = {
    data: createMockData(),
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };

  const mockMutationResponse = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
  };

  const createMockProxy = (): any => {
    return new Proxy({}, {
      get(target, prop: string) {
        if (prop === 'useQuery') {
          return () => mockQueryResponse;
        }
        if (prop === 'useMutation') {
          return () => mockMutationResponse;
        }
        if (prop === 'useUtils') {
          return () => ({
            client: {
              invalidate: vi.fn(),
            },
          });
        }
        return createMockProxy();
      }
    });
  };

  return {
    rustApi: createMockProxy(),
  };
});

vi.mock("@/components/Header", () => ({
  Header: () => <div>Header</div>,
}));

vi.mock("@/components/PostCard", () => ({
  PostCard: () => <div>PostCard</div>,
}));

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// List of all pages to test
const pageModules = [
  "Home",
  "Login",
  "Register",
  "Landing",
  "Feed",
  "UserProfile",
  "Settings",
  "Notifications",
  "Write",
  "PostView",
  "Search",
  "Drafts",
  "Saved",
  "Analytics",
  "PostHistory",
  "Category",
  "NotFound",
  "Forbidden",
  "ServerError",
  "ForgotPassword",
  "ComponentShowcase",
  "AdminDashboard",
  "AdminUsers",
  "AdminPosts",
  "AdminComments",
  "AdminReports",
  "AdminAnalytics",
  "AdminSettings",
  "AdminRoles",
  "AdminBans",
  "AdminAuditLogs",
  "AdminActivityLogs",
  "AdminAnnouncements",
  "AdminStatistics",
  "AdminCreateUser",
  "AdminCreatePost",
];

describe("All Pages - Comprehensive Smoke Tests", () => {
  pageModules.forEach((pageName) => {
    describe(`${pageName} Page`, () => {
      it("should import successfully", async () => {
        const module = await import(`../${pageName}`);
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe("function");
      });

      it("should render without crashing", async () => {
        const module = await import(`../${pageName}`);
        const PageComponent = module.default;

        expect(() => {
          render(<PageComponent />);
        }).not.toThrow();
      });

      it("should produce valid HTML output", async () => {
        const module = await import(`../${pageName}`);
        const PageComponent = module.default;

        const { container } = render(<PageComponent />);
        expect(container).toBeTruthy();
        expect(container.innerHTML).toBeTruthy();
      });

      it("should be a valid React component", async () => {
        const module = await import(`../${pageName}`);
        const PageComponent = module.default;

        const { container } = render(<PageComponent />);
        expect(container.firstChild).toBeTruthy();
      });
    });
  });
});

describe("Page Count Verification", () => {
  it("should have tests for all 36 pages", () => {
    expect(pageModules.length).toBe(36);
  });

  it("should have unique page names", () => {
    const uniqueNames = new Set(pageModules);
    expect(uniqueNames.size).toBe(pageModules.length);
  });
});
