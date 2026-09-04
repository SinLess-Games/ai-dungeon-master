import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mapArtUrl, saveMapArt } from "@/lib/map-art";
import { streamImage } from "@/lib/stream-image";
import { saveWorld } from "@/lib/storage";
import { siteMapPrompt, worldMapPrompt } from "@/prompts/cartography/image-prompts";
import type { World, WorldSite } from "@/lib/world";

/** Resolves a stored map picture into a viewable link. */
export function useMapArt(path: string | undefined) {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(undefined);
      return;
    }
    mapArtUrl(path).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}

interface Props {
  world: World;
  /** Omit for the world atlas; pass a site for a local map. */
  site?: WorldSite;
  onPainted?: () => void;
}

/** Paints the map with AI and stores the picture against the world or site. */
export function PaintMapButton({ world, site, onPainted }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const already = site ? !!site.artPath : !!world.artPath;

  async function paint() {
    setBusy(true);
    setPreview(null);
    setDone(false);
    let last: string | null = null;
    try {
      const prompt = site ? siteMapPrompt(site, world) : worldMapPrompt(world);
      await streamImage("/api/generate-map", prompt, (dataUrl, isFinal) => {
        last = dataUrl;
        setPreview(dataUrl);
        if (isFinal) setDone(true);
      });
      if (!last) throw new Error("No picture came back");
      const path = await saveMapArt(site ? "site" : "world", site ? site.id : world.id, last);
      const next: World = site
        ? {
            ...world,
            sites: world.sites.map((s) => (s.id === site.id ? { ...s, artPath: path } : s)),
          }
        : { ...world, artPath: path };
      saveWorld(next);
      toast.success(site ? `${site.name} has been painted.` : "Your world has been painted.");
      onPainted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The map could not be painted.");
    } finally {
      setBusy(false);
      setPreview(null);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={paint} disabled={busy}>
        {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Wand2 className="mr-2 size-4" />}
        {busy ? "Painting…" : already ? "Repaint with AI" : "Paint with AI"}
      </Button>
      {busy && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6">
          <div className="max-w-3xl space-y-3 text-center">
            {preview ? (
              <img
                src={preview}
                alt="The map being painted"
                className={`mx-auto max-h-[70vh] rounded-lg border border-border transition-[filter] duration-500 ${
                  done ? "blur-0" : "blur-xl"
                }`}
              />
            ) : (
              <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">
              The cartographer is painting {site ? site.name : "your world"}…
            </p>
          </div>
        </div>
      )}
    </>
  );
}
