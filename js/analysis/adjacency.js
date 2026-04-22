// ══════════════════════════════════════════
//  MESH ADJACENCY — cached per-geometry vertex→(neighbor, edge-weight) list
//  + MinHeap + Dijkstra geodesic for measurement tool
// ══════════════════════════════════════════

let _adjCache = null, _adjGeo = null;

export function getMeshAdj(geo) {
  if (_adjGeo === geo) return _adjCache;
  const pos = geo.attributes.position;
  const idx = geo.index;
  const nV = pos.count;
  const getI = idx ? (f, v) => idx.getX(f * 3 + v) : (f, v) => f * 3 + v;
  const nF = idx ? idx.count / 3 : nV / 3;
  const adj = Array.from({ length: nV }, () => []);
  const seen = new Set();
  for (let f = 0; f < nF; f++) {
    const a = getI(f, 0), b = getI(f, 1), c = getI(f, 2);
    const ax = pos.getX(a), ay = pos.getY(a), az = pos.getZ(a);
    const bx = pos.getX(b), by = pos.getY(b), bz = pos.getZ(b);
    const cx2 = pos.getX(c), cy2 = pos.getY(c), cz2 = pos.getZ(c);
    for (const [u, v, ux, uy, uz, vx, vy, vz] of [
      [a, b, ax, ay, az, bx, by, bz],
      [b, c, bx, by, bz, cx2, cy2, cz2],
      [a, c, ax, ay, az, cx2, cy2, cz2],
    ]) {
      const key = u < v ? u * nV + v : v * nV + u;
      if (!seen.has(key)) {
        seen.add(key);
        const w = Math.hypot(ux - vx, uy - vy, uz - vz);
        adj[u].push([v, w]); adj[v].push([u, w]);
      }
    }
  }
  _adjCache = adj; _adjGeo = geo;
  return adj;
}

export function resetAdj() {
  _adjCache = null; _adjGeo = null;
}

export class MinHeap {
  constructor() { this.h = []; }
  push(item) { this.h.push(item); this._up(this.h.length - 1); }
  pop() {
    const top = this.h[0], last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this._dn(0); }
    return top;
  }
  get size() { return this.h.length; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p][0] <= this.h[i][0]) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  _dn(i) {
    const n = this.h.length;
    for (;;) {
      let m = i, l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.h[l][0] < this.h[m][0]) m = l;
      if (r < n && this.h[r][0] < this.h[m][0]) m = r;
      if (m === i) break;
      [this.h[m], this.h[i]] = [this.h[i], this.h[m]];
      i = m;
    }
  }
}

export function dijkstraGeodesic(geo, src, dst) {
  if (src === dst) return 0;
  const adj = getMeshAdj(geo);
  const nV = geo.attributes.position.count;
  const dist = new Float64Array(nV).fill(Infinity);
  dist[src] = 0;
  const pq = new MinHeap(); pq.push([0, src]);
  while (pq.size) {
    const [d, u] = pq.pop();
    if (u === dst) return d;
    if (d > dist[u]) continue;
    for (const [v, w] of adj[u]) {
      const nd = d + w;
      if (nd < dist[v]) { dist[v] = nd; pq.push([nd, v]); }
    }
  }
  return dist[dst];
}
