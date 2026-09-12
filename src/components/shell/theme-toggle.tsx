"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  THEME_STORAGE_KEY,
  applyTheme,
  resolveTheme,
  getStoredThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  // Starts "system" for a consistent server/client first render (the real
  // stored value is only known client-side); synced from localStorage right
  // after mount, same instant the bootstrap script already applied it to the DOM.
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = getStoredThemePreference();
    setPreference(stored);
    setResolved(resolveTheme(stored));

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const current = getStoredThemePreference();
      if (current === "system") setResolved(resolveTheme(current));
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  function choose(next: ThemePreference) {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setPreference(next);
    setResolved(resolveTheme(next));
    applyTheme(next);
  }

  const ActiveIcon = resolved === "light" ? Sun : Moon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-card"
            aria-label="Change theme"
          >
            <ActiveIcon size={16} className="text-text-muted" />
          </button>
        }
      />
      <DropdownMenuContent align="end">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => choose(opt.value)}>
            <opt.icon size={14} />
            <span className="flex-1">{opt.label}</span>
            {preference === opt.value && <Check size={14} className="text-income" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
