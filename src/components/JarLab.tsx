import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  MoveVertical,
  RotateCcw,
  Hand,
  Play,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { PICKLE_VIDEO } from "../lib/pickleVideo";
import { createVideoSeeker } from "../lib/videoSeeker";
import { dragOpenness, jarTime } from "../lib/jarInteraction";
export default function JarLab({ paused = false }: { paused?: boolean }) {
  const reduced = useReducedMotion();
  const simple = !!reduced || paused;
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const seek = useRef<(time: number) => void>(() => {});
  const drag = useRef<{ id: number; y: number; start: number } | null>(null);
  const value = useRef(0);
  const [openness, setOpenness] = useState(0);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [slow, setSlow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const update = useCallback((next: number) => {
    const v = Math.round(Math.min(100, Math.max(0, next)));
    value.current = v;
    setOpenness(v);
    seek.current(jarTime(v));
  }, []);
  useEffect(() => {
    const media = video.current;
    if (!media || !active || simple || failed) return;
    const seeker = createVideoSeeker(media);
    seek.current = seeker.seek;
    const metadata = () => seeker.seek(jarTime(value.current));
    const settled = () => {
      if (Math.abs(media.currentTime - jarTime(value.current)) < 0.08)
        setReady(true);
    };
    media.addEventListener("loadedmetadata", metadata);
    media.addEventListener("seeked", settled);
    if (media.readyState >= 1) metadata();
    const timeout = window.setTimeout(() => setSlow(true), 8000);
    return () => {
      seeker.dispose();
      seek.current = () => {};
      window.clearTimeout(timeout);
      media.removeEventListener("loadedmetadata", metadata);
      media.removeEventListener("seeked", settled);
    };
  }, [active, simple, failed]);
  const staticView = simple || failed || (slow && !ready);
  const canDrag = active && (ready || staticView);
  return (
    <section
      className="jar-lab section-pad"
      id="jar-lab"
      aria-labelledby="jar-lab-title"
    >
      <div className="jar-lab-copy">
        <span className="eyebrow">
          THE JAR LAB / A LITTLE PLAY BEFORE YOUR PLATE
        </span>
        <h2 id="jar-lab-title">
          Go on.
          <br />
          <em>Open a little joy.</em>
        </h2>
        <p>
          One jar. You’re in control. Drag up to lift the golden lid, then slide
          it back down. Satisfyingly simple.
        </p>
        <div className="jar-lab-instructions">
          <span>
            <Hand size={18} /> Mouse, touch or keyboard
          </span>
          <span>
            <MoveVertical size={18} /> Drag the jar or use the slider
          </span>
        </div>
        <a href="/products/tropical-pineapple-pickle" className="text-link">
          Meet Pineapple Pickle <ArrowUpRight size={17} />
        </a>
        <small>
          The original product film, played in reverse through its lid-closing
          moment. A visual experience, not a recipe or ingredient list.
        </small>
      </div>
      <div className={`jar-lab-console ${dragging ? "is-dragging" : ""}`}>
        <div className="jar-console-top">
          <span>
            <i aria-hidden="true" />
            {openness >= 95 ? "LID LIFTED" : "YOUR MOVE"}
          </span>
          <span>01 / PINEAPPLE</span>
        </div>
        <div
          ref={stage}
          className={`jar-lab-stage ${canDrag ? "is-interactive" : ""}`}
          onPointerDown={(e) => {
            if (!canDrag || e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            drag.current = {
              id: e.pointerId,
              y: e.clientY,
              start: value.current,
            };
            setDragging(true);
          }}
          onPointerMove={(e) => {
            if (drag.current?.id !== e.pointerId) return;
            update(
              dragOpenness(
                drag.current.start,
                drag.current.y,
                e.clientY,
                (stage.current?.clientHeight || 300) * 0.45,
              ),
            );
          }}
          onPointerUp={(e) => {
            if (drag.current?.id === e.pointerId) {
              drag.current = null;
              setDragging(false);
              e.currentTarget.releasePointerCapture?.(e.pointerId);
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            setDragging(false);
          }}
        >
          <img
            className="jar-lab-poster"
            src={
              staticView && openness >= 50
                ? "/videos/jar-lifted.webp"
                : "/videos/jar-sealed.webp"
            }
            alt=""
            width={960}
            height={540}
            loading="lazy"
            draggable={false}
          />
          {active && !simple && !failed && (
            <video
              ref={video}
              className={ready ? "is-ready" : ""}
              src={PICKLE_VIDEO.src}
              muted
              playsInline
              preload="auto"
              width={1280}
              height={720}
              aria-label="Interactive pineapple jar lid"
              onError={() => setFailed(true)}
            />
          )}
          {!active && (
            <button
              className="jar-start"
              onClick={() => {
                setActive(true);
                setSlow(false);
              }}
            >
              <Play size={16} /> Try the jar
            </button>
          )}
          {active && !ready && !staticView && (
            <span className="jar-loading" role="status">
              Preparing your jar…
            </span>
          )}
          {canDrag && (
            <span className="jar-drag-hint" aria-hidden="true">
              <ArrowUp size={15} />
              {openness >= 95 ? "Drag down to close" : "Drag up to open"}
            </span>
          )}
        </div>
        <div className="jar-lab-controls">
          <div className="jar-control-label">
            <label htmlFor="jar-openness">Lift the lid</label>
            <output htmlFor="jar-openness">{openness}%</output>
          </div>
          <input
            id="jar-openness"
            aria-label="Jar lid openness"
            aria-valuetext={
              openness >= 95
                ? "Lid lifted"
                : openness <= 5
                  ? "Lid closed"
                  : `Lid ${openness}% lifted`
            }
            type="range"
            min={0}
            max={100}
            step={1}
            disabled={!active}
            value={openness}
            onChange={(e) => update(Number(e.target.value))}
          />
          <div className="jar-control-actions">
            <button
              onClick={() => {
                setActive(true);
                update(openness >= 95 ? 0 : 100);
              }}
            >
              {openness >= 95 ? "Close the jar" : "Open the jar"}
              <ArrowUpRight size={14} />
            </button>
            <button
              disabled={!active || openness === 0}
              onClick={() => update(0)}
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
          <p className="jar-lab-status" role="status">
            {failed
              ? "The film couldn’t load. You can still open and close the jar using its original still frames."
              : simple
                ? "Simplified still-frame mode. No automatic animation."
                : slow && !ready
                  ? "The film is loading slowly. Original still frames keep the controls usable."
                  : openness >= 95
                    ? "Lid lifted. Nice move. Your next move? Pick a flavour."
                    : "No scroll tricks. Just you and the jar."}
          </p>
        </div>
      </div>
    </section>
  );
}
