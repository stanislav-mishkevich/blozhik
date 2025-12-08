// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { shouldInjectAnalytics, injectUmamiIfConfigured } from "./analytics";

describe("analytics injection", () => {
  beforeEach(() => {
    // clear body between tests
    document.body.innerHTML = "";
  });

  it("should not inject when env variables are missing or blank", () => {
    const env = { VITE_ANALYTICS_ENDPOINT: "", VITE_ANALYTICS_WEBSITE_ID: "" };
    expect(shouldInjectAnalytics(env)).toBe(false);
    const result = injectUmamiIfConfigured({ env, doc: document });
    expect(result).toBeNull();
    expect(document.querySelectorAll("script").length).toBe(0);
  });

  it("should inject script when env variables are present", () => {
    const env = { VITE_ANALYTICS_ENDPOINT: "https://analytics.example.com", VITE_ANALYTICS_WEBSITE_ID: "abc-123" };
    expect(shouldInjectAnalytics(env)).toBe(true);
    const result = injectUmamiIfConfigured({ env, doc: document });
    expect(result).not.toBeNull();
    const script = document.querySelector("script[data-website-id]") as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.getAttribute("data-website-id")).toBe("abc-123");
    expect(script?.src).toContain("https://analytics.example.com/umami");
  });
});
