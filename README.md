# mcp-norges-bank

Norges Bank (Norway's central bank) MCP — exchange rates, interest rates,

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_exchange_rate` | Latest (or last N) Norges Bank exchange rate for a currency against the Norwegian krone (NOK). The value is how many NOK one unit of the base currency buys (e.g. USD → ~9.25 NOK). Builds the EXR series key B.{CURRENCY}.NOK.SP (business-day spot). currency is the ISO 4217 code, e.g. "USD", "EUR", "GBP", "SEK", "JPY". |
| `get_series` | Generic SDMX data fetch from any Norges Bank flow. key is dot-separated SDMX dimension filters; leave a position empty to wildcard it. Examples: flow_ref="EXR", key="B.USD.NOK.SP" (daily USD→NOK spot); flow_ref="IR" (all interest-rate series). Use list_flows to see available flow references. |
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

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

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
