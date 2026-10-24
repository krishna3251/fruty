import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Film, RefreshCw } from "lucide-react";
import {
  PICKLE_VIDEO,
  storyChapters,
  videoTimeForProgress,
  progressForVideoTime,
} from "../lib/pickleVideo";
import { createVideoSeeker } from "../lib/videoSeeker";

const simplifiedQuery =
  "(max-width: 767px), (max-height: 540px), (prefers-reduced-motion: reduce)";
export default function CinematicHero({
  paused = false,
}: {
  paused?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const seek = useRef<(time: number) => void>(() => {});
  const moveScroll = useRef<((progress: number) => void) | null>(null);
  const [simplified, setSimplified] = useState(
    () => window.matchMedia(simplifiedQuery).matches,
  );
  const [manual, setManual] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "slow" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const simple = simplified || paused || manual || status === "error";

  useEffect(() => {
    const query = window.matchMedia(simplifiedQuery);
    const update = () => setSimplified(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const seeker = createVideoSeeker(media);
    seek.current = seeker.seek;
    const ready = () => setStatus("ready");
    const error = () => setStatus("error");
    const slow = window.setTimeout(() => {
      if (media.readyState < 2) setStatus("slow");
    }, 8000);
    media.addEventListener("loadeddata", ready);
    media.addEventListener("error", error);
    if (media.readyState >= 2) ready();
    return () => {
      clearTimeout(slow);
      media.removeEventListener("loadeddata", ready);
      media.removeEventListener("error", error);
      seeker.dispose();
      seek.current = () => {};
    };
  }, [attempt]);

  // Revert the pin wrapper before React removes its DOM node on route changes.
  useLayoutEffect(() => {
    const section = root.current;
    const media = video.current;
    if (!section || !media) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    let resize: ResizeObserver | undefined;
    let refreshFrame = 0;
    if (!media.paused) media.pause();
    section.style.setProperty("--intro-opacity", "1");
    section.style.setProperty("--final-opacity", "0");
    section.style.setProperty("--mid-opacity", "0");
    section.style.setProperty("--intro-y", "0px");
    section.dataset.mode = simple ? "manual" : "scroll";
    const setHeader = () => {
      const height =
        document.querySelector(".pantry-header")?.getBoundingClientRect()
          .height || 100;
      section.style.setProperty("--story-header", `${height}px`);
      return height;
    };
    setHeader();
    if (simple) {
      moveScroll.current = null;
      return;
    }
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const playhead = { progress: 0 };
        const update = () => {
          const p = playhead.progress;
          const intro = Math.max(0, 1 - Math.max(0, p - 0.14) / 0.16);
          const mid =
            Math.min(1, Math.max(0, (p - 0.31) / 0.08)) *
            Math.min(1, Math.max(0, (0.83 - p) / 0.05));
          const final = Math.min(1, Math.max(0, (p - 0.83) / 0.11));
          section.style.setProperty("--story-progress", String(p));
          section.style.setProperty("--intro-opacity", String(intro));
          section.style.setProperty("--intro-y", `${-18 * (1 - intro)}px`);
          section.style.setProperty("--final-opacity", String(final));
          section.style.setProperty("--mid-opacity", String(mid));
          section.dataset.phase =
            p < 0.2 ? "intro" : p < 0.64 ? "fill" : p < 0.83 ? "lid" : "reveal";
          // Hidden links must also leave the tab order/accessibility tree.
          const introEl = section.querySelector<HTMLElement>(".cinema-intro");
          const finalEl = section.querySelector<HTMLElement>(".cinema-final");
          if (introEl) introEl.inert = intro < 0.05;
          if (finalEl) finalEl.inert = final < 0.05;
          if (range.current) range.current.value = String(p * 100);
          if (Number.isFinite(media.duration))
            seek.current(videoTimeForProgress(p, media.duration));
        };
        const ctx = gsap.context(() => {
          const animation = gsap.to(playhead, {
            progress: 1,
            duration: 1,
            ease: "none",
            onUpdate: update,
            scrollTrigger: {
              id: "pineapple-hero",
              trigger: section,
              start: () => `top top+=${setHeader()}`,
              end: () =>
                `+=${Math.round(window.innerHeight * (window.innerWidth < 1024 ? 2.4 : 3.2))}`,
              pin: true,
              scrub: 0.3,
              invalidateOnRefresh: true,
              onRefresh: update,
            },
          });
          const trigger = animation.scrollTrigger!;
          moveScroll.current = (progress) =>
            window.scrollTo({
              top: trigger.start + (trigger.end - trigger.start) * progress,
              behavior: "instant",
            });
        }, section);
        const metadata = () => update();
        media.addEventListener("loadedmetadata", metadata);
        // Observe header only; observing the pinned section can cause refresh loops.
        if (typeof ResizeObserver !== "undefined") {
          const header = document.querySelector(".pantry-header");
          resize = new ResizeObserver(() => {
            setHeader();
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
          });
          if (header) resize.observe(header);
        }
        update();
        // Also refresh downstream fruit scenes after this newly-created pin reserves space.
        ScrollTrigger.refresh();
        revert = () => {
          media.removeEventListener("loadedmetadata", metadata);
          ctx.revert();
          moveScroll.current = null;
        };
      })
      .catch(() => {
        if (!cancelled) setManual(true);
      });
    return () => {
      cancelled = true;
      resize?.disconnect();
      cancelAnimationFrame(refreshFrame);
      revert?.();
      const introEl = section.querySelector<HTMLElement>(".cinema-intro");
      if (introEl) introEl.inert = false;
    };
  }, [simple, attempt]);

  const selectMoment = (progress: number) => {
    if (!simple && moveScroll.current) moveScroll.current(progress);
    else if (video.current) {
      if (video.current.readyState === 0) {
        video.current.preload = "auto";
        video.current.load();
      }
      if (!video.current.paused) video.current.pause();
      seek.current(
        videoTimeForProgress(progress, video.current.duration || 10),
      );
    }
  };
  const retry = () => {
    setStatus("loading");
    setAttempt((v) => v + 1);
    video.current?.load();
  };
  return (
    <section
      ref={root}
      className={`cinema-hero ${simple ? "is-simple" : ""}`}
      aria-labelledby="cinema-title"
      data-phase="intro"
    >
      <div className="cinema-stage">
        <video
          ref={video}
          className="cinema-video"
          src={PICKLE_VIDEO.src}
          poster={PICKLE_VIDEO.poster}
          width="1280"
          height="720"
          muted
          playsInline
          preload={simple ? "none" : "auto"}
          controls={simple && status !== "error"}
          onTimeUpdate={() => {
            if (simple && range.current && video.current)
              range.current.value = String(
                progressForVideoTime(video.current.currentTime) * 100,
              );
          }}
          aria-label="Pineapple pickle: empty jar, filling, golden lid and final Tropical Feast label reveal"
          aria-describedby="cinema-description"
        >
          Your browser cannot play this video. Explore the pineapple and
          cucumber products below.
        </video>
        {!simple && (status === "loading" || status === "slow") && (
          <img
            className="cinema-loading-poster"
            src={PICKLE_VIDEO.poster}
            alt=""
            aria-hidden="true"
            width="1280"
            height="720"
            fetchPriority="high"
          />
        )}
        {status === "error" && (
          <img
            className="cinema-error-poster"
            src={PICKLE_VIDEO.finalPoster}
            width="1280"
            height="720"
            alt="Final pineapple pickle jar from the supplied animation"
          />
        )}
      </div>
      <div className="cinema-copy">
        <div className="cinema-intro">
          <span className="eyebrow">FERMENTED PICKLES / A PINEAPPLE STORY</span>
          <h1 id="cinema-title">
            Tradition,
            <br /> <em>preserved</em>
            <br /> in every bite.
          </h1>
          <p>
            Bold flavours. A little character. Discover the golden side of
            Tropical Feast.
          </p>
          <a href="/shop" className="button primary">
            Discover our pickles <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="cinema-final" inert={!simple}>
          <span className="eyebrow">TROPICAL FEAST / PINEAPPLE PICKLE</span>
          <h2>
            A little tang.
            <br />
            <em>A golden finish.</em>
          </h2>
          <p>
            Crisp. Spicy. Tangy. Meet pineapple pickle, then discover its
            cucumber companion.
          </p>
          <a
            href="/products/tropical-pineapple-pickle"
            className="button primary"
          >
            Discover pineapple <ArrowUpRight size={17} />
          </a>
          <a href="#collections" className="cinema-both text-link">
            Explore both flavours <ArrowDown size={15} />
          </a>
        </div>
        <div className="cinema-mid" aria-hidden="true">
          <span className="eyebrow">ONE JAR. A LITTLE CHARACTER.</span>
          <p>
            Golden moments,
            <br />
            <em>beautifully preserved.</em>
          </p>
        </div>
      </div>
      <p id="cinema-description" className="sr-only">
        A ten-second product animation: an empty jar, pineapple pieces and
        seasonings falling, a golden lid closing, and the Tropical Feast
        pineapple label turning into view. Scroll down or up to move through it
        on desktop. On small screens or with reduced motion, use the video
        controls or sequence slider. The film is a visual presentation, not a
        verified recipe.
      </p>
      <div className="cinema-rail">
        <div className="cinema-rail-top">
          <span>
            <Film size={14} /> PINEAPPLE / THE JAR STORY
          </span>
          <a href="#collections">
            Skip to our flavours <ArrowDown size={13} />
          </a>
        </div>
        <div className="cinema-chapters" aria-label="Animation chapters">
          {storyChapters.map((chapter) => (
            <button
              key={chapter.title}
              onClick={() => selectMoment(chapter.at)}
              disabled={status === "error"}
            >
              {chapter.title}
            </button>
          ))}
        </div>
        <label className="cinema-slider">
          <span className="sr-only">Explore the jar sequence</span>
          <input
            ref={range}
            type="range"
            min="0"
            max="100"
            step="0.1"
            defaultValue="0"
            disabled={status === "error"}
            onChange={(e) => selectMoment(Number(e.target.value) / 100)}
          />
        </label>
        <div className="cinema-footnote">
          <span>
            {simple
              ? "PLAY OR SCRUB THE FILM AT YOUR OWN PACE"
              : "SCROLL TO FILL · REVERSE TO REWIND"}
          </span>
          {!simple && (
            <button onClick={() => setManual(true)}>Use video controls</button>
          )}
        </div>
        {!simple && status === "loading" && (
          <p className="cinema-status" role="status">
            Preparing your jar story…
          </p>
        )}
        {!simple && status === "slow" && (
          <p className="cinema-status" role="status">
            The film is taking a little longer. The opening image stays visible.{" "}
            <button onClick={() => setManual(true)}>Use video controls</button>{" "}
            or <a href="#collections">browse the pickles</a>.
          </p>
        )}
        {!simple && (status === "loading" || status === "slow") && (
          <img
            className="cinema-loading-poster"
            src={PICKLE_VIDEO.poster}
            alt=""
            aria-hidden="true"
            width="1280"
            height="720"
            fetchPriority="high"
          />
        )}
        {status === "error" && (
          <p className="cinema-status" role="status">
            The film couldn’t load.{" "}
            <button onClick={retry}>
              <RefreshCw size={13} /> Retry film
            </button>{" "}
            or <a href="#collections">explore both flavours</a>.
          </p>
        )}
      </div>
    </section>
  );
}
