// One outstanding seek at a time. Rapid scroll changes replace the pending target,
// rather than repeatedly cancelling the decoder's in-flight work.
export function createVideoSeeker(video: HTMLVideoElement) {
  let target: number | null = null;
  let frame = 0;
  let disposed = false;
  const schedule = () => {
    if (!frame && !disposed) frame = requestAnimationFrame(flush);
  };
  const flush = () => {
    frame = 0;
    if (disposed || target === null || video.readyState < 1 || video.seeking)
      return;
    const sameFrame =
      Math.floor(video.currentTime * 24 + 0.0001) ===
      Math.floor(target * 24 + 0.0001);
    if (sameFrame && Math.abs(video.currentTime - target) < 1 / 48) {
      target = null;
      return;
    }
    try {
      video.currentTime = target;
    } catch {
      // Metadata/data events retry the newest target when the browser is ready.
    }
  };
  for (const event of ["seeked", "loadedmetadata", "loadeddata", "progress"])
    video.addEventListener(event, schedule);
  return {
    seek(time: number) {
      if (!Number.isFinite(time)) return;
      target = Math.max(
        0,
        Math.min(
          time,
          Number.isFinite(video.duration)
            ? Math.max(0, video.duration - 1 / 24)
            : time,
        ),
      );
      schedule();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      for (const event of [
        "seeked",
        "loadedmetadata",
        "loadeddata",
        "progress",
      ])
        video.removeEventListener(event, schedule);
    },
  };
}
