/**
 * Auth token + user session in cookies (readable by JS for Bearer header).
 * Login sets these; apiCall reads the token from the cookie.
 */
(function (global) {
  const TOKEN_KEY = "agrirent_token";
  const USER_KEY = "agrirent_user";
  const SESSION_DAYS = 7;

  function setCookie(name, value, days = SESSION_DAYS) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      if (part.startsWith(prefix)) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return null;
  }

  function deleteCookie(name) {
    const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
    const paths = new Set(["/"]);
    const dir = window.location.pathname.replace(/\/[^/]*$/, "");
    if (dir) paths.add(dir);

    paths.forEach((path) => {
      document.cookie = `${name}=; expires=${expired}; path=${path}; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=${path}; SameSite=Lax`;
    });
  }

  function getAuthToken() {
    return getCookie(TOKEN_KEY);
  }

  function setAuthToken(token, days = SESSION_DAYS) {
    if (token) setCookie(TOKEN_KEY, token, days);
    else deleteCookie(TOKEN_KEY);
  }

  function getAuthUser() {
    const raw = getCookie(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setAuthUser(user, days = SESSION_DAYS) {
    if (user) setCookie(USER_KEY, JSON.stringify(user), days);
    else deleteCookie(USER_KEY);
  }

  function setAuthSession(user, token, days = SESSION_DAYS) {
    setAuthToken(token, days);
    setAuthUser(user, days);
  }

  function clearAuthSession() {
    deleteCookie(TOKEN_KEY);
    deleteCookie(USER_KEY);
    // Legacy keys from before cookies migration
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (_) {}
  }

  /** Headers to merge into fetch() for protected APIs */
  function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  global.AuthCookies = {
    getAuthToken,
    setAuthToken,
    getAuthUser,
    setAuthUser,
    setAuthSession,
    clearAuthSession,
    getAuthHeaders,
  };
})(typeof window !== "undefined" ? window : global);
