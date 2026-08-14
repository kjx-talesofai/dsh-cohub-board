# dsh-cohub-board

A DeepSeek Harness bundle that exposes a Cohub Board as agent tools. Draw and read a real [Cohub](https://cohub.run) Board (draw / arrow / geo / text / frame shapes) directly from any DSH agent, with two-way sync to the Cohub space.

## Install

```bash
dsh plugin --profile web add github:kjx-talesofai/dsh-cohub-board
# or a local checkout:
dsh plugin --profile web add ./cohub-board
```

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
