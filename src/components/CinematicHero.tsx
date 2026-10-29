import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Film,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import {
  PICKLE_VIDEO,
  storyChapters,
  videoTimeForProgress,
  progressForVideoTime,
  progressForScroll,
} from "../lib/pickleVideo";
import { useCatalogue } from "../context/Catalogue";
import { useBusiness } from "../context/Business";
import { money } from "../data/products";
import { STANDARD_DELIVERY_CHARGE } from "../lib/business";
import { createVideoSeeker } from "../lib/videoSeeker";

const scrollScreen = "(min-width: 768px) and (min-height: 760px)";

export default function CinematicHero({
  paused = false,
}: {
  paused?: boolean;
}) {
  const { products } = useCatalogue();
  const { heroVideoMode } = useBusiness();
  const prices = products
    .filter(
      (p) =>
        p.price !== null &&
        p.availability !== "unavailable" &&
        p.stockQuantity !== 0,
    )
    .map((p) => p.price!);
  const sizes = [...new Set(products.map((p) => p.jarSize).filter(Boolean))];
  const video = useRef<HTMLVideoElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const seek = useRef<(time: number) => void>(() => {});
  const [manual, setManual] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [scrollScreenReady, setScrollScreenReady] = useState(
    () => window.matchMedia(scrollScreen).matches,
  );
  const [playing, setPlaying] = useState(false);
  const [filmPaused, setFilmPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "slow" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const motionAvailable =
    !reducedMotion && !paused && !manual && status !== "error";
  const scrollFilm =
    motionAvailable && heroVideoMode === "scroll" && scrollScreenReady;
  const autoplayFilm = motionAvailable && !scrollFilm;
  const manualFilm = !scrollFilm && !autoplayFilm;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const query = window.matchMedia(scrollScreen);
    const update = () => setScrollScreenReady(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const media = video.current;
    if (!media || !autoplayFilm || filmPaused) return;
    let inView = true;
    let active = true;
    const playVisible = () => {
      if (!active || document.hidden || !inView || media.ended) return;
      void media.play().catch(() => {
        /* The explicit Play button remains available. */
      });
    };
    const visibility = () => {
      if (document.hidden || !inView) {
        if (!media.paused) media.pause();
      } else playVisible();
    };
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? false;
              visibility();
            },
            { threshold: 0.15 },
          )
        : null;
    observer?.observe(media);
    document.addEventListener("visibilitychange", visibility);
    media.muted = true;
    playVisible();
    return () => {
      active = false;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      if (!media.paused) media.pause();
    };
  }, [autoplayFilm, filmPaused, attempt]);
  const toggleFilm = () => {
    const media = video.current;
    if (!media) return;
    if (!media.paused) {
      setFilmPaused(true);
      media.pause();
    } else {
      setFilmPaused(false);
      if (media.ended) media.currentTime = 0;
      void media.play().catch(() => setManual(true));
    }
  };

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

  useEffect(() => {
    const container = region.current;
    const section = hero.current;
    const media = video.current;
    if (!scrollFilm || !container || !section || !media) return;
    if (!media.paused) media.pause();
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const header = document.querySelector(".pantry-header");
      const headerHeight = header?.getBoundingClientRect().height || 78;
      const stickyTop = `${headerHeight}px`;
      if (container.style.getPropertyValue("--hero-sticky-top") !== stickyTop)
        container.style.setProperty("--hero-sticky-top", stickyTop);
      const progress = progressForScroll(
        container.getBoundingClientRect().top,
        container.offsetHeight,
        section.offsetHeight,
        headerHeight,
      );
      seek.current(videoTimeForProgress(progress, media.duration || 10));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      container.style.removeProperty("--hero-sticky-top");
    };
  }, [scrollFilm, attempt]);

  const selectMoment = (progress: number) => {
    if (video.current) {
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
    <div
      ref={region}
      className={`cinema-scroll-region ${scrollFilm ? "is-scroll-story" : ""}`}
    >
      <section
        ref={hero}
        className={`cinema-hero is-simple is-inline-film is-background-film ${autoplayFilm ? "is-autoplay-film" : ""}`}
        data-mode={scrollFilm ? "scroll" : autoplayFilm ? "autoplay" : "manual"}
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
            preload={autoplayFilm || scrollFilm ? "auto" : "none"}
            autoPlay={autoplayFilm && !filmPaused}
            loop={autoplayFilm}
            controls={manualFilm && status !== "error"}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={() => {
              if (manualFilm && range.current && video.current)
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
          {!manual && (status === "loading" || status === "slow") && (
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
          {autoplayFilm && (
            <button
              className="cinema-playback"
              onClick={toggleFilm}
              aria-label={playing ? "Pause product film" : "Play product film"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
              <span>
                {playing ? "Pause" : video.current?.ended ? "Replay" : "Play"}
              </span>
            </button>
          )}
        </div>
        <div className="cinema-copy">
          <div className="cinema-intro">
            <span className="eyebrow">TROPICAL FEAST · HYDERABAD</span>
            <h1 id="cinema-title">
              Pickles with <br />
              <em>personality.</em>
            </h1>
            <p>
              Meet our pineapple and cucumber pickles: crisp, spicy and tangy.
              Choose your favourite and enquire in just a few clicks.
            </p>
            <div className="hero-shopping-actions">
              <a href="/shop" className="button primary">
                Shop our pickles <ArrowUpRight size={17} />
              </a>
              <a href="/ordering" className="hero-order-link">
                How ordering works <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="hero-shopping-note">
              <strong>
                {sizes.length === 1 ? `${sizes[0]} jars` : "Explore our jars"}
                {prices.length
                  ? ` · from ${money(Math.min(...prices))}`
                  : " · ask about availability"}
              </strong>
              <span>
                Hyderabad enquiries · {money(STANDARD_DELIVERY_CHARGE)} standard
                delivery per order
              </span>
            </div>
          </div>
        </div>
        <p id="cinema-description" className="sr-only">
          A ten-second product animation: an empty jar, pineapple pieces and
          seasonings falling, a golden lid closing, and the Tropical Feast
          pineapple label turning into view.{" "}
          {scrollFilm
            ? "The film follows your scroll."
            : autoplayFilm
              ? "The muted film plays automatically and can be paused."
              : "Use the video controls or sequence slider to explore the film."}{" "}
          The film is a visual presentation, not a verified recipe.
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
          {scrollFilm && (
            <p className="cinema-scroll-hint">
              Scroll to explore the jar story
            </p>
          )}
          {manualFilm && (
            <div className="cinema-manual-controls">
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
                <span>PLAY OR SCRUB THE FILM AT YOUR OWN PACE</span>
              </div>
            </div>
          )}
          {status === "loading" && (autoplayFilm || scrollFilm) && (
            <p className="cinema-status" role="status">
              Preparing your jar story…
            </p>
          )}
          {status === "slow" && (autoplayFilm || scrollFilm) && (
            <p className="cinema-status" role="status">
              The film is taking a little longer. The opening image stays
              visible.{" "}
              <button onClick={() => setManual(true)}>
                Use video controls
              </button>{" "}
              or <a href="#collections">browse the pickles</a>.
            </p>
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
    </div>
  );
}
