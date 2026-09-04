import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOG_CATEGORIES, BLOG_STATUSES, slugify, type BlogPost, type BlogStatus } from "@/lib/dev-blog";
import { savePost } from "@/lib/dev-blog.functions";
import { uploadBlogImage } from "@/lib/blog-media";

const TOOLS: { label: string; wrap: [string, string]; block?: boolean }[] = [
  { label: "H2", wrap: ["## ", ""], block: true },
  { label: "H3", wrap: ["### ", ""], block: true },
  { label: "B", wrap: ["**", "**"] },
  { label: "I", wrap: ["*", "*"] },
  { label: "U", wrap: ["<u>", "</u>"] },
  { label: "S", wrap: ["~~", "~~"] },
  { label: "Link", wrap: ["[", "](https://)"] },
  { label: "• List", wrap: ["- ", ""], block: true },
  { label: "1. List", wrap: ["1. ", ""], block: true },
  { label: "Quote", wrap: ["> ", ""], block: true },
  { label: "Callout", wrap: ["> [!NOTE]\n> ", ""], block: true },
  { label: "Rule", wrap: ["\n---\n", ""], block: true },
  { label: "Code", wrap: ["`", "`"] },
  { label: "Block", wrap: ["\n```\n", "\n```\n"], block: true },
  { label: "Table", wrap: ["\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n", ""], block: true },
];

export function PostEditor({ post }: { post?: BlogPost }) {
  const navigate = useNavigate();
  const save = useServerFn(savePost);
  const area = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [authorName, setAuthorName] = useState(post?.authorName ?? "");
  const [category, setCategory] = useState(post?.category ?? "Development");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(post?.ogImageUrl ?? "");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "draft");
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? toLocalInput(post.scheduledAt) : "",
  );
  const [featuredAsUpdate, setFeaturedAsUpdate] = useState(post?.featuredAsUpdate ?? false);
  const [view, setView] = useState<"write" | "split" | "preview">("split");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  function insert(before: string, after: string) {
    const el = area.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + before.length + selected.length;
    });
  }

  async function pickImage(target: "cover" | "og" | "body") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const id = toast.loading("Uploading image…");
      try {
        const url = await uploadBlogImage(file);
        if (target === "cover") setCoverImageUrl(url);
        else if (target === "og") setOgImageUrl(url);
        else insert(`![Describe this image](${url} "Caption")`, "");
        toast.success("Image uploaded", { id });
      } catch (e: any) {
        toast.error(e?.message ?? "Upload failed", { id });
      }
    };
    input.click();
  }

  async function submit(nextStatus?: BlogStatus) {
    const finalStatus = nextStatus ?? status;
    if (!title.trim()) {
      toast.error("Give the entry a title first");
      return;
    }
    if (finalStatus === "scheduled" && !scheduledAt) {
      toast.error("Pick a publication date and time");
      return;
    }
    setBusy(true);
    try {
      const result = await save({
        data: {
          ...(post ? { id: post.id } : {}),
          title,
          slug,
          subtitle,
          excerpt,
          content,
          coverImageUrl,
          coverImageAlt,
          authorName,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          seoTitle,
          seoDescription,
          ogImageUrl,
          featuredAsUpdate,
          status: finalStatus,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        },
      });
      setStatus(finalStatus);
      toast.success(post ? "Entry updated" : "Entry created");
      if (!post) navigate({ to: "/admin/dev-blog/$id/edit", params: { id: result.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save the entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => submit()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save
        </Button>
        {status !== "published" ? (
          <Button variant="outline" onClick={() => submit("published")} disabled={busy}>
            Publish
          </Button>
        ) : (
          <Button variant="outline" onClick={() => submit("draft")} disabled={busy}>
            Unpublish
          </Button>
        )}
        {post ? (
          <Button asChild variant="outline">
            <Link to="/admin/dev-blog/$id/preview" params={{ id: post.id }}>
              <Eye className="mr-2 size-4" /> Preview
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link to="/admin/dev-blog">Back to list</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <Field label="Title">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title" />
              </Field>
              <Field label="Slug" hint="Used in the public link. Must be unique.">
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="Subtitle">
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </Field>
              <Field label="Excerpt" hint="Shown in listings and social previews.">
                <Textarea rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-primary">Article content (Markdown)</Label>
                <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                  <TabsList>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="split">Split</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TOOLS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => insert(t.wrap[0], t.wrap[1])}
                    className="rounded border border-primary/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pickImage("body")}
                  className="flex items-center gap-1 rounded border border-primary/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                >
                  <ImagePlus className="size-3.5" /> Image
                </button>
              </div>

              <div className={view === "split" ? "grid gap-4 lg:grid-cols-2" : ""}>
                {view !== "preview" ? (
                  <Textarea
                    ref={area}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={26}
                    className="font-mono text-sm"
                    placeholder="Write the entry in Markdown…"
                  />
                ) : null}
                {view !== "write" ? (
                  <div className="max-h-[42rem] overflow-y-auto rounded-lg border border-primary/20 bg-background/60 p-5">
                    <ArticleBody text={content || "_Nothing written yet._"} />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <Field label="Status">
                <Select value={status} onValueChange={(v) => setStatus(v as BlogStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOG_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {status === "scheduled" ? (
                <Field label="Publish at">
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </Field>
              ) : null}
              <Field label="Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags" hint="Comma separated.">
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, combat, ui" />
              </Field>
              <Field label="Author">
                <Input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Defaults to your name"
                />
              </Field>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 p-3">
                <div>
                  <p className="text-sm text-foreground">Show in What's New</p>
                  <p className="text-xs text-muted-foreground">Highlights this entry inside the app.</p>
                </div>
                <Switch checked={featuredAsUpdate} onCheckedChange={setFeaturedAsUpdate} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <Label className="text-primary">Cover image</Label>
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="" className="w-full rounded-lg border border-primary/25" />
              ) : null}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => pickImage("cover")}>
                  <ImagePlus className="mr-2 size-4" /> Upload
                </Button>
                {coverImageUrl ? (
                  <Button variant="ghost" size="sm" onClick={() => setCoverImageUrl("")}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <Field label="Cover image alt text">
                <Input value={coverImageAlt} onChange={(e) => setCoverImageAlt(e.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-primary/25 bg-card/70">
            <CardContent className="space-y-4 p-5">
              <Label className="text-primary">Search &amp; sharing</Label>
              <Field label="SEO title">
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </Field>
              <Field label="SEO description">
                <Textarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
              </Field>
              <Field label="Social share image">
                <div className="flex gap-2">
                  <Input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="Defaults to cover" />
                  <Button variant="outline" size="sm" onClick={() => pickImage("og")}>
                    <ImagePlus className="size-4" />
                  </Button>
                </div>
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
