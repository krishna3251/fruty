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
} from "../lib/pickleVideo";
import { createVideoSeeker } from "../lib/videoSeeker";

export default function CinematicHero({
  paused = false,
}: {
  paused?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const seek = useRef<(time: number) => void>(() => {});
  const [manual, setManual] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(false);
  const [filmPaused, setFilmPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "slow" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const autoplayFilm =
    !reducedMotion && !paused && !manual && status !== "error";
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
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
    <section
      className={`cinema-hero is-simple is-inline-film ${autoplayFilm ? "is-autoplay-film" : ""}`}
      data-mode={autoplayFilm ? "autoplay" : "manual"}
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
          preload={autoplayFilm ? "auto" : "none"}
          autoPlay={autoplayFilm && !filmPaused}
          controls={!autoplayFilm && status !== "error"}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={() => {
            if (range.current && video.current)
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
          <span className="eyebrow">TROPICAL FEAST / A PINEAPPLE STORY</span>
          <h1 id="cinema-title">
            Your plate’s
            <br /> <em>plot twist.</em>
          </h1>
          <p>
            Pineapple or cucumber. Crisp, spicy, tangy pickles for the meals you
            love. Small jar. Big personality.
          </p>
          <a href="/shop" className="button primary">
            Pick your jar <ArrowUpRight size={17} />
          </a>
          <a href="#jar-lab" className="hero-lab-link">
            Play with the jar <ArrowUpRight size={15} />
          </a>
          <div className="hero-shopping-note">
            <strong>200 g jars · see prices in cart</strong>
            <span>Hyderabad · delivery confirmed by location</span>
          </div>
        </div>
      </div>
      <p id="cinema-description" className="sr-only">
        A ten-second product animation: an empty jar, pineapple pieces and
        seasonings falling, a golden lid closing, and the Tropical Feast
        pineapple label turning into view. The muted film plays automatically
        and can be paused on any device. With reduced motion, use the manual
        video controls or sequence slider. The film is a visual presentation,
        not a verified recipe.
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
        {!autoplayFilm && (
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
        {status === "loading" && !manual && (
          <p className="cinema-status" role="status">
            Preparing your jar story…
          </p>
        )}
        {status === "slow" && !manual && (
          <p className="cinema-status" role="status">
            The film is taking a little longer. The opening image stays visible.{" "}
            <button onClick={() => setManual(true)}>Use video controls</button>{" "}
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
  );
}
