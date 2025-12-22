export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Use internal app login page exclusively (JWT email/password flow)
  // This removes external OAuth / 2FA portal redirects.
  return `${window.location.origin}/login`;
};
