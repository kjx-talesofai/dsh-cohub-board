window.__ModuleLoader__.load({
	id: "dsh-cohub-board",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		//#region src/client/index.js
		const CSS = ".cohub-board-panel{position:fixed;right:16px;bottom:16px;z-index:99999;background:#fff;border:1px solid #d1d5db;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.18);pointer-events:auto;font-family:system-ui,sans-serif;overflow:hidden}.cohub-board-head{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #e5e7eb;background:#f9fafb}.cohub-board-title{font-size:13px;font-weight:600;color:#111827;cursor:move;user-select:none;touch-action:none}.cohub-board-headright{display:flex;align-items:center;gap:8px}.cohub-board-count{font-size:11px;color:#6b7280}.cohub-board-clear{font-size:11px;padding:3px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;color:#374151}.cohub-toolbar{display:flex;align-items:center;gap:5px;padding:6px 10px;border-bottom:1px solid #e5e7eb;background:#fafafa;flex-wrap:wrap}.cohub-tool{font-size:11px;padding:3px 8px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;color:#374151}.cohub-tool.on{background:#2563eb;border-color:#2563eb;color:#fff}.cohub-board-swatch{width:18px;height:18px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}.cohub-board-swatch.on{border-color:#111827}.cohub-size{width:72px}.cohub-text{font-size:11px;padding:3px 6px;border:1px solid #d1d5db;border-radius:6px;width:88px}.cohub-canvas{display:block;background:#fff;touch-action:none}.cohub-board-hint{font-size:10px;color:#9ca3af;padding:2px 12px 6px}";
		(function injectCss() {
			if (typeof document === "undefined") return;
			const tagId = "dsh-cohub-board/canvas.css";
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]")) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-cohub-board";
			tag.dataset.pluginCss = tagId;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		})();
		const TOKEN_TO_HEX = {
			brand: "#e8450e",
			rose: "#e11d48",
			amber: "#d97706",
			green: "#16a34a",
			blue: "#2563eb",
			violet: "#7c3aed",
			black: "#000000",
			neutral: "#5f6368",
			white: "#ffffff"
		};
		const HEX_TO_TOKEN = {
			"#e8450e": "brand",
			"#e11d48": "rose",
			"#d97706": "amber",
			"#16a34a": "green",
			"#2563eb": "blue",
			"#7c3aed": "violet",
			"#000000": "black"
		};
		const TOOLS = [
			{
				id: "hand",
				label: "Pan"
			},
			{
				id: "draw",
				label: "Pen"
			},
			{
				id: "arrow",
				label: "Line"
			},
			{
				id: "rect",
				label: "Rect"
			},
			{
				id: "ellipse",
				label: "Oval"
			},
			{
				id: "text",
				label: "Text"
			},
			{
				id: "frame",
				label: "Frame"
			}
		];
		const COLORS = [
			{ hex: "#e8450e" },
			{ hex: "#e11d48" },
			{ hex: "#d97706" },
			{ hex: "#16a34a" },
			{ hex: "#2563eb" },
			{ hex: "#7c3aed" },
			{ hex: "#000000" }
		];
		function localId() {
			return "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
		}
		function bboxFrame(pts, pad) {
			let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
			for (let i = 0; i < pts.length; i++) {
				minX = Math.min(minX, pts[i].x);
				minY = Math.min(minY, pts[i].y);
				maxX = Math.max(maxX, pts[i].x);
				maxY = Math.max(maxY, pts[i].y);
			}
			if (!Number.isFinite(minX)) {
				minX = 0;
				minY = 0;
				maxX = 1;
				maxY = 1;
			}
			const p = pad || 0;
			return {
				x: minX - p,
				y: minY - p,
				width: Math.max(1, maxX - minX + p * 2),
				height: Math.max(1, maxY - minY + p * 2),
				rotation: 0
			};
		}
		function localBuildItem(hostKind, colorHex, size, points, text, id) {
			const token = HEX_TO_TOKEN[colorHex] || "brand";
			const pts = points || [];
			if (hostKind === "line" && pts.length >= 2) {
				const a = pts[0], b = pts[1];
				const pad = Math.max(8, size * 2);
				return {
					id,
					type: "arrow",
					frame: bboxFrame([a, b], pad),
					start: {
						x: a.x,
						y: a.y
					},
					end: {
						x: b.x,
						y: b.y
					},
					bend: 0,
					color: token,
					size,
					arrowStart: false,
					arrowEnd: false,
					label: ""
				};
			}
			if (hostKind === "rect" && pts.length >= 2) return {
				id,
				type: "geo",
				frame: bboxFrame(pts, 0),
				geo: "rectangle",
				text: "",
				color: token,
				fillOpacity: 0
			};
			if (hostKind === "ellipse" && pts.length >= 2) return {
				id,
				type: "geo",
				frame: bboxFrame(pts, 0),
				geo: "ellipse",
				text: "",
				color: token,
				fillOpacity: 0
			};
			if (hostKind === "frame" && pts.length >= 2) return {
				id,
				type: "frame",
				frame: bboxFrame(pts, 0),
				label: "",
				color: token
			};
			if (hostKind === "text") {
				const p = pts[0] || {
					x: 0,
					y: 0
				};
				return {
					id,
					type: "text",
					frame: {
						x: p.x,
						y: p.y,
						width: 120,
						height: 64,
						rotation: 0
					},
					text: text || "A",
					color: token,
					fontSize: Math.max(2, Math.min(512, size * 8))
				};
			}
			const frame = bboxFrame(pts, Math.max(8, size * 2));
			return {
				id,
				type: "draw",
				frame,
				points: pts.map((q) => ({
					x: q.x - frame.x,
					y: q.y - frame.y,
					p: .5
				})),
				color: token,
				size
			};
		}
		const inject = [
			"slots",
			"remote",
			"remote.board",
			"timer"
		];
		function apply(ctx) {
			const remote = ctx.remote.board;
			let canvasEl = null;
			let panelEl = null;
			let items = [];
			let viewport = {
				x: 0,
				y: 0,
				zoom: 1
			};
			let tool = "draw";
			let gridOn = true;
			let color = "#2563eb";
			let size = 4;
			let text = "Hi";
			let drawing = false;
			let curPoints = [];
			let preview = null;
			let pan = null;
			let drag = {
				active: false,
				startX: 0,
				startY: 0,
				origLeft: 0,
				origTop: 0
			};
			function contentBounds() {
				let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
				for (let i = 0; i < items.length; i++) {
					const f = items[i].frame;
					if (!f) continue;
					minX = Math.min(minX, f.x);
					minY = Math.min(minY, f.y);
					maxX = Math.max(maxX, f.x + f.width);
					maxY = Math.max(maxY, f.y + f.height);
				}
				if (!Number.isFinite(minX)) return null;
				return {
					x: minX,
					y: minY,
					width: maxX - minX,
					height: maxY - minY
				};
			}
			function drawItem(c, item) {
				const f = item.frame || {
					x: 0,
					y: 0,
					width: 1,
					height: 1,
					rotation: 0
				};
				const col = TOKEN_TO_HEX[item.color] || "#2563eb";
				c.strokeStyle = col;
				c.fillStyle = col;
				if (item.type === "text") {
					c.font = (item.fontSize || 24) + "px system-ui, -apple-system, sans-serif";
					c.textBaseline = "top";
					c.fillText(item.text || "", f.x, f.y);
					return;
				}
				if (item.type === "geo") {
					c.lineWidth = 3;
					c.lineJoin = "round";
					const x = f.x, y = f.y, w = f.width, h = f.height;
					c.beginPath();
					if (item.geo === "ellipse") c.ellipse(x + w / 2, y + h / 2, Math.max(.5, w / 2), Math.max(.5, h / 2), 0, 0, Math.PI * 2);
					else if (item.geo === "diamond") {
						c.moveTo(x + w / 2, y);
						c.lineTo(x + w, y + h / 2);
						c.lineTo(x + w / 2, y + h);
						c.lineTo(x, y + h / 2);
						c.closePath();
					} else if (item.geo === "triangle") {
						c.moveTo(x + w / 2, y);
						c.lineTo(x + w, y + h);
						c.lineTo(x, y + h);
						c.closePath();
					} else c.rect(x, y, w, h);
					if ((item.fillOpacity || 0) > 0) {
						c.globalAlpha = item.fillOpacity;
						c.fill();
						c.globalAlpha = 1;
					}
					c.stroke();
					if (item.text) {
						c.font = "14px sans-serif";
						c.fillText(item.text, x + 4, y + 4);
					}
					return;
				}
				if (item.type === "arrow") {
					c.lineWidth = item.size || 2.5;
					c.lineCap = "round";
					c.beginPath();
					c.moveTo(item.start.x, item.start.y);
					c.lineTo(item.end.x, item.end.y);
					c.stroke();
					return;
				}
				if (item.type === "frame") {
					c.lineWidth = 2;
					c.strokeRect(f.x, f.y, f.width, f.height);
					if (item.label) {
						c.font = "14px sans-serif";
						c.fillText(item.label, f.x + 6, f.y + 18);
					}
					return;
				}
				const pts = item.points || [];
				if (pts.length < 2) return;
				c.lineWidth = item.size || 4;
				c.lineCap = "round";
				c.lineJoin = "round";
				c.beginPath();
				c.moveTo(f.x + pts[0].x, f.y + pts[0].y);
				for (let i = 1; i < pts.length; i++) c.lineTo(f.x + pts[i].x, f.y + pts[i].y);
				c.stroke();
			}
			function drawPreview(c) {
				if (curPoints.length < 1) return;
				c.strokeStyle = color;
				c.fillStyle = color;
				c.lineWidth = size;
				c.lineCap = "round";
				c.lineJoin = "round";
				const a = curPoints[0];
				const b = curPoints.length >= 2 ? curPoints[curPoints.length - 1] : a;
				if (tool === "draw" || tool === "arrow") {
					if (curPoints.length >= 2) {
						c.beginPath();
						c.moveTo(a.x, a.y);
						for (let i = 1; i < curPoints.length; i++) c.lineTo(curPoints[i].x, curPoints[i].y);
						c.stroke();
					} else {
						c.beginPath();
						c.arc(a.x, a.y, size / 2, 0, Math.PI * 2);
						c.fill();
					}
				} else if (tool === "rect" || tool === "frame") c.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
				else if (tool === "ellipse") {
					c.beginPath();
					c.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
					c.stroke();
				}
			}
			function drawMiniMap(c, W, H) {
				const b = contentBounds();
				if (!b) return;
				const mmW = 120, mmH = 80;
				const mmX = W - mmW - 10, mmY = H - mmH - 10;
				const cw = Math.max(1, b.width), ch = Math.max(1, b.height);
				const scale = Math.min(mmW / cw, mmH / ch);
				const ox = mmX + (mmW - cw * scale) / 2, oy = mmY + (mmH - ch * scale) / 2;
				c.fillStyle = "rgba(255,255,255,0.88)";
				c.fillRect(mmX - 2, mmY - 2, 124, 84);
				c.strokeStyle = "#d1d5db";
				c.lineWidth = 1;
				c.strokeRect(mmX - 2, mmY - 2, 124, 84);
				c.save();
				c.beginPath();
				c.rect(mmX, mmY, mmW, mmH);
				c.clip();
				c.setTransform(scale, 0, 0, scale, ox - b.x * scale, oy - b.y * scale);
				for (let i = 0; i < items.length; i++) drawItem(c, items[i]);
				c.restore();
				c.setTransform(1, 0, 0, 1, 0, 0);
				const vx0 = -viewport.x / viewport.zoom, vy0 = -viewport.y / viewport.zoom;
				c.strokeStyle = "#2563eb";
				c.lineWidth = 1.5;
				c.strokeRect(ox + (vx0 - b.x) * scale, oy + (vy0 - b.y) * scale, W / viewport.zoom * scale, H / viewport.zoom * scale);
			}
			function redraw() {
				const el = canvasEl;
				if (!el) return;
				const c = el.getContext("2d");
				const W = el.width, H = el.height;
				c.setTransform(1, 0, 0, 1, 0, 0);
				c.clearRect(0, 0, W, H);
				c.fillStyle = "#ffffff";
				c.fillRect(0, 0, W, H);
				c.setTransform(viewport.zoom, 0, 0, viewport.zoom, viewport.x, viewport.y);
				if (gridOn) {
					const step = 32;
					const x0 = -viewport.x / viewport.zoom, y0 = -viewport.y / viewport.zoom;
					const x1 = x0 + W / viewport.zoom, y1 = y0 + H / viewport.zoom;
					c.strokeStyle = "#eceef1";
					c.lineWidth = 1 / viewport.zoom;
					c.beginPath();
					for (let gx = Math.floor(x0 / step) * step; gx <= x1; gx += step) {
						c.moveTo(gx, y0);
						c.lineTo(gx, y1);
					}
					for (let gy = Math.floor(y0 / step) * step; gy <= y1; gy += step) {
						c.moveTo(x0, gy);
						c.lineTo(x1, gy);
					}
					c.stroke();
				}
				for (let i = 0; i < items.length; i++) drawItem(c, items[i]);
				if (drawing && preview) drawPreview(c);
				c.setTransform(1, 0, 0, 1, 0, 0);
				drawMiniMap(c, W, H);
			}
			function handleWheel(e) {
				e.preventDefault();
				const sx = e.offsetX, sy = e.offsetY;
				const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
				const z = Math.max(.05, Math.min(8, viewport.zoom * factor));
				const wx = (sx - viewport.x) / viewport.zoom, wy = (sy - viewport.y) / viewport.zoom;
				viewport = {
					x: sx - wx * z,
					y: sy - wy * z,
					zoom: z
				};
				redraw();
			}
			function fitToContent() {
				const b = contentBounds();
				const el = canvasEl;
				const W = el ? el.width : 720;
				const H = el ? el.height : 460;
				if (!b) {
					viewport = {
						x: 0,
						y: 0,
						zoom: 1
					};
					redraw();
					return;
				}
				const zoom = Math.max(.05, Math.min(8, Math.min((W - 96) / Math.max(1, b.width), (H - 96) / Math.max(1, b.height))));
				const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
				viewport = {
					x: W / 2 - cx * zoom,
					y: H / 2 - cy * zoom,
					zoom
				};
				redraw();
			}
			function screenToWorld(e) {
				const n = e && e.nativeEvent ? e.nativeEvent : e || {};
				return {
					x: (n.offsetX - viewport.x) / viewport.zoom,
					y: (n.offsetY - viewport.y) / viewport.zoom
				};
			}
			function commit() {
				const hostKind = {
					draw: "freehand",
					arrow: "line",
					rect: "rect",
					ellipse: "ellipse",
					frame: "frame",
					text: "text"
				}[tool];
				if (tool === "text" ? curPoints.length >= 1 : curPoints.length >= 2) {
					const pts = tool === "text" ? [curPoints[0]] : curPoints;
					items.push(localBuildItem(hostKind, color, size, pts, text, localId()));
					remote.addItem({
						kind: hostKind,
						color,
						size,
						points: pts,
						text
					}).catch((err) => {
						console.error("addItem", err);
					});
				}
				curPoints = [];
				preview = null;
				drawing = false;
				redraw();
			}
			function onCanvasDown(e) {
				if (tool === "hand") {
					const n = e.nativeEvent || e;
					pan = {
						sx: n.offsetX,
						sy: n.offsetY,
						vx: viewport.x,
						vy: viewport.y
					};
					return;
				}
				const w = screenToWorld(e);
				if (tool === "text") {
					curPoints = [w];
					drawing = true;
					preview = { tool };
					commit();
					return;
				}
				drawing = true;
				curPoints = [w];
				preview = { tool };
				redraw();
			}
			function onCanvasMove(e) {
				const n = e.nativeEvent || e;
				if (pan) {
					viewport = {
						x: pan.vx + (n.offsetX - pan.sx),
						y: pan.vy + (n.offsetY - pan.sy),
						zoom: viewport.zoom
					};
					redraw();
					return;
				}
				if (!drawing) return;
				const w = screenToWorld(e);
				if (tool === "draw") curPoints.push(w);
				else curPoints = [curPoints[0], w];
				redraw();
			}
			function onCanvasUp() {
				if (pan) {
					pan = null;
					return;
				}
				if (!drawing) return;
				commit();
			}
			function BoardPanel() {
				const [count, setCount] = react.default.useState(0);
				const [online, setOnline] = react.default.useState(false);
				const [pos, setPos] = react.default.useState(null);
				const [canvasSize, setCanvasSize] = react.default.useState("large");
				const [, bump] = react.default.useState(0);
				react.default.useEffect(function() {
					let alive = true;
					function poll() {
						return remote.getItems().then(function(res) {
							if (!alive) return;
							const list = res && Array.isArray(res.items) ? res.items : [];
							items = list;
							setCount(list.length);
							setOnline(true);
							redraw();
						}).catch(function() {
							if (alive) setOnline(false);
						});
					}
					poll();
					const dispose = ctx.interval(poll, 300);
					return function() {
						alive = false;
						dispose();
					};
				}, []);
				function startDrag(e) {
					const t = e.target;
					if (t && t.tagName === "BUTTON") return;
					if (!panelEl) return;
					const n = e.nativeEvent || e;
					const rect = panelEl.getBoundingClientRect();
					drag.active = true;
					drag.startX = n.clientX;
					drag.startY = n.clientY;
					drag.origLeft = rect.left;
					drag.origTop = rect.top;
					if (e.currentTarget && e.currentTarget.setPointerCapture && n.pointerId !== void 0) try {
						e.currentTarget.setPointerCapture(n.pointerId);
					} catch (err) {}
				}
				function moveDrag(e) {
					if (!drag.active) return;
					const n = e.nativeEvent || e;
					setPos({
						left: drag.origLeft + (n.clientX - drag.startX),
						top: drag.origTop + (n.clientY - drag.startY)
					});
				}
				function endDrag() {
					drag.active = false;
				}
				function pickTool(t) {
					tool = t;
					bump((n) => n + 1);
					redraw();
				}
				function pickColor(c) {
					color = c;
					bump((n) => n + 1);
				}
				function toggleGrid() {
					gridOn = !gridOn;
					bump((n) => n + 1);
					redraw();
				}
				function setSizeVal(v) {
					size = Math.max(1, Math.min(64, Number(v) || 4));
					bump((n) => n + 1);
				}
				function setTextVal(v) {
					text = v;
					bump((n) => n + 1);
				}
				function clearBoard() {
					items = [];
					setCount(0);
					redraw();
					remote.clear().catch((err) => {
						console.error("clear", err);
					});
				}
				function doFit() {
					fitToContent();
				}
				function toggleSize() {
					const s = canvasSize === "large" ? "small" : "large";
					const newW = s === "large" ? 720 : 480;
					const newH = s === "large" ? 460 : 320;
					const el = canvasEl;
					const oldW = el ? el.width : 720;
					const oldH = el ? el.height : 460;
					const cx = oldW / 2, cy = oldH / 2;
					const wcx = (cx - viewport.x) / viewport.zoom;
					const wcy = (cy - viewport.y) / viewport.zoom;
					const newZoom = viewport.zoom * (newW / oldW);
					viewport = {
						x: newW / 2 - wcx * newZoom,
						y: newH / 2 - wcy * newZoom,
						zoom: newZoom
					};
					setCanvasSize(s);
				}
				const W = canvasSize === "large" ? 720 : 480;
				const H = canvasSize === "large" ? 460 : 320;
				const panelStyle = { width: W + "px" };
				if (pos) {
					panelStyle.left = pos.left + "px";
					panelStyle.top = pos.top + "px";
					panelStyle.right = "auto";
					panelStyle.bottom = "auto";
				}
				const toolButtons = TOOLS.map((t) => react.default.createElement("button", {
					key: t.id,
					className: "cohub-tool" + (tool === t.id ? " on" : ""),
					title: t.label,
					onClick: () => pickTool(t.id)
				}, t.label));
				const swatches = COLORS.map((c) => react.default.createElement("button", {
					key: c.hex,
					className: "cohub-board-swatch" + (color === c.hex ? " on" : ""),
					style: { backgroundColor: c.hex },
					onClick: () => pickColor(c.hex)
				}));
				return react.default.createElement("div", {
					className: "cohub-board-panel",
					style: panelStyle,
					ref: (el) => {
						panelEl = el;
					}
				}, react.default.createElement("div", {
					className: "cohub-board-head",
					onPointerDown: startDrag,
					onPointerMove: moveDrag,
					onPointerUp: endDrag,
					onPointerCancel: endDrag
				}, react.default.createElement("span", { className: "cohub-board-title" }, "≡ Board"), react.default.createElement("div", { className: "cohub-board-headright" }, react.default.createElement("span", { className: "cohub-board-count" }, (online ? "" : "offline · ") + count + " items"), react.default.createElement("button", {
					className: "cohub-board-clear",
					onClick: toggleSize,
					title: "Toggle window size"
				}, canvasSize === "large" ? "Small" : "Large"), react.default.createElement("button", {
					className: "cohub-board-clear",
					onClick: clearBoard
				}, "Clear"))), react.default.createElement("div", { className: "cohub-toolbar" }, toolButtons, swatches, react.default.createElement("input", {
					className: "cohub-size",
					type: "range",
					min: 1,
					max: 32,
					value: size,
					onChange: (e) => setSizeVal(e.target.value)
				}), react.default.createElement("button", {
					className: "cohub-tool" + (gridOn ? " on" : ""),
					onClick: toggleGrid
				}, "Grid"), react.default.createElement("button", {
					className: "cohub-tool",
					onClick: doFit,
					title: "Fit content to view"
				}, "Fit"), tool === "text" ? react.default.createElement("input", {
					className: "cohub-text",
					value: text,
					onChange: (e) => setTextVal(e.target.value)
				}) : null), react.default.createElement("canvas", {
					className: "cohub-canvas",
					width: W,
					height: H,
					style: { cursor: tool === "hand" ? "grab" : "crosshair" },
					ref: (el) => {
						canvasEl = el;
						if (el) {
							if (!el.__wheelAttached) {
								el.__wheelAttached = true;
								el.addEventListener("wheel", handleWheel, { passive: false });
							}
							redraw();
						}
					},
					onMouseDown: onCanvasDown,
					onMouseMove: onCanvasMove,
					onMouseUp: onCanvasUp,
					onMouseLeave: onCanvasUp
				}), react.default.createElement("div", { className: "cohub-board-hint" }, "Wheel = zoom · Pan tool = drag · Fit = best-fit · mini-map bottom-right"));
			}
			ctx.effect(function() {
				return ctx.slots.inject("shell.overlay", function() {
					return ctx.slots.register({
						name: "shell.overlay",
						id: "cohub-board",
						order: 100,
						label: "Board"
					}, function() {
						return react.default.createElement(BoardPanel);
					});
				});
			}, "cohub-board: slot");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
