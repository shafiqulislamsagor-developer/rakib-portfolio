import * as React from "react";

const MOBILE_BREAKPOINT = 640;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * True on phone-width screens. The media query is an external store, so it is
 * read through useSyncExternalStore: no state is set from an effect, and the
 * server render gets the desktop answer rather than a flash of the wrong one.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
