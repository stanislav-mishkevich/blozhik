// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../Home";
import Login from "../Login";
import Register from "../Register";
import Landing from "../Landing";

// Mock dependencies
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAuthState", () => ({
  useAuthState: () => ({
    isAuthenticated: false,
    loading: false,
  }),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/rustBack", () => ({
  rustApi: {
    auth: {
      login: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
        }),
      },
      register: {
        useMutation: () => ({
          mutate: vi.fn(),
          isLoading: false,
        }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/Header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: any) => <div>{children}</div>,
}));

describe("Public Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Home Page", () => {
    it("should render without crashing", () => {
      render(<Home />);
      expect(screen.getByText("Example Page")).toBeInTheDocument();
    });

    it("should display loader icon", () => {
      const { container } = render(<Home />);
      const loader = container.querySelector(".animate-spin");
      expect(loader).toBeInTheDocument();
    });

    it("should render example button", () => {
      render(<Home />);
      expect(screen.getByText("Example Button")).toBeInTheDocument();
    });

    it("should render markdown content", () => {
      render(<Home />);
      expect(screen.getByText(/markdown/)).toBeInTheDocument();
    });
  });

  describe("Login Page", () => {
    it("should render login form", () => {
      render(<Login />);
      // Should have email and password inputs
      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should render login button", () => {
      render(<Login />);
      // Look for button or submit element
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should display loading state when loading", () => {
      vi.mocked(vi.importActual("@/hooks/useAuthState")).useAuthState = () => ({
        isAuthenticated: false,
        loading: true,
      });

      render(<Login />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Register Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Register />)).not.toThrow();
    });

    it("should have form elements", () => {
      const { container } = render(<Register />);
      // Should have some input fields
      const inputs = container.querySelectorAll("input");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe("Landing Page", () => {
    it("should render without crashing", () => {
      expect(() => render(<Landing />)).not.toThrow();
    });

    it("should be a valid React component", () => {
      const { container } = render(<Landing />);
      expect(container).toBeTruthy();
    });
  });
});
