import { describe, expect, it } from "vitest";
import {
  type CronPreset,
  cronFromPreset,
  describeCronPreset,
  formatCron,
  presetFromCron,
} from "./cron.js";

function preset(partial: Partial<CronPreset> & Pick<CronPreset, "freq">): CronPreset {
  return {
    n: 3,
    unit: "minutes",
    time: "9:00 AM",
    cron: "",
    ...partial,
  };
}

describe("cronFromPreset", () => {
  it("maps everyday language onto cron", () => {
    expect(cronFromPreset(preset({ freq: "Every day", time: "9:00 AM" }))).toBe("0 9 * * *");
    expect(cronFromPreset(preset({ freq: "Weekdays", time: "8:00 AM" }))).toBe("0 8 * * 1-5");
    expect(cronFromPreset(preset({ freq: "Every week", time: "9:00 AM" }))).toBe("0 9 * * 1");
    expect(cronFromPreset(preset({ freq: "Every month", time: "12:00 PM" }))).toBe("0 12 1 * *");
    expect(cronFromPreset(preset({ freq: "Every hour" }))).toBe("0 * * * *");
    expect(cronFromPreset(preset({ freq: "Every day", time: "12:00 AM" }))).toBe("0 0 * * *");
    expect(cronFromPreset(preset({ freq: "Every day", time: "3:00 PM" }))).toBe("0 15 * * *");
  });

  it("maps intervals including days", () => {
    expect(cronFromPreset(preset({ freq: "Interval", n: 15, unit: "minutes" }))).toBe(
      "*/15 * * * *",
    );
    expect(cronFromPreset(preset({ freq: "Interval", n: 2, unit: "hours" }))).toBe("0 */2 * * *");
    expect(cronFromPreset(preset({ freq: "Interval", n: 3, unit: "days" }))).toBe("0 0 */3 * *");
  });

  it("keeps advanced expressions", () => {
    expect(cronFromPreset(preset({ freq: "Advanced", cron: "0 10 15 * *" }))).toBe("0 10 15 * *");
    expect(cronFromPreset(preset({ freq: "Advanced", cron: "" }))).toBe("*/3 * * * *");
  });
});

describe("presetFromCron", () => {
  it("reads the previous Monday-morning default as weekly", () => {
    expect(presetFromCron("0 9 * * 1")).toMatchObject({
      freq: "Every week",
      time: "9:00 AM",
    });
  });

  it("round-trips the named presets", () => {
    const cases: CronPreset[] = [
      preset({ freq: "Every hour" }),
      preset({ freq: "Every day", time: "6:00 PM" }),
      preset({ freq: "Weekdays", time: "7:00 AM" }),
      preset({ freq: "Every week", time: "9:00 AM" }),
      preset({ freq: "Every month", time: "12:00 PM" }),
      preset({ freq: "Interval", n: 10, unit: "minutes" }),
      preset({ freq: "Interval", n: 5, unit: "hours" }),
      preset({ freq: "Interval", n: 2, unit: "days" }),
      preset({ freq: "Advanced", cron: "0 10 15 * *" }),
    ];
    for (const input of cases) {
      const cron = cronFromPreset(input);
      const parsed = presetFromCron(cron);
      expect(parsed.freq).toBe(input.freq);
      if (input.freq === "Interval") {
        expect(parsed.n).toBe(input.n);
        expect(parsed.unit).toBe(input.unit);
      }
      if (["Every day", "Weekdays", "Every week", "Every month"].includes(input.freq)) {
        expect(parsed.time).toBe(input.time);
      }
      if (input.freq === "Advanced") {
        expect(parsed.cron).toBe(input.cron);
      }
    }
  });

  it("falls back to advanced for expressions the picker cannot represent", () => {
    expect(presetFromCron("0 9 * * 0")).toMatchObject({ freq: "Advanced", cron: "0 9 * * 0" });
    expect(presetFromCron("30 14 15 * *")).toMatchObject({
      freq: "Advanced",
      cron: "30 14 15 * *",
    });
  });
});

describe("formatCron", () => {
  it("shows a human schedule instead of the expression", () => {
    expect(formatCron("0 9 * * 1")).toBe("Every Monday at 9:00 AM");
    expect(formatCron("0 8 * * 1-5")).toBe("Weekdays at 8:00 AM");
    expect(formatCron("*/15 * * * *")).toBe("Every 15 minutes");
    expect(describeCronPreset(preset({ freq: "Every hour" }))).toEqual({
      lead: "Every hour",
      detail: "",
    });
  });
});
