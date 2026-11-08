import { describe, expect, it } from "vitest";
import {
  solarDeclination,
  noonSunAltitude,
  daylightHours,
  beamSpread,
  earthSunDistance,
  moonElongation,
  illuminatedFraction,
} from "./index";

describe("solarDeclination", () => {
  it("is +tilt at the June solstice and -tilt at the December solstice", () => {
    expect(solarDeclination(172, 23.44)).toBeCloseTo(23.44, 1);
    expect(solarDeclination(355, 23.44)).toBeCloseTo(-23.44, 1);
  });

  it("is 0 with tilt 0", () => {
    expect(solarDeclination(172, 0)).toBeCloseTo(0, 10);
  });
});

describe("noonSunAltitude", () => {
  it("is about 62° at 51.5°N on the June solstice", () => {
    const alt = noonSunAltitude(51.5, 23.44);
    expect(alt).toBeGreaterThanOrEqual(61);
    expect(alt).toBeLessThanOrEqual(63);
  });

  it("is 90° when the Sun is overhead (latitude = declination)", () => {
    expect(noonSunAltitude(23.44, 23.44)).toBeCloseTo(90, 10);
  });
});

describe("daylightHours", () => {
  it("equinox daylight is 12 hours at any latitude", () => {
    for (const lat of [-80, -51.5, 0, 51.5, 80]) {
      expect(daylightHours(lat, 0)).toBeCloseTo(12, 6);
    }
  });

  it("at 80°N daylight is 24 h on the June solstice and 0 h on the December solstice", () => {
    expect(daylightHours(80, 23.44)).toBeCloseTo(24, 6);
    expect(daylightHours(80, -23.44)).toBeCloseTo(0, 6);
  });

  it("with tilt 0, daylight is the same all year (declination always 0)", () => {
    for (const day of [1, 100, 172, 300, 365]) {
      const decl = solarDeclination(day, 0);
      expect(daylightHours(51.5, decl)).toBeCloseTo(12, 6);
    }
  });

  it("daylight is longer in northern summer than winter at 51.5°N", () => {
    const summer = daylightHours(51.5, solarDeclination(172, 23.44));
    const winter = daylightHours(51.5, solarDeclination(355, 23.44));
    expect(summer).toBeGreaterThan(winter);
    expect(summer).toBeGreaterThan(16);
    expect(winter).toBeLessThan(8);
  });
});

describe("beamSpread", () => {
  it("is 1 with the Sun overhead and 2 at altitude 30°", () => {
    expect(beamSpread(90)).toBeCloseTo(1, 10);
    expect(beamSpread(30)).toBeCloseTo(2, 10);
  });

  it("grows as the Sun gets lower and is infinite at/below the horizon", () => {
    expect(beamSpread(10)).toBeGreaterThan(beamSpread(30));
    expect(beamSpread(0)).toBe(Number.POSITIVE_INFINITY);
    expect(beamSpread(-5)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("earthSunDistance", () => {
  it("is about 147.1 million km in early January (perihelion)", () => {
    const d = earthSunDistance(3);
    expect(d).toBeGreaterThan(146.9);
    expect(d).toBeLessThan(147.3);
  });

  it("is about 152.1 million km in early July (aphelion)", () => {
    const d = earthSunDistance(185);
    expect(d).toBeGreaterThan(151.9);
    expect(d).toBeLessThan(152.4);
  });

  it("is closest in January, not July", () => {
    expect(earthSunDistance(3)).toBeLessThan(earthSunDistance(185));
  });
});

describe("moonElongation", () => {
  it("is 0° at new moon and 180° at full moon", () => {
    expect(moonElongation(0)).toBeCloseTo(0, 10);
    expect(moonElongation(180)).toBeCloseTo(180, 10);
  });

  it("wraps angles into [0, 360)", () => {
    expect(moonElongation(370)).toBeCloseTo(10, 10);
    expect(moonElongation(-90)).toBeCloseTo(270, 10);
  });
});

describe("illuminatedFraction", () => {
  it("is 0 at new moon, 0.5 at first and last quarter, 1 at full moon", () => {
    expect(illuminatedFraction(0)).toBeCloseTo(0, 10);
    expect(illuminatedFraction(90)).toBeCloseTo(0.5, 10);
    expect(illuminatedFraction(270)).toBeCloseTo(0.5, 10);
    expect(illuminatedFraction(180)).toBeCloseTo(1, 10);
  });
});
