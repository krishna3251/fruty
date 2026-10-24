import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  PICKLE_VIDEO,
  storyStops,
  videoTimeForProgress,
} from "../src/lib/pickleVideo.ts";
import { createVideoSeeker } from "../src/lib/videoSeeker.ts";

test("scroll mapping follows the observed footage, holds its endpoints and reverses without a jump", () => {
  for (const [progress, time] of storyStops)
    assert.ok(Math.abs(videoTimeForProgress(progress) - time) < 0.0001);
  assert.equal(videoTimeForProgress(0.04), 0);
  assert.equal(videoTimeForProgress(1), 239 / 24);
  let last = -1;
  for (let i = 0; i <= 1000; i++) {
    const t = videoTimeForProgress(i / 1000);
    assert.ok(t >= last);
    last = t;
  }
  assert.ok(videoTimeForProgress(0.6) > videoTimeForProgress(0.4));
  assert.equal(videoTimeForProgress(-2), 0);
  assert.equal(videoTimeForProgress(NaN), 0);
  assert.ok(videoTimeForProgress(1, 8) < 8);
  for (const path of [
    PICKLE_VIDEO.src,
    PICKLE_VIDEO.poster,
    PICKLE_VIDEO.finalPoster,
  ])
    assert.ok(existsSync(`public${path}`));
});

test("seeking waits for metadata, coalesces in-flight updates and releases pending work on disposal", () => {
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  let next = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  globalThis.requestAnimationFrame = (cb) => {
    callbacks.set(++next, cb);
    return next;
  };
  globalThis.cancelAnimationFrame = (id) => {
    callbacks.delete(id);
  };
  const flush = () => {
    const work = [...callbacks.values()];
    callbacks.clear();
    work.forEach((cb) => cb(0));
  };
  class Media extends EventTarget {
    readyState = 0;
    duration = 10;
    seeking = false;
    time = 0;
    writes: number[] = [];
    get currentTime() {
      return this.time;
    }
    set currentTime(value: number) {
      this.time = value;
      this.writes.push(value);
      this.seeking = true;
    }
  }
  const media = new Media();
  const seeker = createVideoSeeker(media as unknown as HTMLVideoElement);
  try {
    seeker.seek(3);
    flush();
    assert.deepEqual(media.writes, []);
    media.readyState = 1;
    media.dispatchEvent(new Event("loadedmetadata"));
    flush();
    assert.deepEqual(media.writes, [3]);
    seeker.seek(6);
    seeker.seek(8);
    seeker.seek(2);
    flush();
    assert.deepEqual(media.writes, [3]);
    media.seeking = false;
    media.dispatchEvent(new Event("seeked"));
    flush();
    assert.deepEqual(media.writes, [3, 2]);
    media.seeking = false;
    seeker.seek(2.001);
    flush();
    assert.deepEqual(media.writes, [3, 2]);
    // A tiny delta across a frame boundary must still reach the actual last frame.
    media.time = 9.95368;
    seeker.seek(20);
    flush();
    assert.equal(media.writes.at(-1), 10 - 1 / 24);
    seeker.seek(1);
    seeker.dispose();
    flush();
    media.seeking = false;
    media.dispatchEvent(new Event("seeked"));
    flush();
    assert.equal(media.writes.length, 3);
  } finally {
    seeker.dispose();
    globalThis.requestAnimationFrame = previousRequest;
    globalThis.cancelAnimationFrame = previousCancel;
  }
});
