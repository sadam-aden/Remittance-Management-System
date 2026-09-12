export const THEME_STORAGE_KEY = "theme";
export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_OPTIONS)[number];

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return preference;
}

/** Applies the resolved theme to the document — dark is the unconditional default (no attribute), light is the opt-in (see globals.css). */
export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  if (resolved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function getStoredThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return (THEME_OPTIONS as readonly string[]).includes(stored ?? "") ? (stored as ThemePreference) : "system";
}

// Inlined into a blocking <script> in the root layout (must run before first
// paint, in plain JS — it executes before React hydrates or any module of
// this file is loaded, so the logic is deliberately duplicated here as a
// string rather than imported).
export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var pref = localStorage.getItem("${THEME_STORAGE_KEY}") || "system";
    var resolved = pref === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : pref;
    if (resolved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
})();
`;
