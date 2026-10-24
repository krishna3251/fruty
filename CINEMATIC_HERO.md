# Pineapple scroll film

## Footage analysis

The supplied MP4 was inspected with ffprobe and extracted frames before implementation. Source: 1920×1080, 16:9, H.264, 24 fps, 240 video frames, video duration exactly 10.000 seconds; container duration 10.005 seconds because of its audio track. Source size 3,504,195 bytes. Original keyframes occur only at 0 and 9.083333 seconds.

Observed moments (frame samples, not recipe claims):

| Video time      | Observation                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0–1.75 s        | Empty glass jar, near the centre of the warm beige frame.                                                                           |
| 1.875–2.0 s     | First falling ingredients appear at the upper edge.                                                                                 |
| 2.0–5.75 s      | Pineapple-like yellow pieces, red slices and dark seeds/seasonings fill the jar. The exact ingredients are not verified by footage. |
| 5.75–6.25 s     | Filled jar, falling pieces stop; remaining small particles settle.                                                                  |
| 6.333–7.167 s   | Golden lid enters and descends onto the jar.                                                                                        |
| 7.167–8.5 s     | Closed jar; the camera gradually pushes closer.                                                                                     |
| 8.75–9.958333 s | Jar turns, Tropical Feast label comes into view; final front-facing product shot.                                                   |

Lighting stays warm. The camera/jar scale changes near the end and the label appears through rotation, not an HTML overlay. The original final push-in is tight enough that parts of the jar meet/cross the source-frame boundary. The website uses `object-fit: contain` and does not add cropping, retouch labels, hide the source watermark or manufacture missing image content. Opening/final images are extracted directly from the footage. This is not a seamless looping clip; the implementation holds its final frame and releases into the existing two-flavour product section rather than looping back to an empty jar.

## Delivery asset

Already installed: `public/videos/pineapple-pickle.mp4`, referenced as `/videos/pineapple-pickle.mp4`. No manual placement is needed for this update. Keep this asset and its two WebP posters together when moving the project.

The web delivery copy is 1280×720, H.264/yuv420p, 24 fps, 240 frames, exactly 10 seconds, with a keyframe every six frames (0.25 seconds), no B-frames/audio and faststart metadata. Size: 2,052,924 bytes, versus the original 3,504,195. The supplied original is unchanged. Downscaling/compression preserves the full frame, sequence and product, rather than replacing the animation.

To reproduce from the supplied original using FFmpeg:

```bash
ffmpeg -i input.mp4 -an -c:v libx264 -preset slow -crf 23 -vf scale=1280:720 -pix_fmt yuv420p -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -movflags +faststart public/videos/pineapple-pickle.mp4
ffmpeg -i input.mp4 -frames:v 1 -vf scale=1280:720 -c:v libwebp -quality 85 public/videos/pineapple-pickle-poster.webp
ffmpeg -ss 9.958333 -i input.mp4 -frames:v 1 -vf scale=1280:720 public/videos/pineapple-pickle-final.webp
```

## Interaction

`src/lib/pickleVideo.ts` owns the inspected frame markers and reversible piecewise mapping:

| Scroll progress | Video time                         |
| --------------- | ---------------------------------- |
| 0–8%            | Hold opening frame                 |
| 8–20%           | 0 → 1.833333 s                     |
| 20–58%          | 1.833333 → 5.75 s, filling         |
| 58–64%          | 5.75 → 6.333333 s, settling        |
| 64–79%          | 6.333333 → 7.166667 s, lid closure |
| 79–94%          | 7.166667 → 9.958333 s, reveal      |
| 94–100%         | Hold last actual frame             |

GSAP pins beneath the measured sticky navigation and uses 0.3-second scrub smoothing over 3.2 viewport heights (2.4 on tablet). It never calls autoplay/play during the scroll experience. A frame-scheduled seeker accepts only one outstanding decoder seek and coalesces pending targets, including reverse scroll. It waits for metadata and avoids changes smaller than half a source frame. Progress/typography update through DOM refs and CSS variables, without per-frame React state updates. All observers, timers, media listeners, pending animation frames, pin and timeline are cleaned up on unmount/mode change. No dependencies were added.

At widths below 768 px, heights below 541 px, reduced motion, paused motion, or explicit manual selection, pinning is removed. The same single video offers native controls and accessible chapter/sequence controls; it does not preload the MP4 until requested. The desktop hero preloads this approximately 2 MB primary asset, with an exact opening-frame poster while loading. Error recovery uses an extracted final image, retry and browse links. Slow initial loading offers manual controls and a direct skip. The shop stays reachable from navigation and the hero at every stage.

Site navigation uses the requested Fermented Pickles name and explicitly says “Featuring Tropical Feast”; the footage, owner logo, product records and two confirmed flavours retain their Tropical Feast identity. No new product/price/ingredient/health claims were added.

## Changed files

- `src/components/CinematicHero.tsx`: isolated hero, media states, GSAP choreography and accessible manual mode.
- `src/lib/pickleVideo.ts`: inspected timeline and asset paths.
- `src/lib/videoSeeker.ts`: bounded, event-driven media seeking.
- `src/cinematic.css`: responsive hero composition and motion states.
- `src/App.tsx`, `src/main.tsx`: integrate hero and styles; navigation naming.
- `src/components/MobileShopCTA.tsx`: observe the new hero CTA.
- `src/lib/seo.ts`: homepage metadata for the film.
- `tests/pickle-video.test.ts`, `tests/store.test.ts`: timeline, coalesced seeking, controls/error/retry and regression coverage.
- `public/videos/*`: optimized supplied clip and matching extracted posters.

## Validation

Baseline build, 29 tests and formatting passed before changes. Updated verification and live browser evidence are recorded after the final implementation below. Unit/DOM tests alone do not prove browser video decoding or real-device smoothness.
