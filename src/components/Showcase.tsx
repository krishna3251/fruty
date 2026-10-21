import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { products, asset, money, type Product } from "../data/products";
gsap.registerPlugin(ScrollTrigger);
const stories = [
  {
    id: "mango",
    word: "MANGO",
    eyebrow: "01 / THE GOLDEN CHILD",
    title: "Meet your sunshine.",
    copy: "Velvety. Fragrant. Unforgettably sweet.",
    color: "#e9d397",
  },
  {
    id: "strawberry",
    word: "STRAWBERRY",
    eyebrow: "02 / SWEET LITTLE THINGS",
    title: "Love at first bite.",
    copy: "A little tart. A little sweet. All heart.",
    color: "#e7cbd1",
  },
  {
    id: "blueberry",
    word: "BLUEBERRY",
    eyebrow: "03 / LITTLE BLUE WONDERS",
    title: "Small fruit. Big mood.",
    copy: "Tiny bursts of joy, by the handful.",
    color: "#c8d7e5",
  },
  {
    id: "orange",
    word: "CITRUS",
    eyebrow: "04 / THE BRIGHT SIDE",
    title: "Squeeze the day.",
    copy: "Sun-ripened goodness. A fresh kind of energy.",
    color: "#e9d1b9",
  },
];
export default function Showcase({
  onProduct,
  paused = false,
}: {
  onProduct: (p: Product) => void;
  paused?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  useLayoutEffect(() => {
    if (paused) return;
    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const ctx = gsap.context(() => {
          const track = ref.current!.querySelector(".scene-track");
          const panels = gsap.utils.toArray<HTMLElement>(
            ".fruit-scene",
            ref.current!,
          );
          const scroll = gsap.timeline({
            scrollTrigger: {
              trigger: ref.current,
              start: "top top",
              end: () => `+=${window.innerHeight * 3.6}`,
              pin: true,
              anticipatePin: 1,
              onUpdate: (self) => setActive(Math.round(self.progress * 3)),
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
          trigger.current = scroll.scrollTrigger || null;
          scroll.to(track, { xPercent: -75, ease: "none", duration: 3 }, 0);
          panels.forEach((panel, i) => {
            scroll.fromTo(
              panel.querySelector(".scene-fruit"),
              { y: 40, rotation: -12, scale: 0.9 },
              {
                y: -40,
                rotation: 12,
                scale: 1.06,
                duration: Math.min(1.3, 3 - Math.max(0, i - 0.5)),
                ease: "none",
              },
              Math.max(0, i - 0.5),
            );
            scroll.fromTo(
              panel.querySelector(".scene-word"),
              { x: 80 },
              {
                x: -80,
                duration: Math.min(1.3, 3 - Math.max(0, i - 0.5)),
                ease: "none",
              },
              Math.max(0, i - 0.5),
            );
            panel.querySelectorAll(".orbit").forEach((fruit, j) =>
              scroll.fromTo(
                fruit,
                { y: 60 * (j % 2 ? 1 : -1), rotation: -25 },
                {
                  y: -90 * (j % 2 ? 1 : -1),
                  rotation: 30,
                  duration: Math.min(1.4, 3 - Math.max(0, i - 0.5)),
                  ease: "none",
                },
                Math.max(0, i - 0.5),
              ),
            );
            if (i > 0)
              scroll.to(
                ref.current,
                {
                  backgroundColor: stories[i].color,
                  duration: 0.6,
                  ease: "none",
                },
                i - 0.6,
              );
          });
        }, ref);
        return () => {
          ctx.revert();
          trigger.current = null;
        };
      },
    );
    return () => mm.revert();
  }, [paused]);
  return (
    <section
      ref={ref}
      className={`showcase ${paused ? "showcase-paused" : ""}`}
      aria-label="Explore four fruit collections"
      id="collections"
    >
      <div className="chapter-nav" aria-label="Fruit story chapters">
        {stories.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Explore ${s.word.toLowerCase()} chapter`}
            aria-pressed={active === i}
            className={active === i ? "active" : ""}
            onClick={() => {
              if (trigger.current) {
                window.scrollTo({
                  top:
                    trigger.current.start +
                    (trigger.current.end - trigger.current.start) * (i / 3),
                  behavior: "smooth",
                });
              } else {
                ref.current
                  ?.querySelectorAll(".fruit-scene")
                  [i]?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                  });
              }
              setActive(i);
            }}
          >
            <span>0{i + 1}</span>
            {s.word.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="scene-track">
        {stories.map((s, i) => {
          const p = products.find((p) => p.id === s.id)!;
          return (
            <article
              className={`fruit-scene scene-${s.id}`}
              key={s.id}
              style={{ "--scene-color": s.color } as React.CSSProperties}
            >
              <div className="scene-top">
                <span className="eyebrow">{s.eyebrow}</span>
                <span className="scene-note">
                  NATURE'S ORIGINAL SWEET TREAT <span>✳</span>
                </span>
              </div>
              <div className="scene-word" aria-hidden="true">
                {s.word}
              </div>
              <div className="scene-fruit">
                <img
                  width="700"
                  height="600"
                  src={asset(s.id)}
                  alt={p.name}
                  loading="lazy"
                />
              </div>
              <img
                className="orbit orbit-one"
                src={asset(s.id)}
                alt=""
                width="180"
                height="150"
                loading="lazy"
              />
              <img
                className="orbit orbit-two"
                src={asset(s.id === "orange" ? "lemon" : s.id)}
                alt=""
                width="180"
                height="150"
                loading="lazy"
              />
              <div className="scene-bottom">
                <div>
                  <h2>{s.title}</h2>
                  <p>{s.copy}</p>
                </div>
                <button className="scene-product" onClick={() => onProduct(p)}>
                  <span>
                    {p.name}
                    <small>
                      {p.weight} <b>{money(p.price)}</b>
                    </small>
                  </span>
                  <ArrowUpRight size={23} />
                </button>
              </div>
              <div className="scene-pagination">
                <span>0{i + 1}</span>
                <div>
                  <i style={{ width: `${(i + 1) * 25}%` }} />
                </div>
                <span>04</span>
              </div>
              {i === 3 && (
                <a className="scene-shop" href="#shop">
                  Explore the whole harvest <ArrowDownRight size={18} />
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
