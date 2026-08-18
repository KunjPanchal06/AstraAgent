// ════════════════════════════════════════════════════════════════
// FILE: hooks/use-mobile.js
// PURPOSE: React hook to detect if the current viewport is mobile
//          (width < 768px). Returns a boolean.
// EXPORTS: useIsMobile
// DEPENDS ON: react
// ════════════════════════════════════════════════════════════════
import * as React from "react";
const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}