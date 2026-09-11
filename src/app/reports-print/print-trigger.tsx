"use client";

import { useEffect } from "react";

/** Auto-opens the browser print dialog once the report has rendered. */
export function PrintTrigger() {
  useEffect(() => {
    const timeout = setTimeout(() => window.print(), 150);
    return () => clearTimeout(timeout);
  }, []);
  return null;
}
