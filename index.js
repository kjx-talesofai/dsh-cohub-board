import { defineTool } from '@deepseek-ai/dsh-tools';
import Schema from '@deepseek-ai/schemastery';

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

function newId(seq) { return 'dsh-' + (++seq) + '-' + Math.random().toString(36).slice(2, 8); }

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

function buildItem(args, seq) {
  const color = HEX_TO_TOKEN[args.color] || 'brand';
  const size = Number.isFinite(Number(args.size)) ? Math.max(1, Math.min(64, Number(args.size))) : 3;
  const pts = cleanPoints(args.points);
  const kind = args.kind;
  if (kind === 'line' && pts.length >= 2) {
    const a = pts[0], b = pts[1]; const pad = Math.max(8, size * 2);
    return { id: newId(seq), type: 'arrow', frame: bboxFrame([a, b], pad), start: { x: a.x, y: a.y }, end: { x: b.x, y: b.y }, bend: 0, color, size, arrowStart: false, arrowEnd: false, label: '' };
  }
  if (kind === 'rect' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(seq), type: 'geo', frame: bboxFrame([a, b], 0), geo: 'rectangle', text: '', color, fillOpacity: 0 }; }
  if (kind === 'ellipse' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(seq), type: 'geo', frame: bboxFrame([a, b], 0), geo: 'ellipse', text: '', color, fillOpacity: 0 }; }
  if (kind === 'circle' && pts.length >= 2) {
    const c = pts[0], e = pts[1]; const r = Math.sqrt((e.x - c.x) * (e.x - c.x) + (e.y - c.y) * (e.y - c.y));
    return { id: newId(seq), type: 'geo', frame: { x: c.x - r, y: c.y - r, width: Math.max(1, r * 2), height: Math.max(1, r * 2), rotation: 0 }, geo: 'ellipse', text: '', color, fillOpacity: 0 };
  }
  if (kind === 'frame' && pts.length >= 2) { const a = pts[0], b = pts[1]; return { id: newId(seq), type: 'frame', frame: bboxFrame([a, b], 0), label: '', color }; }
  if (kind === 'text') {
    const p = pts[0] || { x: 0, y: 0 };
    return { id: newId(seq), type: 'text', frame: { x: p.x, y: p.y, width: 120, height: 64, rotation: 0 }, text: (typeof args.text === 'string' && args.text) ? args.text : 'A', color, fontSize: Math.max(2, Math.min(512, size * 8)) };
  }
  const pad = Math.max(8, size * 2);
  const frame = bboxFrame(pts, pad);
  return { id: newId(seq), type: 'draw', frame, points: pts.map((p) => ({ x: p.x - frame.x, y: p.y - frame.y, p: 0.5 })), color, size };
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

export function apply(ctx, config) {
  const shell = ctx.get('shell');
  let items = [];
  let seq = 0;
  let boardVersion = 0;
  let pushChain = Promise.resolve();
  let clearing = false;

  async function cohubApply(tx) {
    if (!shell) throw new Error('no shell service');
    const json = JSON.stringify(tx);
    const command = "cohub -s " + config.spaceId + " boards apply " + config.boardId + " -i - --json << 'COHUBTX'\n" + json + "\nCOHUBTX";
    const result = await shell.run(shell.resolve({ command, timeoutMs: 30000 }));
    const text = (result.stdout && result.stdout.text) || '';
    if (result.exitCode !== 0) throw new Error('cohub apply exit ' + result.exitCode + ': ' + ((result.stderr && result.stderr.text) || text));
    return parseJsonOutput(text);
  }

  async function cohubInspect() {
    if (!shell) throw new Error('no shell service');
    const result = await shell.run(shell.resolve({ command: "cohub -s " + config.spaceId + " boards inspect " + config.boardId + " --json", timeoutMs: 30000 }));
    const text = (result.stdout && result.stdout.text) || '';
    if (result.exitCode !== 0) throw new Error('cohub inspect exit ' + result.exitCode);
    return parseJsonOutput(text);
  }

  function mergeNodes(nodes) {
    if (clearing) return;
    const byId = new Map();
    for (let i = 0; i < items.length; i++) byId.set(items[i].id, items[i]);
    for (let j = 0; j < nodes.length; j++) { const it = nodeToItem(nodes[j]); if (it) byId.set(it.id, it); }
    items = Array.from(byId.values());
  }

  async function refreshFromCohub() {
    try { const snap = await cohubInspect(); boardVersion = snap.board.version; mergeNodes(snap.nodes || []); }
    catch (err) { console.error('cohub refresh failed', err && err.message); }
  }

  async function pushItem(item) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const tx = { baseVersion: boardVersion, operations: [{ type: 'node.create', payload: { node: itemToNode(item) } }] };
        const parsed = await cohubApply(tx);
        boardVersion = parsed.board.version;
        return parsed;
      } catch (err) { if (attempt === 0) { await refreshFromCohub(); } else { throw err; } }
    }
  }

  function enqueuePush(item) {
    pushChain = pushChain.then(() => pushItem(item)).catch((err) => { console.error('push item failed', err && err.message); });
  }

  async function clearAll() {
    items = [];
    clearing = true;
    if (shell) {
      try {
        const snap = await cohubInspect();
        const ops = (snap.nodes || []).map((n) => ({ type: 'node.delete', payload: { nodeId: n.nodeId } }));
        if (ops.length > 0) { const parsed = await cohubApply({ baseVersion: snap.board.version, operations: ops }); boardVersion = parsed.board.version; }
        else { boardVersion = snap.board.version; }
      } catch (err) { console.error('cohub clear failed', err && err.message); }
    }
    clearing = false;
  }

  refreshFromCohub();
  ctx.interval(refreshFromCohub, 2000);

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
    execute: async (args) => {
      const item = buildItem(args, seq);
      items = items.concat([item]);
      if (shell) enqueuePush(item);
      return { ok: true, id: item.id, count: items.length };
    },
  }));

  ctx.tools.register(defineTool({
    name: 'board_read',
    description: 'Read every item currently on the shared board (Cohub-model items).',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { items: { type: 'array', required: true } } }, render: (_args, value) => [{ type: 'text', text: 'Board has ' + value.items.length + ' item(s): ' + JSON.stringify(value.items) }] },
    execute: async () => ({ items }),
  }));

  ctx.tools.register(defineTool({
    name: 'board_clear',
    description: 'Clear all items from the shared board (and the synced Cohub board).',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { ok: { type: 'boolean', required: true }, count: { type: 'number', required: true } } }, render: () => [{ type: 'text', text: 'Cleared the board.' }] },
    execute: async () => { await clearAll(); return { ok: true, count: 0 }; },
  }));

  ctx.tools.register(defineTool({
    name: 'board_export',
    description: 'Export the board to a local file. format json (full item list) or png (Cohub-rendered image).',
    parameters: {
      format: { type: 'string', enum: ['json', 'png'], required: true, description: 'Export format.' },
    },
    output: { schema: { type: 'object', additionalProperties: false, properties: { path: { type: 'string', required: true } } }, render: (_args, value) => [{ type: 'text', text: 'Exported to ' + value.path }] },
    execute: async (args) => {
      if (!shell) return { path: '(no shell service)' };
      let path;
      if (args.format === 'png') {
        path = '/tmp/cohub-board-export.png';
        const cmd = "cohub -s " + config.spaceId + " boards export " + config.boardId + " -o " + path + " --theme light --background paper";
        const result = await shell.run(shell.resolve({ command: cmd, timeoutMs: 60000 }));
        if (result.exitCode !== 0) throw new Error('export png failed: ' + ((result.stderr && result.stderr.text) || ''));
      } else {
        path = '/tmp/cohub-board-export.json';
        const json = JSON.stringify(items, null, 2);
        const cmd = "cat > " + path + " << 'BOARDEOF'\n" + json + "\nBOARDEOF";
        const result = await shell.run(shell.resolve({ command: cmd, timeoutMs: 30000 }));
        if (result.exitCode !== 0) throw new Error('export json failed');
      }
      return { path };
    },
  }));
}
