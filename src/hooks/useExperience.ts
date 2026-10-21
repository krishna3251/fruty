import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
export function useExperience(
  root: RefObject<HTMLDivElement | null>,
  route: string,
  paused: boolean,
) {
  useEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const lenis = new Lenis({
          lerp: 0.11,
          smoothWheel: true,
          anchors: true,
          allowNestedScroll: true,
          prevent: (node) => !!node.closest("[data-lenis-prevent]"),
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        const stop = () =>
          document.body.style.overflow === "hidden"
            ? lenis.stop()
            : lenis.start();
        const observer = new MutationObserver(stop);
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ["style"],
        });
        stop();
        return () => {
          observer.disconnect();
          gsap.ticker.remove(tick);
          lenis.destroy();
        };
      },
    );
    return () => mm.revert();
  }, [paused]);
  useEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        if (!root.current) return;
        const area = root.current;
        const ctx = gsap.context(() => {
          const layers = Array.from(
            area.querySelectorAll<HTMLElement>("[data-depth]"),
          );
          const updates = layers.map((el) => ({
            el,
            x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
          }));
          const move = (e: PointerEvent) => {
            const box = area
              .querySelector(".hero-art")
              ?.getBoundingClientRect();
            if (!box) return;
            const x = (e.clientX - (box.left + box.width / 2)) / box.width;
            const y = (e.clientY - (box.top + box.height / 2)) / box.height;
            updates.forEach(({ el, x: toX, y: toY }) => {
              const depth = Number(el.dataset.depth);
              toX(gsap.utils.clamp(-1, 1, x) * depth);
              toY(gsap.utils.clamp(-1, 1, y) * depth);
            });
          };
          const reset = () =>
            updates.forEach(({ x, y }) => {
              x(0);
              y(0);
            });
          area.addEventListener("pointermove", move, { passive: true });
          area.addEventListener("pointerleave", reset);
          return () => {
            area.removeEventListener("pointermove", move);
            area.removeEventListener("pointerleave", reset);
          };
        }, area);
        return () => ctx.revert();
      },
    );
    return () => mm.revert();
  }, [root, route, paused]);
  useEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        root.current
          ?.querySelectorAll(
            ".story-title h2,.collection-intro h2,.seasonal h2",
          )
          .forEach((el) =>
            gsap.fromTo(
              el,
              { y: 35, opacity: 0.3 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top 95%",
                  end: "top 55%",
                  scrub: 0.8,
                },
              },
            ),
          );
        const progress = document.querySelector(".reading-progress");
        if (progress)
          gsap.fromTo(
            progress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: document.documentElement,
                start: 0,
                end: "max",
                scrub: 0.2,
              },
            },
          );
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [root, route, paused]);
}
