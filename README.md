# mcp-norges-bank

Norges Bank (Norway's central bank) MCP — exchange rates, interest rates, and government debt key figures via the SDMX 2.1 REST API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

| Tool | Description |
|------|-------------|
| `get_exchange_rate` | Latest (or last N) Norges Bank exchange rate for a currency against the Norwegian krone (NOK). The value is how many NOK one unit of the base currency buys (e.g. USD → ~9.25 NOK). Builds the EXR series key B.{CURRENCY}.NOK.SP (business-day spot). currency is the ISO 4217 code, e.g. "USD", "EUR", "GBP", "SEK", "JPY". |
| `get_policy_rate` | Norges Bank's current key policy rate (the sight deposit rate paid on banks' reserves): the rate, the date it took effect, the previous rate, and when that one took effect, plus recent decision history. Computed from the daily policy-rate series, so it reflects the most recent rate-setting meeting. history is how many past rate changes to include (default 5, max 20). |
| `get_series` | Generic SDMX data fetch from any Norges Bank flow. key is dot-separated SDMX dimension filters; leave a position empty to wildcard it. Examples: flow_ref="EXR", key="B.USD.NOK.SP" (daily USD→NOK spot); flow_ref="IR" (all interest-rate series). For the current policy rate specifically, use get_policy_rate instead of guessing an IR key. Use list_flows to see available flow references. |
| `list_flows` | List the four Norges Bank SDMX data flows available in this pack (EXR exchange rates, IR interest rates, GOVT_KEYFIGURES, GOVT_GENERIC_RATES) with each flow's dimension order, an example series key, and usage notes. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "norges-bank": {
      "url": "https://gateway.pipeworx.io/norges-bank/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/norges-bank/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/norges_bank_get_exchange_rate \
  -H 'Content-Type: application/json' \
  -d '{"currency":"USD"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/norges_bank_get_exchange_rate`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-norges-bank` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/norges-bank/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "norges-bank": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-norges-bank"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Norges Bank data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
