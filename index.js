import { defineTool } from '@deepseek-ai/dsh-tools';
import Schema from '@deepseek-ai/schemastery';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';

export const name = 'cohub-board';
export const inject = ['tools', 'timer'];

export const Config = Schema.object({
  spaceId: Schema.string().default('98d87d78-047f-4298-9b7e-ea12ef39f0ae'),
  boardId: Schema.string().default('86431ec4-08b7-4d91-8f44-42aa636d8a88'),
});

const HEX_TO_TOKEN = {
  '#e8450e': 'brand', '#e11d48': 'rose', '#d97706': 'amber', '#16a34a': 'green',
  '#2563eb': 'blue', '#7c3aed': 'violet', '#000000': 'black', '#5f6368': 'neutral',
  '#3b82f6': 'blue', '#ef4444': 'rose', '#22c55e': 'green', '#f59e0b': 'amber', '#111827': 'black',
};

function newId(counter) { return 'dsh-' + (++counter.n) + '-' + Math.random().toString(36).slice(2, 8); }

function cleanPoints(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (let i = 0; i < raw.length && out.length < 10000; i++) {
    const p = raw[i];
    const x = (p && typeof p === 'object') ? Number(p.x) : NaN;
    const y = (p && typeof p === 'object') ? Number(p.y) : NaN;
    out.push({ x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 });
  }
  return out;
}

function bboxFrame(pts, pad) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    minX = Math.min(minX, pts[i].x); minY = Math.min(minY, pts[i].y);
    maxX = Math.max(maxX, pts[i].x); maxY = Math.max(maxY, pts[i].y);
  }
  if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = 1; maxY = 1; }
  const p = pad || 0;
  return { x: minX - p, y: minY - p, width: Math.max(1, maxX - minX + p * 2), height: Math.max(1, maxY - minY + p * 2), rotation: 0 };
}

function buildItem(args, counter) {
  const color = HEX_TO_TOKEN[args.color] || 'brand';
  const size = Number.isFinite(Number(args.size)) ? Math.max(1, Math.min(64, Number(args.size))) : 3;
  const pts = cleanPoints(args.points);
  const kind = args.kind;
  if (kind === 'line' && pts.length >= 2) {
    const a = pts[0], b = pts[1]; const pad = Math.max(8, size * 2);
    return { id: newId(counter), type: 'arrow', frame: bboxFrame([a, b], pad), start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, bend: 0, color, size, arrowStart: false, arrowEnd: false, label: '' };
  }
  if (kind === 'rect' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(counter), type: 'geo', frame: bboxFrame([a, b], 0), geo: 'rectangle', text: '', color, fillOpacity: 0 }; }
  if (kind === 'ellipse' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(counter), type: 'geo', frame: bboxFrame([a, b], 0), geo: 'ellipse', text: '', color, fillOpacity: 0 }; }
  if (kind === 'circle' && pts.length >= 2) {
    const c = pts[0], e = pts[1]; const r = Math.sqrt((e.x - c.x) * (e.x - c.x) + (e.y - c.y) * (e.y - c.y));
    return { id: newId(counter), type: 'geo', frame: { x: c.x - r, y: c.y - r, width: Math.max(1, r * 2), height: Math.max(1, r * 2), rotation: 0 }, geo: 'ellipse', text: '', color, fillOpacity: 0 };
  }
  if (kind === 'frame' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(counter), type: 'frame', frame: bboxFrame([a, b], 0), label: '', color }; }
  if (kind === 'text') {
    const p = pts[0] || { x: 0, y: 0 };
    return { id: newId(counter), type: 'text', frame: { x: p.x, y: p.y, width: 120, height: 64, rotation: 0 }, text: (typeof args.text === 'string' && args.text) ? args.text : 'A', color, fontSize: Math.max(2, Math.min(512, size * 8)) };
  }
  const pad = Math.max(8, size * 2);
  const frame = bboxFrame(pts, pad);
  return { id: newId(counter), type: 'draw', frame, points: pts.map((p) => ({ x: p.x - frame.x, y: p.y - frame.y, p: 0.5 })), color, size };
}

function itemToData(item) {
  switch (item.type) {
    case 'text': return { text: item.text, color: item.color, fontSize: item.fontSize };
    case 'geo': return { geo: item.geo, text: item.text || '', color: item.color, fillOpacity: item.fillOpacity || 0 };
    case 'draw': return { points: item.points, color: item.color, size: item.size };
    case 'arrow': return { start: item.start, end: item.end, bend: item.bend || 0, color: item.color, size: item.size, arrowStart: !!item.arrowStart, arrowEnd: item.arrowEnd !== undefined ? !!item.arrowEnd : true, label: item.label || '' };
    case 'frame': return { label: item.label || '', color: item.color };
    default: return {};
  }
}

function itemToNode(item) {
  return { nodeId: item.id, type: item.type, parentId: null, orderKey: null, x: item.frame.x, y: item.frame.y, width: item.frame.width, height: item.frame.height, rotation: item.frame.rotation, refKind: null, refPath: null, refUrl: null, view: {}, style: {}, data: itemToData(item) };
}

function nodeToItem(node) {
  const data = (node && node.data) ? node.data : {};
  const frame = { x: node.x || 0, y: node.y || 0, width: node.width || 1, height: node.height || 1, rotation: node.rotation || 0 };
  switch (node.type) {
    case 'text': return { id: node.nodeId, type: 'text', frame, text: (typeof data.text === 'string') ? data.text : '', color: data.color || 'neutral', fontSize: (typeof data.fontSize === 'number') ? data.fontSize : 24 };
    case 'geo': return { id: node.nodeId, type: 'geo', frame, geo: (typeof data.geo === 'string') ? data.geo : 'rectangle', text: (typeof data.text === 'string') ? data.text : '', color: data.color || 'brand', fillOpacity: (typeof data.fillOpacity === 'number') ? data.fillOpacity : 0 };
    case 'draw': return { id: node.nodeId, type: 'draw', frame, points: (Array.isArray(data.points) ? data.points : []).map((p) => ({ x: p.x || 0, y: p.y || 0, p: (typeof p.p === 'number') ? p.p : 0.5 })), color: data.color || 'brand', size: (typeof data.size === 'number') ? data.size : 4 };
    case 'arrow': return { id: node.nodeId, type: 'arrow', frame, start: data.start || { x: 0, y: 0 }, end: data.end || { x: 0, y: 0 }, bend: (typeof data.bend === 'number') ? data.bend : 0, color: data.color || 'brand', size: (typeof data.size === 'number') ? data.size : 2.5, arrowStart: !!data.arrowStart, arrowEnd: data.arrowEnd !== undefined ? !!data.arrowEnd : true, label: (typeof data.label === 'string') ? data.label : '' };
    case 'frame': return { id: node.nodeId, type: 'frame', frame, label: (typeof data.label === 'string') ? data.label : '', color: data.color || 'neutral' };
    default: return null;
  }
}

function parseJsonOutput(text) {
  const idx = text.indexOf('{');
  if (idx < 0) throw new Error('no JSON in output');
  return JSON.parse(text.slice(idx));
}

// ---- Remote method decoration (plain-JS equivalent of @Remote) ----
const _remoteInits = [];
function remoteMethod(name) {
  const ctx = {
    kind: 'method',
    name,
    private: false,
    static: false,
    addInitializer(fn) { _remoteInits.push(fn); },
  };
  Remote(name)(undefined, ctx);
}

class BoardService extends TypertRemoteService {
  constructor(ctx, config) {
    super(ctx, 'board');
    this.config = config;
    this.shell = ctx.get('shell');
    this.items = [];
    this.counter = { n: 0 };
    this.boardVersion = 0;
    this.pushChain = Promise.resolve();
    this.clearing = false;
    _remoteInits.forEach((fn) => fn.call(this));
    this.refresh();
    ctx.interval(() => this.refresh(), 2000);
  }

  async cohubApply(tx) {
    if (!this.shell) throw new Error('no shell service');
    const json = JSON.stringify(tx);
    const command = "cohub -s " + this.config.spaceId + " boards apply " + this.config.boardId + " -i - --json << 'COHUBTX'\n" + json + "\nCOHUBTX";
    const result = await this.shell.run(this.shell.resolve({ command, timeoutMs: 30000 }));
    const text = (result.stdout && result.stdout.text) || '';
    if (result.exitCode !== 0) throw new Error('cohub apply exit ' + result.exitCode + ': ' + ((result.stderr && result.stderr.text) || text));
    return parseJsonOutput(text);
  }

  async cohubInspect() {
    if (!this.shell) throw new Error('no shell service');
    const result = await this.shell.run(this.shell.resolve({ command: "cohub -s " + this.config.spaceId + " boards inspect " + this.config.boardId + " --json", timeoutMs: 30000 }));
    const text = (result.stdout && result.stdout.text) || '';
    if (result.exitCode !== 0) throw new Error('cohub inspect exit ' + result.exitCode);
    return parseJsonOutput(text);
  }

  mergeNodes(nodes) {
    if (this.clearing) return;
    const byId = new Map();
    for (let i = 0; i < this.items.length; i++) byId.set(this.items[i].id, this.items[i]);
    for (let j = 0; j < nodes.length; j++) { const it = nodeToItem(nodes[j]); if (it) byId.set(it.id, it); }
    this.items = Array.from(byId.values());
  }

  async refresh() {
    try { const snap = await this.cohubInspect(); this.boardVersion = snap.board.version; this.mergeNodes(snap.nodes || []); }
    catch (err) { console.error('cohub refresh failed', err && err.message); }
  }

  async pushItem(item) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const tx = { baseVersion: this.boardVersion, operations: [{ type: 'node.create', payload: { node: itemToNode(item) } }] };
        const parsed = await this.cohubApply(tx);
        this.boardVersion = parsed.board.version;
        return parsed;
      } catch (err) { if (attempt === 0) { await this.refresh(); } else { throw err; } }
    }
  }

  enqueuePush(item) {
    this.pushChain = this.pushChain.then(() => this.pushItem(item)).catch((err) => { console.error('push item failed', err && err.message); });
  }

  async clearAll() {
    this.items = [];
    this.clearing = true;
    if (this.shell) {
      try {
        const snap = await this.cohubInspect();
        const ops = (snap.nodes || []).map((n) => ({ type: 'node.delete', payload: { nodeId: n.nodeId } }));
        if (ops.length > 0) { const parsed = await this.cohubApply({ baseVersion: snap.board.version, operations: ops }); this.boardVersion = parsed.board.version; }
        else { this.boardVersion = snap.board.version; }
      } catch (err) { console.error('cohub clear failed', err && err.message); }
    }
    this.clearing = false;
  }

  // ---- Remote API (called by the client via ctx.remote.board.*) ----
  async getItems() { return { items: this.items, spaceId: this.config.spaceId, boardId: this.config.boardId }; }
  async addItem(args) {
    const item = buildItem(args || {}, this.counter);
    this.items = this.items.concat([item]);
    if (this.shell) this.enqueuePush(item);
    return { ok: true, id: item.id, count: this.items.length };
  }
  async clear() { await this.clearAll(); return { ok: true, count: 0 }; }
  async exportBoard(format) {
    if (!this.shell) return { path: '(no shell service)' };
    let path;
    if (format === 'png') {
      path = '/tmp/cohub-board-export.png';
      const cmd = "cohub -s " + this.config.spaceId + " boards export " + this.config.boardId + " -o " + path + " --theme light --background paper";
      const result = await this.shell.run(this.shell.resolve({ command: cmd, timeoutMs: 60000 }));
      if (result.exitCode !== 0) throw new Error('export png failed: ' + ((result.stderr && result.stderr.text) || ''));
    } else {
      path = '/tmp/cohub-board-export.json';
      const json = JSON.stringify(this.items, null, 2);
      const cmd = "cat > " + path + " << 'BOARDEOF'\n" + json + "\nBOARDEOF";
      const result = await this.shell.run(this.shell.resolve({ command: cmd, timeoutMs: 30000 }));
      if (result.exitCode !== 0) throw new Error('export json failed');
    }
    return { path };
  }
}
remoteMethod('getItems');
remoteMethod('addItem');
remoteMethod('clear');
remoteMethod('exportBoard');

export function apply(ctx, config) {
  const board = new BoardService(ctx, config);

  ctx.tools.register(defineTool({
    name: 'board_draw',
    description: 'Draw a native shape on the shared Cohub board (synced both ways). kind: line, freehand, rect, ellipse, circle, text, frame. color is hex; maps to a Cohub semantic token.',
    parameters: {
      kind: { type: 'string', enum: ['line', 'freehand', 'rect', 'ellipse', 'circle', 'text', 'frame'], description: 'Shape kind. Defaults to freehand.' },
      color: { type: 'string', description: 'Hex color like #e11d48. Default #2563eb.' },
      size: { type: 'number', description: 'Stroke width 1-64 (or font size/8 for text). Default 4.' },
      text: { type: 'string', description: 'Text content (only when kind is text).' },
      points: { type: 'array', required: true, description: 'Points as {x, y} in world coordinates.', items: { type: 'object', additionalProperties: false, properties: { x: { type: 'number', required: true }, y: { type: 'number', required: true } } } },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, id: { type: 'string', required: true }, count: { type: 'number', required: true } } },
      render: (_args, value) => [{ type: 'text', text: 'Drew ' + value.id + ' (' + value.count + ' items total).' }],
    },
    execute: async (args) => board.addItem(args),
  }));

  ctx.tools.register(defineTool({
    name: 'board_read',
    description: 'Read every item currently on the shared board (Cohub-model items).',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { items: { type: 'array', required: true } } }, render: (_args, value) => [{ type: 'text', text: 'Board has ' + value.items.length + ' item(s): ' + JSON.stringify(value.items) }] },
    execute: async () => board.getItems(),
  }));

  ctx.tools.register(defineTool({
    name: 'board_clear',
    description: 'Clear all items from the shared board (and the synced Cohub board).',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, count: { type: 'number', required: true } } }, render: () => [{ type: 'text', text: 'Cleared the board.' }] },
    execute: async () => board.clear(),
  }));

  ctx.tools.register(defineTool({
    name: 'board_export',
    description: 'Export the board to a local file. format json (full item list) or png (Cohub-rendered image).',
    parameters: {
      format: { type: 'string', enum: ['json', 'png'], required: true, description: 'Export format.' },
    },
    output: { schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true } } }, render: (_args, value) => [{ type: 'text', text: 'Exported to ' + value.path }] },
    execute: async (args) => board.exportBoard(args.format),
  }));
}
