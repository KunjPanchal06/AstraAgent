// ════════════════════════════════════════════════════════════════
// FILE: lib/utils.js
// PURPOSE: Shared utility — `cn()` merges Tailwind CSS class
//          names with clsx + tailwind-merge for safe overrides.
// EXPORTS: cn
// DEPENDS ON: clsx, tailwind-merge
// ════════════════════════════════════════════════════════════════
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}