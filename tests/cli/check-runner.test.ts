import type { StepResult } from "scripts/check";

import { describe, expect, it } from "bun:test";
import { renderReport, truncateOutput } from "scripts/check";

describe("check runner output", () => {
  it("truncates output by line count", () => {
    const output = ["a", "b", "c", "d", "e"].join("\n");
    const truncated = truncateOutput(output, 3);

    expect(truncated.text).toBe(["a", "b", "c"].join("\n"));
    expect(truncated.omittedLines).toBe(2);
  });

  it("renders markdown report with summary and truncated failure output", () => {
    const noisyOutput = Array.from(
      { length: 130 },
      (_, index) => `line ${index + 1}`
    ).join("\n");

    const results: StepResult[] = [
      {
        durationMs: 7,
        output: "",
        status: "pass",
        step: {
          command: [],
          id: "internal",
          name: "Internal",
        },
      },
      {
        durationMs: 11,
        output: noisyOutput,
        status: "fail",
        step: {
          command: [],
          id: "lint",
          name: "Lint",
        },
      },
    ];

    const report = renderReport(results);

    expect(report.includes("# Check Report")).toBe(true);
    expect(report.includes("## Internal")).toBe(true);
    expect(report.includes("## Lint")).toBe(true);
    expect(report.includes("| Step | Status | Duration (ms) |")).toBe(true);
    expect(report.includes("[truncated: omitted 10 lines]")).toBe(true);
    expect(report.includes("line 120")).toBe(true);
    expect(report.includes("line 130")).toBe(false);
  });
});
