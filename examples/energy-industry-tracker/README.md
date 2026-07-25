# Energy Industry Tracker

A small Node.js CLI that maintains a personal watchlist of companies and
vendors in the energy management industry — demand response, DERMS, VPP,
building energy management, EV fleet charging, and similar segments.

This example was built end to end using ECC's own workflow:
[`skills/tdd-workflow`](../../skills/tdd-workflow/SKILL.md) (user journeys ->
RED -> GREEN -> refactor -> coverage -> evidence report), following the same
loop `/plan` and `/tdd` codify for this repo. See
[`TDD-EVIDENCE.md`](TDD-EVIDENCE.md) for the full RED/GREEN trail and
commit checkpoints.

Data is a manual, structured watchlist — you add entries as you research
them. It intentionally does not fetch live data from the web, which keeps
the whole tool deterministic and unit-testable offline.

## Learning the market

[`MARKET-STRUCTURE.md`](MARKET-STRUCTURE.md) is a sourced research primer
on how the energy management industry is segmented (demand response,
DERMS, VPP, building energy management, EV fleet charging, energy storage
management, microgrid controls), who the named players are in each
segment, and what's publicly known about market share and concentration.

[`data/companies.seed.json`](data/companies.seed.json) has that research
pre-structured as ~40 companies ready to load as a starting watchlist
instead of an empty one — it's also what seeds the
[web version](#web-version) below on first load.

## Requirements

Node.js >= 18 (uses only Node built-ins: `node:fs`, `node:path`,
`node:child_process`, `node:test`). No dependencies to install.

## Usage

All commands operate on a JSON watchlist file, `.energy-tracker.json` in the
current directory by default. Override the location with `--file <path>`
(placed anywhere in the argument list).

```bash
# Track a company
node bin/energy-tracker.js add "Voltus" --segment "Demand Response" \
  --stage "Series C" --source "https://voltus.co" \
  --notes "Piloting demand flexibility with two utilities"

# List everything you're currently watching
node bin/energy-tracker.js list

# Filter by segment
node bin/energy-tracker.js list --segment "Demand Response"

# Full detail, including notes history
node bin/energy-tracker.js show 1

# Append a research note (notes accumulate, they never overwrite)
node bin/energy-tracker.js note 1 "Closed $60M Series C"

# Stop actively tracking a company without deleting its history
node bin/energy-tracker.js archive 1

# Include archived companies in a listing
node bin/energy-tracker.js list --all

# Permanently delete an entry
node bin/energy-tracker.js rm 1

# Industry-shape overview: watching companies per segment
node bin/energy-tracker.js segments
```

Every write command exits `0` on success and `1` with a message on
`stderr` for usage errors or an unknown id.

## Data model

Each tracked company is:

```json
{
  "id": 1,
  "name": "Voltus",
  "segment": "Demand Response",
  "stage": "Series C",
  "source": "https://voltus.co",
  "status": "watching",
  "notes": [{ "text": "Piloting demand flexibility with two utilities", "at": "2026-07-25T00:00:00.000Z" }],
  "createdAt": "2026-07-25T00:00:00.000Z",
  "updatedAt": "2026-07-25T00:00:00.000Z"
}
```

`status` is `"watching"` or `"archived"`. `list` and `segments` only
consider `"watching"` companies unless `--all` is passed.

## Web version

There's also a self-contained, single-file web UI (same store logic,
localStorage instead of a JSON file) seeded with the 42 companies from
`data/companies.seed.json` on first load. It's not part of this repo's
build — it's published as a Claude Artifact and only stores data in your
own browser (no server, no shared/multi-device sync). If you'd previously
opened an earlier version of it, clear `localStorage` for that page (or
open it in a private window) to pick up the fuller seed data.

## Project layout

```text
bin/energy-tracker.js        # CLI entrypoint (thin process.exit wrapper)
src/cli.js                    # argument parsing, command dispatch, I/O
src/watchlist-store.js        # pure, immutable company CRUD + segment summary
data/companies.seed.json      # researched starting watchlist (see MARKET-STRUCTURE.md)
tests/watchlist-store.test.js # unit tests (node:test)
tests/cli.test.js             # integration tests (spawns the CLI)
```

## Testing

```bash
node --test tests/*.test.js

# with coverage
node --experimental-test-coverage --test-coverage-include='src/**' \
  --test tests/cli.test.js tests/watchlist-store.test.js
```

28 tests, 100% line / 96%+ branch / 100% function coverage on `src/`. See
[`TDD-EVIDENCE.md`](TDD-EVIDENCE.md) for the guarantee-by-guarantee
breakdown and the RED/GREEN evidence.
