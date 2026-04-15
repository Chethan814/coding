"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * NavigationLock: Prevents users from using browser back/forward buttons.
 * Useful for contest environments to enforce integrity.
 */
export default function NavigationLock() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Initial push to history to ensure there is a "forward" state
    window.history.pushState(null, "", pathname);

    const handlePopState = (event: PopStateEvent) => {
      // 2. When back/forward is clicked, push state back immediately
      window.history.pushState(null, "", pathname);
      console.warn("Navigation locked: Use contest controls to navigate.");
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 3. Prevent accidental refresh or tab close
      const msg = "You are in a live contest. Leaving now may forfeit your progress.";
      event.preventDefault();
      event.returnValue = msg;
      return msg;
    };

    // Listen for history changes
    window.addEventListener("popstate", handlePopState);
    
    // Listen for refresh/close
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  return null; // Invisible component
}
