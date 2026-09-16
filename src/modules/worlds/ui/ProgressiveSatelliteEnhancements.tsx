import { useEffect, useRef } from "react";

interface DetailResponse {
  status: "pending" | "ready";
  detailKey: string;
  level: number;
  viewport: { x: number; y: number; width: number; height: number };
  renderUrl: string | null;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseViewBox(value: string | null): ViewBox | null {
  if (!value) return null;
  const values = value
    .trim()
    .split(/\s+/)
    .map(Number);
  if (values.length !== 4 || values.some((entry) => !Number.isFinite(entry))) return null;
  const [x, y, width, height] = values;
  return x === undefined || y === undefined || width === undefined || height === undefined
    ? null
    : { x, y, width, height };
}

function detailLevel(view: ViewBox, worldWidth: number): number {
  const ratio = view.width / Math.max(1, worldWidth);
  if (ratio <= 0.14) return 3;
  if (ratio <= 0.29) return 2;
  if (ratio <= 0.56) return 1;
  return 0;
}

async function requestDetail(campaignId: string, view: ViewBox, level: number): Promise<DetailResponse> {
  const params = new URLSearchParams({
    x: String(view.x),
    y: String(view.y),
    width: String(view.width),
    height: String(view.height),
    level: String(level),
  });
  const response = await fetch(
    `/api/campaigns/${encodeURIComponent(campaignId)}/atlas/detail?${params.toString()}`,
    { credentials: "same-origin", cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Satellite detail request failed (${response.status}).`);
  return (await response.json()) as DetailResponse;
}

function findMapSvg(root: HTMLElement): SVGSVGElement | null {
  return root.querySelector<SVGSVGElement>('svg[aria-label$="satellite world map"]');
}

function baseImage(svg: SVGSVGElement): SVGImageElement | null {
  return (
    [...svg.querySelectorAll<SVGImageElement>("image")].find(
      (image) => image.dataset["progressiveSatelliteDetail"] !== "true",
    ) ?? null
  );
}

function removeProgressiveImage(svg: SVGSVGElement): void {
  svg.querySelector<SVGImageElement>('image[data-progressive-satellite-detail="true"]')?.remove();
}

function applyProgressiveImage(svg: SVGSVGElement, detail: DetailResponse): void {
  if (!detail.renderUrl) return;
  const previous = svg.querySelector<SVGImageElement>('image[data-progressive-satellite-detail="true"]');
  if (previous?.dataset["detailKey"] === detail.detailKey) return;

  const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
  image.dataset["progressiveSatelliteDetail"] = "true";
  image.dataset["detailKey"] = detail.detailKey;
  image.setAttribute("href", detail.renderUrl);
  image.setAttribute("x", String(detail.viewport.x));
  image.setAttribute("y", String(detail.viewport.y));
  image.setAttribute("width", String(detail.viewport.width));
  image.setAttribute("height", String(detail.viewport.height));
  image.setAttribute("preserveAspectRatio", "none");
  image.setAttribute("pointer-events", "none");
  image.setAttribute("opacity", "0");
  image.style.transition = "opacity 240ms ease";

  const base = baseImage(svg);
  if (base?.nextSibling) base.parentNode?.insertBefore(image, base.nextSibling);
  else if (base?.parentNode) base.parentNode.appendChild(image);
  else {
    const defs = svg.querySelector("defs");
    if (defs?.nextSibling) svg.insertBefore(image, defs.nextSibling);
    else svg.appendChild(image);
  }
  requestAnimationFrame(() => image.setAttribute("opacity", "1"));
  window.setTimeout(() => previous?.remove(), 280);
}

/**
 * Observes the existing SVG viewBox without taking ownership of the map UI.
 * When the player settles at a closer zoom level, it requests a cached AI
 * satellite detail window and inserts it directly above the base satellite
 * image but below gameplay overlays. This keeps markers/fog/travel interactive.
 */
export function ProgressiveSatelliteEnhancements({
  campaignId,
  rootId,
}: {
  campaignId: string;
  rootId: string;
}) {
  const worldWidth = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let observer: MutationObserver | null = null;
    let debounce: number | null = null;
    let poll: number | null = null;
    let activeRequest = 0;

    const root = document.getElementById(rootId);
    if (!root) return undefined;

    const loadWorldWidth = async () => {
      try {
        const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/atlas`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { atlas?: { widthMiles?: number } };
        if (typeof payload.atlas?.widthMiles === "number") worldWidth.current = payload.atlas.widthMiles;
      } catch {
        // The primary map already owns visible error handling.
      }
    };

    const resolveDetail = async (svg: SVGSVGElement, view: ViewBox, level: number, requestId: number) => {
      try {
        const detail = await requestDetail(campaignId, view, level);
        if (disposed || requestId !== activeRequest) return;
        if (detail.status === "ready" && detail.renderUrl) {
          applyProgressiveImage(svg, detail);
          return;
        }
        poll = window.setTimeout(() => {
          void resolveDetail(svg, view, level, requestId);
        }, 2200);
      } catch {
        // A failed refinement must never make the base map unusable.
      }
    };

    const schedule = (svg: SVGSVGElement) => {
      if (debounce !== null) window.clearTimeout(debounce);
      if (poll !== null) window.clearTimeout(poll);
      debounce = window.setTimeout(() => {
        const view = parseViewBox(svg.getAttribute("viewBox"));
        const width = worldWidth.current;
        if (!view || !width) return;
        const level = detailLevel(view, width);
        if (level === 0) {
          activeRequest += 1;
          removeProgressiveImage(svg);
          return;
        }
        const requestId = ++activeRequest;
        void resolveDetail(svg, view, level, requestId);
      }, 420);
    };

    const attach = () => {
      const svg = findMapSvg(root);
      if (!svg) return false;
      observer = new MutationObserver((records) => {
        if (records.some((record) => record.type === "attributes" && record.attributeName === "viewBox")) {
          schedule(svg);
        }
      });
      observer.observe(svg, { attributes: true, attributeFilter: ["viewBox"] });
      schedule(svg);
      return true;
    };

    void loadWorldWidth().then(() => {
      if (disposed) return;
      if (attach()) return;
      const discover = new MutationObserver(() => {
        if (attach()) discover.disconnect();
      });
      discover.observe(root, { childList: true, subtree: true });
      window.setTimeout(() => discover.disconnect(), 15_000);
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      if (debounce !== null) window.clearTimeout(debounce);
      if (poll !== null) window.clearTimeout(poll);
    };
  }, [campaignId, rootId]);

  return null;
}
