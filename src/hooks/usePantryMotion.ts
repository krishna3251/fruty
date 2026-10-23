import { useEffect, type RefObject } from "react";
export function usePantryMotion(
  root: RefObject<HTMLDivElement | null>,
  path: string,
  paused: boolean,
) {
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelled || !root.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add(
          "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
          () => {
            const ctx = gsap.context(() => {
              root.current
                ?.querySelectorAll<HTMLElement>(".pickle-feature")
                .forEach((scene) => {
                  gsap.fromTo(
                    scene.querySelectorAll(".pickle-feature-jars img"),
                    { y: 26, rotation: -2 },
                    {
                      y: -26,
                      rotation: 2,
                      ease: "none",
                      scrollTrigger: {
                        trigger: scene,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1,
                      },
                    },
                  );
                  gsap.fromTo(
                    scene.querySelector("h2"),
                    { x: -12 },
                    {
                      x: 12,
                      ease: "none",
                      scrollTrigger: {
                        trigger: scene,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1,
                      },
                    },
                  );
                });
            }, root);
            return () => ctx.revert();
          },
        );
        dispose = () => mm.revert();
      })
      .catch(() => {
        /* The full store remains usable if optional animation cannot load. */
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [root, path, paused]);
}
