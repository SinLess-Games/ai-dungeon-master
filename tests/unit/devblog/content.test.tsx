import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownPreview } from "@/modules/devblog/ui/MarkdownPreview";
import { postSchema, slugify, commentSchema } from "@/modules/devblog/domain/schemas";
describe("Devblog content boundaries", () => {
  it("generates bounded readable slugs", () => {
    expect(slugify("Building Persistent Worlds!")).toBe("building-persistent-worlds");
    expect(slugify("Café & dragons")).toBe("cafe-dragons");
    expect(slugify("a ".repeat(100))).not.toMatch(/-$/);
    expect(slugify("a ".repeat(100)).length).toBeLessThanOrEqual(100);
  });
  it("rejects invalid slugs and incomplete published posts", () => {
    const draft = {
      title: "My post",
      slug: "my-post",
      excerpt: "",
      markdown: "",
      status: "draft",
      coverImageId: null,
    };
    expect(postSchema.safeParse(draft).success).toBe(true);
    for (const slug of ["", "Upper", "-start", "end-", "two--dashes", "../admin", "admin"])
      expect(postSchema.safeParse({ ...draft, slug }).success).toBe(false);
    expect(postSchema.safeParse({ ...draft, status: "published" }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(commentSchema.safeParse({ body: "a".repeat(3001) }).success).toBe(false);
  });
  it("renders GFM without raw HTML, executable links, or remote tracking images", () => {
    const html = renderToStaticMarkup(
      <MarkdownPreview
        markdown={
          "# Hello\n\n<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)\n\n![tracking](https://example.com/track.png)\n\n| A | B |\n| - | - |\n| one | two |\n\n**Bold**"
        }
      />,
    );
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain('src="https://');
  });
});
