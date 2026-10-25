import { useEffect, useState } from "react";
export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new window.PopStateEvent("popstate"));
}
export function useRoute() {
  const [location, setLocation] = useState(
    () => window.location.pathname + window.location.hash,
  );
  useEffect(() => {
    const onChange = () =>
      setLocation(window.location.pathname + window.location.hash);
    const links = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Clerk owns its hash-based verification and recovery routes.
      if (
        url.pathname === window.location.pathname &&
        url.hash &&
        anchor.closest(".cl-rootBox,.cl-cardBox")
      )
        return;
      if (url.pathname === window.location.pathname) {
        if (
          url.hash &&
          url.hash !== "#" &&
          !document.getElementById(url.hash.slice(1))
        ) {
          e.preventDefault();
          navigate(url.hash === "#shop" ? "/shop" : "/" + url.hash);
        }
        return;
      }
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };
    window.addEventListener("popstate", onChange);
    document.addEventListener("click", links);
    return () => {
      window.removeEventListener("popstate", onChange);
      document.removeEventListener("click", links);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash) {
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: "instant" });
      } else window.scrollTo({ top: 0, behavior: "instant" });
      const heading = document.querySelector<HTMLElement>("main h1,main h2");
      if (heading && window.location.pathname !== "/") {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location]);
  return location.split("#")[0];
}
