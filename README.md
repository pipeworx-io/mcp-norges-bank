# mcp-norges-bank

Norges Bank (Norway's central bank) MCP — exchange rates, interest rates,

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Norges Bank data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
