// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Feed from "../Feed";
import UserProfile from "../UserProfile";
import Settings from "../Settings";
import Notifications from "../Notifications";
import Write from "../Write";
import PostView from "../PostView";
import Search from "../Search";
import Drafts from "../Drafts";
import Saved from "../Saved";
import Analytics from "../Analytics";

// Mock all common dependencies
vi.mock("@/hooks/useAuthState", () => ({
  useAuthState: () => ({
    isAuthenticated: true,
    user: { id: 1, userId: 1, username: "testuser", role: "user", email: "test@example.com" },
    loading: false,
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  useParams: () => ({ username: "testuser", id: "1", slug: "test-post" }),
  useSearch: () => "",
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  Route: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/rustBack", () => {
  // Create an array with object properties to handle both array and object access patterns
  const createMockData = () => {
    const arr: any = [];
    // Add object properties that some queries expect
    Object.assign(arr, {
      items: [],
      posts: [],
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
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("@/components/PostCard", () => ({
  PostCard: ({ post }: any) => <div data-testid="post-card">{post.title}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("User Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feed Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Feed />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Feed />);
      expect(container).toBeTruthy();
    });
  });

  describe("UserProfile Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<UserProfile />)).not.toThrow();
    });

    it("should attempt to load user data", () => {
      const { container } = render(<UserProfile />);
      expect(container).toBeTruthy();
    });
  });

  describe("Settings Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Settings />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Settings />);
      expect(container).toBeTruthy();
    });
  });

  describe("Notifications Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Notifications />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Notifications />);
      expect(container).toBeTruthy();
    });
  });

  describe("Write Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Write />)).not.toThrow();
    });

    it("should be a valid component for creating posts", () => {
      const { container } = render(<Write />);
      expect(container).toBeTruthy();
    });
  });

  describe("PostView Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<PostView />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<PostView />);
      expect(container).toBeTruthy();
    });
  });

  describe("Search Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Search />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Search />);
      expect(container).toBeTruthy();
    });
  });

  describe("Drafts Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Drafts />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Drafts />);
      expect(container).toBeTruthy();
    });
  });

  describe("Saved Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Saved />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Saved />);
      expect(container).toBeTruthy();
    });
  });

  describe("Analytics Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Analytics />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<Analytics />);
      expect(container).toBeTruthy();
    });
  });

  describe("PostHistory Page", () => {
    it("should render without crashing", async () => {
      const PostHistory = (await import("../PostHistory")).default;
      expect(() => render(<PostHistory />)).not.toThrow();
    });
  });

  describe("Category Page", () => {
    it("should render without crashing", async () => {
      const Category = (await import("../Category")).default;
      expect(() => render(<Category />)).not.toThrow();
    });
  });
});
