// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import AdminUsers from "../AdminUsers";
import AdminPosts from "../AdminPosts";
import AdminComments from "../AdminComments";
import AdminReports from "../AdminReports";
import AdminAnalytics from "../AdminAnalytics";
import AdminSettings from "../AdminSettings";
import AdminRoles from "../AdminRoles";
import AdminBans from "../AdminBans";
import AdminAuditLogs from "../AdminAuditLogs";
import AdminActivityLogs from "../AdminActivityLogs";
import AdminAnnouncements from "../AdminAnnouncements";
import AdminStatistics from "../AdminStatistics";
import AdminCreateUser from "../AdminCreateUser";
import AdminCreatePost from "../AdminCreatePost";

// Mock admin authentication
vi.mock("@/hooks/useAuthState", () => ({
  useAuthState: () => ({
    isAuthenticated: true,
    user: { id: 1, username: "admin", role: "admin" },
    loading: false,
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/admin", vi.fn()],
  useParams: () => ({ id: "1" }),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
  Route: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/rustBack", () => {
  const createMockData = () => {
    const arr: any = [];
    Object.assign(arr, {
      users: [],
      posts: [],
      comments: [],
      items: [],
      bans: [],
      reportsData: [],
      announcements: [],
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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Admin Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AdminDashboard", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminDashboard />)).not.toThrow();
    });

    it("should be a valid admin component", () => {
      const { container } = render(<AdminDashboard />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminUsers", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminUsers />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminUsers />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminPosts", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminPosts />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminPosts />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminComments", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminComments />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminComments />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminReports", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminReports />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminReports />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminAnalytics", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminAnalytics />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminAnalytics />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminSettings", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminSettings />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminSettings />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminRoles", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminRoles />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminRoles />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminBans", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminBans />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminBans />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminAuditLogs", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminAuditLogs />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminAuditLogs />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminActivityLogs", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminActivityLogs />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminActivityLogs />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminAnnouncements", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminAnnouncements />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminAnnouncements />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminStatistics", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminStatistics />)).not.toThrow();
    });

    it("should be a valid component", () => {
      const { container } = render(<AdminStatistics />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminCreateUser", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminCreateUser />)).not.toThrow();
    });

    it("should be a valid form component", () => {
      const { container } = render(<AdminCreateUser />);
      expect(container).toBeTruthy();
    });
  });

  describe("AdminCreatePost", () => {
    it("should render without crashing", () => {
      expect(() => render(<AdminCreatePost />)).not.toThrow();
    });

    it("should be a valid form component", () => {
      const { container } = render(<AdminCreatePost />);
      expect(container).toBeTruthy();
    });
  });
});
