import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  generateLevelCode,
  getLevelFromCode,
  MAX_CODED_LEVEL,
  MIN_CODED_LEVEL,
} from "./levelCodes";

test("all 200 levels have unique permanent four-digit codes", () => {
  const codes = Array.from(
    { length: MAX_CODED_LEVEL - MIN_CODED_LEVEL + 1 },
    (_, index) => generateLevelCode(index + MIN_CODED_LEVEL),
  );

  assert.equal(codes.length, 200);
  assert.equal(new Set(codes).size, 200);
  codes.forEach((code) => assert.match(code, /^\d{4}$/));

  const contractHash = createHash("sha256")
    .update(codes.join(","))
    .digest("hex");
  assert.equal(
    contractHash,
    "237434d5c727dff04916ca1198207c752b8627a4c1ac3c45115502aef0eb8df6",
    "The public level-code mapping changed. Existing player codes must never change.",
  );
});

test("every permanent code resolves to its original level", () => {
  for (let levelId = MIN_CODED_LEVEL; levelId <= MAX_CODED_LEVEL; levelId++) {
    assert.equal(getLevelFromCode(generateLevelCode(levelId)), levelId);
  }
});

test("previously released codes remain unchanged", () => {
  assert.equal(generateLevelCode(10), "9730");
  assert.equal(generateLevelCode(30), "9190");
  assert.equal(generateLevelCode(100), "7300");
  assert.equal(generateLevelCode(110), "7030");
  assert.equal(generateLevelCode(200), "4600");
});

test("levels that previously lacked codes now have permanent codes", () => {
  assert.equal(generateLevelCode(1), "9973");
  assert.equal(generateLevelCode(101), "7273");
  assert.equal(generateLevelCode(109), "7057");
});

test("invalid levels and malformed codes are rejected", () => {
  assert.equal(generateLevelCode(0), "");
  assert.equal(generateLevelCode(201), "");
  assert.equal(generateLevelCode(1.5), "");
  assert.equal(getLevelFromCode("123"), null);
  assert.equal(getLevelFromCode("abcd"), null);
});
