import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  CROSSFADE,
  LANDING,
  TAKEOFF,
  landingMarkFor,
  sectionFromHash,
  transitionType,
} from "./landing.ts";

describe("sectionFromHash", () => {
  test("reads a station or the console", () => {
    assert.equal(sectionFromHash("#backend"), "backend");
    assert.equal(sectionFromHash("#commerce"), "commerce");
    assert.equal(sectionFromHash("labs"), "labs");
    assert.equal(sectionFromHash("#transmission"), "transmission");
  });

  test("ignores anything else", () => {
    assert.equal(sectionFromHash(""), null);
    assert.equal(sectionFromHash("#"), null);
    assert.equal(sectionFromHash("#guild"), null);
    assert.equal(sectionFromHash("#team-mykhailo"), null);
    assert.equal(sectionFromHash("#Labs"), null);
  });
});

describe("transitionType", () => {
  test("flight to a light page lands, the way back takes off", () => {
    assert.equal(transitionType("flight", "light"), LANDING);
    assert.equal(transitionType("light", "flight"), TAKEOFF);
  });

  test("between light pages it is a crossfade", () => {
    assert.equal(transitionType("light", "light"), CROSSFADE);
    assert.equal(transitionType("flight", "flight"), CROSSFADE);
  });
});

describe("landingMarkFor", () => {
  test("About takes the cover, a case study its own product", () => {
    assert.equal(landingMarkFor("/en/about", "boowie"), "cover");
    assert.equal(landingMarkFor("/cs/work/omnibus", "boowie"), "product:omnibus");
  });

  test("Work takes the station's product, or none", () => {
    assert.equal(landingMarkFor("/ru/work", "boowie"), "product:boowie");
    assert.equal(landingMarkFor("/en/work", null), null);
  });

  test("other pages take nothing", () => {
    assert.equal(landingMarkFor("/en/terms", "boowie"), null);
    assert.equal(landingMarkFor("/en", "boowie"), null);
  });
});
