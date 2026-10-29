// Inspected at 24 fps in the supplied 10-second animation; times are video seconds.
export const PICKLE_VIDEO = {
  src: "/videos/pineapple-pickle.mp4",
  poster: "/videos/pineapple-pickle-poster.webp",
  finalPoster: "/videos/pineapple-pickle-final.webp",
  frameRate: 24,
  duration: 10,
  lastFrame: 239 / 24,
};
export const storyStops = [
  [0, 0],
  [0.08, 0],
  [0.2, 44 / 24],
  [0.58, 138 / 24],
  [0.64, 152 / 24],
  [0.79, 172 / 24],
  [0.94, 239 / 24],
  [1, 239 / 24],
] as const;
export const storyChapters = [
  { title: "The beginning", at: 0 },
  { title: "The golden fill", at: 0.2 },
  { title: "The finishing touch", at: 0.64 },
  { title: "Pineapple, revealed", at: 0.94 },
];
export function videoTimeForProgress(progress: number, duration = 10) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  for (let i = 1; i < storyStops.length; i++) {
    const [end, to] = storyStops[i];
    const [start, from] = storyStops[i - 1];
    if (p <= end) {
      const time = from + ((p - start) / (end - start)) * (to - from);
      return Math.min(time, Math.max(0, duration - 1 / PICKLE_VIDEO.frameRate));
    }
  }
  return Math.min(PICKLE_VIDEO.lastFrame, Math.max(0, duration - 1 / 24));
}

export function progressForVideoTime(time: number) {
  if (!Number.isFinite(time) || time <= 0) return 0;
  if (time >= PICKLE_VIDEO.lastFrame) return 1;
  for (let i = 1; i < storyStops.length; i++) {
    const [endProgress, endTime] = storyStops[i];
    const [startProgress, startTime] = storyStops[i - 1];
    if (time <= endTime && endTime > startTime)
      return (
        startProgress +
        ((time - startTime) / (endTime - startTime)) *
          (endProgress - startProgress)
      );
  }
  return 1;
}

// Measure only the distance for which the hero stays sticky below the header.
export function progressForScroll(
  regionTop: number,
  regionHeight: number,
  heroHeight: number,
  headerHeight: number,
) {
  const distance = regionHeight - heroHeight;
  if (distance <= 0) return 0;
  return Math.max(0, Math.min(1, (headerHeight - regionTop) / distance));
}
