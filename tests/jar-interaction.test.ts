import test from "node:test";
import assert from "node:assert/strict";
import { jarTime, dragOpenness } from "../src/lib/jarInteraction.ts";
test("jar dragging maps continuously and reversibly to the observed lid footage and clamps out-of-range input", () => {
  assert.equal(jarTime(0), 7.5);
  assert.equal(jarTime(50), 7);
  assert.equal(jarTime(100), 6.5);
  assert.equal(jarTime(Infinity), 7.5);
  assert.equal(jarTime(-10), 7.5);
  assert.equal(jarTime(150), 6.5);
  assert.equal(dragOpenness(0, 200, 100, 200), 50);
  assert.equal(dragOpenness(50, 100, 200, 200), 0);
  assert.equal(dragOpenness(50, 200, 100, 200), 100);
  assert.equal(dragOpenness(0, 100, -1000, 200), 100);
});
