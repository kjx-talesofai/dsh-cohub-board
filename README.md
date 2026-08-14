# dsh-cohub-board

A DeepSeek Harness plugin bundle for a **Cohub Board** — draw, read, clear and export a real [Cohub](https://cohub.run) Board from any DSH agent, with two-way sync to the Cohub space.

Two halves in one package:

- **Host** (`dsh.bundle`): agent tools `board_draw` / `board_read` / `board_clear` / `board_export`, plus a Remote `board` service (`ctx.remote.board.*`).
- **Web Client** (`dsh.client`): a draggable floating canvas panel (pen / line / rect / oval / text / frame tools, wheel zoom, pan, grid, fit-to-content, mini-map), wired to the Host through the Remote service.

## Install

```bash
dsh plugin --profile web add github:kjx-talesofai/dsh-cohub-board
# or a local checkout:
dsh plugin --profile web add ./cohub-board
```

Restart `dsh web` — the canvas panel appears in the browser and the tools are registered for the agent.

## Configure

`spaceId` and `boardId` default to a personal demo board; override them in `cordis.patch.yml`:

```yaml
- id: cohub-board
  name: dsh-cohub-board
  config:
    spaceId: '<your-space-uuid>'
    boardId: '<your-board-uuid>'
```

## Tools

| Tool | Purpose |
|---|---|
| `board_draw` | Draw a native shape (`line`→arrow, `freehand`→draw, `rect`/`ellipse`/`circle`→geo, `text`, `frame`) |
| `board_read` | Read every item on the board (Cohub `BoardItem` model) |
| `board_clear` | Clear the board (local + Cohub) |
| `board_export` | Export the board to a local file (`json` or `png`) |

Requires the `cohub` CLI to be installed and logged in (`cohub auth login`).
