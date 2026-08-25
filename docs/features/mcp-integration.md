# Feature: MCP Server Integration — Out-of-the-Box Defaults

## Status

`done`

## Overview

Integrate three MCP servers (CodeGraph, Context7, Engram) as a native, zero-config part of the harness. Cloning the harness and launching OpenCode/Claude Code gives a working MCP setup immediately — the three servers start enabled, install/run without credentials, and require no manual per-project configuration.

## Motivation / Intent

The previous spec shipped the three MCPs with `enabled: false` and referenced npm packages that do not exist on the npm registry (404 on install), making the servers fail to start (`status=failed`). Specifically:

- `@gentlest-mcp/codegraph` -> package does not exist. Correct package: `@astudioplus/codegraph-mcp` (bin: `codegraph-mcp`), run locally via `npx -y`.
- `@gentlest-mcp/engram` -> package does not exist. Engram is **not** an npm package: it is a native local binary `engram.exe` (v1.20.0) invoked as `engram mcp --tools=agent`, storing its DB locally in `~/.engram/`. No cloud login required.
- `context7` -> remote and correct; works without an API key at the basic tier.

**Design decision (APPLE-approved):** the three MCPs must start **ACTIVE** (`enabled: true`) by default so collaborators clone the harness and get a working zero-config setup. Tool names must stay enabled (`true`). This turns the MCP layer from dead config into a working out-of-the-box capability of the shared harness.

## User Stories

1. As a **new collaborator**, I want to clone the harness and start a session without manual MCP setup so that MCP-backed tools work immediately.
2. As a **harness developer**, I want correct packages/binary paths for each MCP so that no server fails to launch with a 404 or missing-binary error.
3. As a **maintainer**, I want OpenCode and Claude Code configs consistent so both platforms get the same working servers without divergence.

## Acceptance Criteria

- [x] `AC1` — Clean-clone boot: after `git clone` + `make init`, launching OpenCode starts the three MCP servers without error; none reports `status=failed` caused by a 404 package or missing binary.
- [x] `AC2` — CodeGraph installs via `npx -y` using `@astudioplus/codegraph-mcp` with no credentials; first run auto-indexes the repo in `.codegraph/`.
- [x] `AC3` — Engram runs through the local native binary `engram mcp --tools=agent` (not `npx`), uses its local DB at `~/.engram/`, and requires no cloud login; 15 tools (mem_save, mem_search, mem_context, mem_session_summary, etc.) are exposed.
- [x] `AC4` — Context7 connects over HTTPS to `https://mcp.context7.com/mcp` with no API key and serves the basic tier without error.
- [x] `AC5` — OpenCode and the Claude Code mirror are consistent: identical server names (codegraph, context7, engram) and equivalent launch commands in `.opencode/opencode.jsonc` and `.claude/settings.json`.
- [x] `AC6` — Documentation Updates list is present and the listed docs are updated when the change lands.

## Data Contract

### OpenCode config — `.opencode/opencode.jsonc`

Target block (all servers `enabled: true`, all tool families enabled):

```jsonc
"mcp": {
  "codegraph": {
    "type": "local",
    "command": ["npx", "-y", "@astudioplus/codegraph-mcp"],
    "enabled": true
  },
  "context7": {
    "type": "remote",
    "url": "https://mcp.context7.com/mcp",
    "enabled": true
  },
  "engram": {
    "type": "local",
    "command": ["engram", "mcp", "--tools=agent"],
    "enabled": true
  }
}
```

Tools: the global MCP tool gates move to enabled:

```jsonc
"tools": {
  "codegraph_*": true,
  "context7_*": true,
  "engram_*": true
}
```

### Claude Code mirror — `.claude/settings.json`

```json
"mcpServers": {
  "codegraph": {
    "command": "npx",
    "args": ["-y", "@astudioplus/codegraph-mcp"]
  },
  "context7": {
    "url": "https://mcp.context7.com/mcp"
  },
  "engram": {
    "command": "engram",
    "args": ["mcp", "--tools=agent"]
  }
}
```

### Server contract

| Server name | Launch | opencode config | claude config | Path in config |
|---|---|---|---|---|
| `codegraph` | `npx -y @astudioplus/codegraph-mcp` | `command` (array) | `command` + `args` | `mcp.codegraph` / `mcpServers.codegraph` |
| `context7` | remote URL `https://mcp.context7.com/mcp` | `url` (type remote) | `url` | `mcp.context7` / `mcpServers.context7` |
| `engram` | `engram mcp --tools=agent` (native binary) | `command` (array) | `command` + `args` | `mcp.engram` / `mcpServers.engram` |

### Opencode enabled flags

| Server | opencode `enabled` | description |
|---|---|---|
| codegraph | `true` | always on |
| context7 | `true` | always on (basic tier, no API key) |
| engram | `true` | always on |

### Headers

| Server | opencode | claude |
|---|---|---|
| codegraph | no headers | no headers |
| context7 | no headers (basic tier, no API key) | no headers |
| engram | no headers | no headers |

Note: the previous `headers.CONTEXT7_API_KEY = {env:...}` block is removed from the zero-config path. An API key is optional and can be re-added for higher rate limits; it must never block startup.

## Edge Cases

- **`engram.exe` not installed**: if the local binary is missing, Engram fails to launch. Fallback: surface a warning with an install hint (install the `engram` binary and ensure it is on `PATH`) instead of failing hard. The other two servers must still start; a single missing binary must not take down the whole MCP layer.
- **No network on first `npx`**: CodeGraph first run downloads the package via `npx -y`. With no internet, `npx` falls back to cache if the package was fetched before, otherwise it fails. Mitigate by documenting a pre-warm step (`npx -y @astudioplus/codegraph-mcp`) and stating that network is only required on first run.
- **Context/token ceiling from 3 enabled MCPs**: each active MCP adds tool definitions and context tokens. With all three on, the context budget grows. Mitigate by documenting the "fewer MCPs = fewer tokens" trade-off and allowing per-agent/per-server disabling later.
- **First-run indexing**: CodeGraph requires the repo index; ensure `make init` or first run triggers it so exploration works immediately.
- **Context7 rate limits**: free tier works without a key; heavy use can hit rate limits. Document how to set `CONTEXT7_API_KEY` for higher limits without dropping startup.

## Security / Privacy

- Context7 is a remote third-party service; on the basic no-key path, only the library doc query leaves the machine.
- Engram stores memory locally in `~/.engram/` and never uploads to a cloud.
- CodeGraph index lives in `.codegraph/`, already ignored in `.gitignore` — it must not be committed.
- Any API key additions must use env vars only (`{env:...}` in OpenCode); never hardcode keys in the config or the Claude mirror.

## Dependencies

- `@astudioplus/codegraph-mcp` (npm, local via `npx -y`).
- Context7 remote endpoint `https://mcp.context7.com/mcp` (no auth for basic tier).
- Engram native binary `engram.exe` v1.20.0 on `PATH`; local DB at `~/.engram/`.

## Documentation Updates

When the config/behavior change lands, update:

- [x] `docs/harness/MCP-integration.md` — reflect the new package/bin paths, the zero-config active-by-default model, and Engram native binary usage.
- [x] `docs/CHANGELOG.md` — add an entry under `[Unreleased]` describing the package fix (404 -> working) and the default-enabled behavior.
- [x] `docs/development/HARNESS_SUMMARY.md` — update the MCP Servers section (status: enabled by default; binary vs npx).
- [x] `docs/features/mcp-integration.md` — this spec, mark `done` once implemented.

## Notes

### Decisions taken

1. MCPs are `enabled: true` by default to guarantee an out-of-the-box working experience. Trade-off: larger context — mitigated by allowing per-project/per-agent disabling.
2. CodeGraph uses `@astudioplus/codegraph-mcp`, not the nonexistent `@gentlest-mcp/codegraph`.
3. Engram is invoked as a native binary (`engram mcp --tools=agent`), not an npm package, with a local DB in `~/.engram/`.
4. Context7 runs without an API key; the headers block is removed from the default config.
5. OpenCode uses `enabled` + `command` (array); Claude uses `command` + `args`. Server names stay identical across both configs (AC5).
6. The overall SW default is "out-of-the-box working"; collaborators clone and use the MCPs without any setup.

---

_This spec is the contract between architect and developers: exact server names, commands, enabled flags and tool gates are specified so both `.opencode/opencode.jsonc` and `.claude/settings.json` can be implemented to match AC1–AC6._


