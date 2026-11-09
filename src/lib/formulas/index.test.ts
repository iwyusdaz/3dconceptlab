import { describe, expect, it } from "vitest";
import {
  solarDeclination,
  noonSunAltitude,
  daylightHours,
  beamSpread,
  earthSunDistance,
  moonElongation,
  illuminatedFraction,
  moonEclipticLatitude,
  angularSize,
  angularSizeRatio,
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

describe("moonEclipticLatitude", () => {
  it("is 0 at the nodes (0° and 180°) where eclipses can happen", () => {
    expect(moonEclipticLatitude(0, 5.1)).toBeCloseTo(0, 10);
    expect(moonEclipticLatitude(180, 5.1)).toBeCloseTo(0, 10);
  });

  it("peaks at ±inclination at ±90° from the node line", () => {
    expect(moonEclipticLatitude(90, 5.1)).toBeCloseTo(5.1, 6);
    expect(moonEclipticLatitude(270, 5.1)).toBeCloseTo(-5.1, 6);
  });

  it("is 0 everywhere with inclination 0 — alignment every month", () => {
    for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
      expect(moonEclipticLatitude(angle, 0)).toBeCloseTo(0, 10);
    }
  });
});

describe("angularSize", () => {
  it("Moon at average distance is about 0.52°", () => {
    const size = angularSize(3475, 384400);
    expect(size).toBeGreaterThan(0.5);
    expect(size).toBeLessThan(0.55);
  });

  it("Sun at average distance is about 0.53°", () => {
    const size = angularSize(1391000, 149600000);
    expect(size).toBeGreaterThan(0.5);
    expect(size).toBeLessThan(0.56);
  });

  it("halves when the distance doubles", () => {
    expect(angularSize(3475, 768800)).toBeCloseTo(angularSize(3475, 384400) / 2, 3);
  });
});

describe("angularSizeRatio", () => {
  it("is just below 1 at average distances — total eclipse barely possible", () => {
    const ratio = angularSizeRatio(3475, 384400, 1391000, 149600000);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.05);
  });

  it("is above 1 at perigee (total) and below 1 at apogee (annular)", () => {
    const perigee = angularSizeRatio(3475, 356500, 1391000, 149600000);
    const apogee = angularSizeRatio(3475, 406700, 1391000, 149600000);
    expect(perigee).toBeGreaterThan(1);
    expect(apogee).toBeLessThan(1);
  });
});
