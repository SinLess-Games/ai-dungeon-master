import { describe, expect, it } from "vitest";
import {
  isWeeklyDevBlogEnabled,
  shouldAutoPublishWeeklyDevBlog,
  weeklyDevBlogKey,
} from "@/modules/devblog/ai/automation";

describe("weekly devblog automation", () => {
  it("anchors a week to Sunday in the project timezone", () => {
    expect(weeklyDevBlogKey(new Date("2026-09-06T23:00:00.000Z"))).toBe("2026-09-06");
    expect(weeklyDevBlogKey(new Date("2026-09-07T01:00:00.000Z"))).toBe("2026-09-06");
  });

  it("defaults to enabled and draft-only", () => {
    expect(isWeeklyDevBlogEnabled({})).toBe(true);
    expect(shouldAutoPublishWeeklyDevBlog({})).toBe(false);
  });

  it("honors explicit enable and publish flags", () => {
    expect(isWeeklyDevBlogEnabled({ DEVBLOG_AI_ENABLED: "false" })).toBe(false);
    expect(shouldAutoPublishWeeklyDevBlog({ DEVBLOG_AI_AUTO_PUBLISH: "true" })).toBe(true);
  });
});
