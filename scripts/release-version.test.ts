import { describe, expect, it } from "vitest";
import { nextDevelopmentVersion } from "./release-version.js";

describe("development release versions", () => {
  it("starts the daily counter at one", () => {
    expect(nextDevelopmentVersion("1.0.0", "20260807", ["1.0.0"])).toBe("1.0.0-dev.20260807.1");
  });

  it("increments the highest same-day counter across gaps", () => {
    expect(
      nextDevelopmentVersion("1.0.0", "20260807", ["1.0.0-dev.20260807.1", "1.0.0-dev.20260807.3"])
    ).toBe("1.0.0-dev.20260807.4");
  });

  it("continues the daily counter across stable bases", () => {
    expect(
      nextDevelopmentVersion("1.1.0", "20260807", [
        "1.0.0-dev.20260807.1",
        "1.0.0-dev.20260808.8",
        "unrelated",
      ])
    ).toBe("1.1.0-dev.20260807.2");
  });

  it.each([
    ["1.0", "20260807", "base version must be a stable X.Y.Z version"],
    ["1.0.0", "2026-08-07", "release date must use YYYYMMDD"],
  ])("rejects invalid release input", (baseVersion, releaseDate, message) => {
    expect(() => nextDevelopmentVersion(baseVersion, releaseDate, [])).toThrow(message);
  });
});
