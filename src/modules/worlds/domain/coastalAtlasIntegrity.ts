import type {
  AtlasLandmass,
  AtlasPath,
  AtlasPlace,
  AtlasPoint,
  WorldAtlasDocument,
} from "./atlas";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathDistance(points: readonly AtlasPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }
  return total;
}

function pointInPolygon(point: AtlasPoint, polygon: readonly AtlasPoint[]): boolean {
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
    const current = polygon[index]!;
    const prior = polygon[previous]!;
    const intersects =
      current.y > point.y !== prior.y > point.y &&
      point.x <
        ((prior.x - current.x) * (point.y - current.y)) /
          (prior.y - current.y || Number.EPSILON) +
          current.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function nearestPointOnSegment(point: AtlasPoint, a: AtlasPoint, b: AtlasPoint): AtlasPoint {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= Number.EPSILON) return { ...a };
  const ratio = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1);
  return { x: a.x + dx * ratio, y: a.y + dy * ratio };
}

function nearestPointOnCoast(point: AtlasPoint, landmass: AtlasLandmass): AtlasPoint {
  let best = landmass.points[0] ?? landmass.center;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < landmass.points.length; index += 1) {
    const a = landmass.points[index]!;
    const b = landmass.points[(index + 1) % landmass.points.length]!;
    const candidate = nearestPointOnSegment(point, a, b);
    const candidateDistance = distance(point, candidate);
    if (candidateDistance < bestDistance) {
      best = candidate;
      bestDistance = candidateDistance;
    }
  }
  return { ...best };
}

function pointOnLand(point: AtlasPoint, landmasses: readonly AtlasLandmass[]): boolean {
  return landmasses.some((landmass) => pointInPolygon(point, landmass.points));
}

function sampledSegmentIsWater(
  a: AtlasPoint,
  b: AtlasPoint,
  landmasses: readonly AtlasLandmass[],
  samples = 12,
  trimStart = 0,
  trimEnd = 0,
): boolean {
  for (let index = 0; index <= samples; index += 1) {
    const raw = index / samples;
    const ratio = trimStart + raw * (1 - trimStart - trimEnd);
    const point = {
      x: a.x + (b.x - a.x) * ratio,
      y: a.y + (b.y - a.y) * ratio,
    };
    if (pointOnLand(point, landmasses)) return false;
  }
  return true;
}

function waterGate(
  coast: AtlasPoint,
  landmass: AtlasLandmass,
  atlas: WorldAtlasDocument,
): AtlasPoint | null {
  const outwardAngle = Math.atan2(coast.y - landmass.center.y, coast.x - landmass.center.x);
  const baseDistance = Math.max(24, Math.min(atlas.widthMiles, atlas.heightMiles) / 120);
  let best: { point: AtlasPoint; score: number } | null = null;

  for (let direction = 0; direction < 32; direction += 1) {
    const offset = ((direction % 2 === 0 ? direction / 2 : -(direction + 1) / 2) / 16) * Math.PI;
    const angle = outwardAngle + offset;
    for (const multiplier of [0.45, 0.7, 1, 1.4, 2, 2.8]) {
      const candidate = {
        x: clamp(coast.x + Math.cos(angle) * baseDistance * multiplier, 0, atlas.widthMiles),
        y: clamp(coast.y + Math.sin(angle) * baseDistance * multiplier, 0, atlas.heightMiles),
      };
      if (pointOnLand(candidate, atlas.landmasses)) continue;
      if (!sampledSegmentIsWater(coast, candidate, atlas.landmasses, 14, 0.08, 0)) continue;
      const alignment = Math.cos(offset);
      const score = alignment * 100 - multiplier * 4;
      if (!best || score > best.score) best = { point: candidate, score };
      break;
    }
  }

  return best?.point ?? null;
}

interface GridNode {
  column: number;
  row: number;
  point: AtlasPoint;
}

function gridKey(column: number, row: number): string {
  return `${column}:${row}`;
}

function waterGrid(atlas: WorldAtlasDocument) {
  const columns = 76;
  const rows = clamp(Math.round(columns * (atlas.heightMiles / atlas.widthMiles)), 34, 58);
  const cellWidth = atlas.widthMiles / (columns - 1);
  const cellHeight = atlas.heightMiles / (rows - 1);

  const node = (column: number, row: number): GridNode => ({
    column,
    row,
    point: { x: column * cellWidth, y: row * cellHeight },
  });

  const isWaterNode = (column: number, row: number): boolean => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) return false;
    return !pointOnLand(node(column, row).point, atlas.landmasses);
  };

  return { columns, rows, cellWidth, cellHeight, node, isWaterNode };
}

function nearestReachableWaterNode(
  point: AtlasPoint,
  atlas: WorldAtlasDocument,
  grid: ReturnType<typeof waterGrid>,
): GridNode | null {
  const centerColumn = clamp(Math.round(point.x / grid.cellWidth), 0, grid.columns - 1);
  const centerRow = clamp(Math.round(point.y / grid.cellHeight), 0, grid.rows - 1);
  let best: GridNode | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let radius = 0; radius <= 8; radius += 1) {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let column = centerColumn - radius; column <= centerColumn + radius; column += 1) {
        if (!grid.isWaterNode(column, row)) continue;
        const candidate = grid.node(column, row);
        if (!sampledSegmentIsWater(point, candidate.point, atlas.landmasses, 10)) continue;
        const candidateDistance = distance(point, candidate.point);
        if (candidateDistance < bestDistance) {
          best = candidate;
          bestDistance = candidateDistance;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

function reconstructPath(
  goalKey: string,
  cameFrom: Map<string, string>,
  nodes: Map<string, GridNode>,
): GridNode[] {
  const result: GridNode[] = [];
  let current: string | undefined = goalKey;
  while (current) {
    const node = nodes.get(current);
    if (node) result.push(node);
    current = cameFrom.get(current);
  }
  return result.reverse();
}

function findWaterPath(
  start: AtlasPoint,
  goal: AtlasPoint,
  atlas: WorldAtlasDocument,
): AtlasPoint[] | null {
  if (sampledSegmentIsWater(start, goal, atlas.landmasses, 48)) return [start, goal];

  const grid = waterGrid(atlas);
  const startNode = nearestReachableWaterNode(start, atlas, grid);
  const goalNode = nearestReachableWaterNode(goal, atlas, grid);
  if (!startNode || !goalNode) return null;

  const startKey = gridKey(startNode.column, startNode.row);
  const goalKey = gridKey(goalNode.column, goalNode.row);
  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[startKey, 0]]);
  const fScore = new Map<string, number>([[startKey, distance(startNode.point, goalNode.point)]]);
  const nodes = new Map<string, GridNode>([
    [startKey, startNode],
    [goalKey, goalNode],
  ]);
  const directions = [-1, 0, 1].flatMap((row) =>
    [-1, 0, 1]
      .filter((column) => column !== 0 || row !== 0)
      .map((column) => ({ column, row })),
  );

  while (open.size > 0) {
    let currentKey: string | null = null;
    let currentScore = Number.POSITIVE_INFINITY;
    for (const key of open) {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < currentScore) {
        currentKey = key;
        currentScore = score;
      }
    }
    if (!currentKey) break;
    if (currentKey === goalKey) {
      const raw = reconstructPath(goalKey, cameFrom, nodes).map((value) => value.point);
      const points = [start, ...raw, goal];
      const simplified: AtlasPoint[] = [points[0]!];
      let anchor = 0;
      while (anchor < points.length - 1) {
        let next = points.length - 1;
        while (
          next > anchor + 1 &&
          !sampledSegmentIsWater(points[anchor]!, points[next]!, atlas.landmasses, 24)
        ) {
          next -= 1;
        }
        simplified.push(points[next]!);
        anchor = next;
      }
      return simplified;
    }

    open.delete(currentKey);
    const current = nodes.get(currentKey)!;
    for (const direction of directions) {
      const column = current.column + direction.column;
      const row = current.row + direction.row;
      if (!grid.isWaterNode(column, row)) continue;
      const neighbor = grid.node(column, row);
      if (!sampledSegmentIsWater(current.point, neighbor.point, atlas.landmasses, 6)) continue;
      const key = gridKey(column, row);
      nodes.set(key, neighbor);
      const tentative =
        (gScore.get(currentKey) ?? Number.POSITIVE_INFINITY) + distance(current.point, neighbor.point);
      if (tentative >= (gScore.get(key) ?? Number.POSITIVE_INFINITY)) continue;
      cameFrom.set(key, currentKey);
      gScore.set(key, tentative);
      fScore.set(key, tentative + distance(neighbor.point, goalNode.point));
      open.add(key);
    }
  }

  return null;
}

function snapPorts(atlas: WorldAtlasDocument): AtlasPlace[] {
  const landmasses = new Map(atlas.landmasses.map((landmass) => [landmass.id, landmass]));
  return atlas.places.map((place) => {
    if (place.kind !== "port") return place;
    const landmass = landmasses.get(place.landmassId);
    if (!landmass) return place;
    const coast = nearestPointOnCoast(place, landmass);
    return { ...place, x: coast.x, y: coast.y };
  });
}

function updatePathEndpoints(path: AtlasPath, places: ReadonlyMap<string, AtlasPlace>): AtlasPath | null {
  const from = places.get(path.fromPlaceId);
  const to = places.get(path.toPlaceId);
  if (!from || !to) return null;
  const points = path.points.length >= 2 ? [...path.points] : [{ x: from.x, y: from.y }, { x: to.x, y: to.y }];
  points[0] = { x: from.x, y: from.y };
  points[points.length - 1] = { x: to.x, y: to.y };
  return { ...path, points, distanceMiles: Math.max(1, Math.round(pathDistance(points))) };
}

function waterSeaRoute(
  path: AtlasPath,
  places: ReadonlyMap<string, AtlasPlace>,
  atlas: WorldAtlasDocument,
): AtlasPath | null {
  const from = places.get(path.fromPlaceId);
  const to = places.get(path.toPlaceId);
  if (!from || !to || from.kind !== "port" || to.kind !== "port") return null;
  const fromLandmass = atlas.landmasses.find((value) => value.id === from.landmassId);
  const toLandmass = atlas.landmasses.find((value) => value.id === to.landmassId);
  if (!fromLandmass || !toLandmass || fromLandmass.id === toLandmass.id) return null;

  const fromGate = waterGate(from, fromLandmass, atlas);
  const toGate = waterGate(to, toLandmass, atlas);
  if (!fromGate || !toGate) return null;
  const water = findWaterPath(fromGate, toGate, atlas);
  if (!water) return null;

  const points = [{ x: from.x, y: from.y }, ...water, { x: to.x, y: to.y }];
  return {
    ...path,
    points,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
  };
}

export function coastDistanceMiles(place: AtlasPlace, atlas: WorldAtlasDocument): number {
  const landmass = atlas.landmasses.find((value) => value.id === place.landmassId);
  if (!landmass) return Number.POSITIVE_INFINITY;
  return distance(place, nearestPointOnCoast(place, landmass));
}

export function seaRouteStaysInWater(path: AtlasPath, atlas: WorldAtlasDocument): boolean {
  if (path.kind !== "sea-route" || path.points.length < 2) return path.kind !== "sea-route";
  for (let index = 1; index < path.points.length; index += 1) {
    const first = path.points[index - 1]!;
    const second = path.points[index]!;
    const firstSegment = index === 1;
    const lastSegment = index === path.points.length - 1;
    if (
      !sampledSegmentIsWater(
        first,
        second,
        atlas.landmasses,
        18,
        firstSegment ? 0.08 : 0,
        lastSegment ? 0.08 : 0,
      )
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Hard geographic invariants applied after all creative/realism generation.
 * Ports are projected onto their landmass coastline and sea routes are rebuilt
 * with ocean-only pathfinding. If a valid water corridor cannot be found, the
 * route is omitted rather than drawing an impossible overland sea lane.
 */
export function enforceCoastalAtlasIntegrity(atlas: WorldAtlasDocument): WorldAtlasDocument {
  const places = snapPorts(atlas);
  const placeMap = new Map(places.map((place) => [place.id, place]));
  const nonSeaPaths = atlas.paths
    .filter((path) => path.kind !== "sea-route")
    .map((path) => updatePathEndpoints(path, placeMap))
    .filter((path): path is AtlasPath => Boolean(path));
  const seaPaths = atlas.paths
    .filter((path) => path.kind === "sea-route")
    .map((path) => waterSeaRoute(path, placeMap, { ...atlas, places }))
    .filter((path): path is AtlasPath => Boolean(path));
  const paths = [...nonSeaPaths, ...seaPaths];
  const usedKinds = new Set<string>([
    ...places.map((place) => place.kind),
    ...paths.map((path) => path.kind),
  ]);

  return {
    ...atlas,
    places,
    paths,
    legend: atlas.legend.filter((entry) => usedKinds.has(entry.kind)),
    metadata: {
      ...atlas.metadata,
      coastalIntegrity: {
        portsSnappedToCoast: true,
        seaRoutesWaterOnly: true,
        droppedInvalidSeaRoutes: atlas.paths.filter((path) => path.kind === "sea-route").length - seaPaths.length,
      },
    },
  } as WorldAtlasDocument;
}
