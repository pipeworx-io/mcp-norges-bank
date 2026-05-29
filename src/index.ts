interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Norges Bank (Norway's central bank) MCP — exchange rates, interest rates,
 * and government debt key figures via the SDMX 2.1 REST API.
 *
 * The API exposes SDMX data flows. Default response format is XML; we request
 * SDMX-JSON via `?format=sdmx-json`. The JSON envelope nests dataSets/structure
 * under a top-level `data` key.
 *
 * Auth: none (keyless).
 * API docs: https://app.norges-bank.no/query/index.html
 *
 * Flows:
 * - EXR              Exchange rates. Key shape FREQ.BASE_CUR.QUOTE_CUR.TENOR,
 *                    e.g. B.USD.NOK.SP (business-day USD→NOK spot).
 * - IR               Interest rates incl. the policy/key policy rate.
 * - GOVT_KEYFIGURES  Norwegian government debt key figures.
 * - GOVT_GENERIC_RATES  Generic government bond/bill rates.
 *
 * Tools:
 * - get_exchange_rate: convenience — a currency code (USD/EUR/SEK/...) → NOK.
 * - get_series:        generic SDMX query against any flow + dot-separated key.
 * - list_flows:        documents the available flow references.
 */


const BASE = 'https://data.norges-bank.no/api';
const UA = 'pipeworx-mcp-norges-bank/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_exchange_rate',
    description:
      'Latest (or last N) Norges Bank exchange rate for a currency against the Norwegian krone (NOK). ' +
      'The value is how many NOK one unit of the base currency buys (e.g. USD → ~9.25 NOK). ' +
      'Builds the EXR series key B.{CURRENCY}.NOK.SP (business-day spot). ' +
      'currency is the ISO 4217 code, e.g. "USD", "EUR", "GBP", "SEK", "JPY".',
    inputSchema: {
      type: 'object',
      properties: {
        currency: { type: 'string', description: 'ISO 4217 base currency code (USD, EUR, GBP, SEK, ...).' },
        last_n: { type: 'number', description: 'Return only the last N observations (default 1).' },
        start_period: { type: 'string', description: 'Start date (YYYY-MM-DD). Overrides last_n if set.' },
        end_period: { type: 'string', description: 'End date (YYYY-MM-DD).' },
      },
      required: ['currency'],
    },
  },
  {
    name: 'get_series',
    description:
      'Generic SDMX data fetch from any Norges Bank flow. key is dot-separated SDMX dimension filters; ' +
      'leave a position empty to wildcard it. ' +
      'Examples: flow_ref="EXR", key="B.USD.NOK.SP" (daily USD→NOK spot); flow_ref="IR" (all interest-rate series). ' +
      'Use list_flows to see available flow references.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_ref: {
          type: 'string',
          description: 'Flow reference — EXR, IR, GOVT_KEYFIGURES, GOVT_GENERIC_RATES.',
        },
        key: {
          type: 'string',
          description: 'Series key: dot-separated dimension values (empty positions = wildcard). Optional; omit for the whole flow.',
        },
        last_n: { type: 'number', description: 'Return only the last N observations.' },
        start_period: { type: 'string', description: 'Start period (YYYY-MM-DD or YYYY).' },
        end_period: { type: 'string', description: 'End period (YYYY-MM-DD or YYYY).' },
      },
      required: ['flow_ref'],
    },
  },
  {
    name: 'list_flows',
    description: 'List the Norges Bank SDMX data flows available through this pack, with the dimension order of each key.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const FLOWS = [
  {
    flow_ref: 'EXR',
    name: 'Exchange rates',
    key_dimensions: ['FREQ', 'BASE_CUR', 'QUOTE_CUR', 'TENOR'],
    example_key: 'B.USD.NOK.SP',
    note: 'B=business-day frequency, SP=spot. Quote currency is NOK for krone rates.',
  },
  {
    flow_ref: 'IR',
    name: 'Interest rates',
    key_dimensions: ['FREQ', 'TENOR', 'IR_TYPE', '...'],
    example_key: '',
    note: 'Includes the Norges Bank policy (key) rate and money-market rates.',
  },
  {
    flow_ref: 'GOVT_KEYFIGURES',
    name: 'Government debt key figures',
    key_dimensions: [],
    example_key: '',
    note: 'Norwegian central government debt key figures.',
  },
  {
    flow_ref: 'GOVT_GENERIC_RATES',
    name: 'Government generic rates',
    key_dimensions: [],
    example_key: '',
    note: 'Generic Norwegian government bond/bill rates.',
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_exchange_rate':
      return getExchangeRate(args);
    case 'get_series':
      return getSeries(args);
    case 'list_flows':
      return { count: FLOWS.length, flows: FLOWS };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getExchangeRate(args: Record<string, unknown>) {
  const currency = reqStr(args, 'currency', '"USD"').toUpperCase();
  const key = `B.${currency}.NOK.SP`;
  const hasPeriod = Boolean(args.start_period || args.end_period);
  return fetchData('EXR', key, {
    start_period: args.start_period as string | undefined,
    end_period: args.end_period as string | undefined,
    last_n: hasPeriod ? undefined : ((args.last_n as number | undefined) ?? 1),
  });
}

async function getSeries(args: Record<string, unknown>) {
  return fetchData(reqStr(args, 'flow_ref', '"EXR"'), (args.key as string | undefined)?.trim() || undefined, {
    start_period: args.start_period as string | undefined,
    end_period: args.end_period as string | undefined,
    last_n: args.last_n as number | undefined,
  });
}

async function fetchData(
  flow: string,
  key: string | undefined,
  opts: { start_period?: string; end_period?: string; last_n?: number },
) {
  const params = new URLSearchParams({ format: 'sdmx-json' });
  if (opts.start_period) params.set('startPeriod', opts.start_period);
  if (opts.end_period) params.set('endPeriod', opts.end_period);
  if (opts.last_n) params.set('lastNObservations', String(opts.last_n));
  const path = key ? `${encodeURIComponent(flow)}/${encodeURIComponent(key)}` : encodeURIComponent(flow);
  const url = `${BASE}/data/${path}?${params}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Norges Bank: ${res.status} ${body.slice(0, 200)}`);
  }
  // The API may serve CSV/text for some flows; fall back to raw text if not JSON.
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('json')) {
    return { flow, key: key ?? null, format: ct || 'text', raw: (await res.text()).slice(0, 20000) };
  }
  const data = (await res.json()) as SdmxEnvelope;
  return normalizeSdmx(flow, key ?? null, data);
}

interface SdmxStructure {
  name?: string;
  names?: Record<string, string>;
  dimensions?: {
    series?: { id: string; name?: string; values?: { id: string; name?: string }[] }[];
    observation?: { id: string; name?: string; values?: { id: string; name?: string }[] }[];
  };
}

interface SdmxData {
  dataSets?: {
    series?: Record<string, { observations?: Record<string, [number | string | null, ...unknown[]]> }>;
  }[];
  structure?: SdmxStructure;
}

// Norges Bank nests dataSets/structure under a top-level `data` key.
type SdmxEnvelope = SdmxData & { data?: SdmxData };

function normalizeSdmx(flow: string, key: string | null, env: SdmxEnvelope) {
  const data: SdmxData = env.data ?? env;
  const seriesDims = data.structure?.dimensions?.series ?? [];
  const obsDims = data.structure?.dimensions?.observation ?? [];
  const seriesMap = data.dataSets?.[0]?.series ?? {};
  const out: {
    series_key: string;
    dimensions: Record<string, string>;
    observations: { period: string; value: number | null }[];
  }[] = [];
  for (const [skey, sval] of Object.entries(seriesMap)) {
    const idx = skey.split(':').map(Number);
    const dims: Record<string, string> = {};
    seriesDims.forEach((d, i) => {
      const v = d.values?.[idx[i]];
      if (v) dims[d.name ?? d.id] = v.name ?? v.id;
    });
    const obs: { period: string; value: number | null }[] = [];
    for (const [oidx, ovals] of Object.entries(sval.observations ?? {})) {
      const period = obsDims[0]?.values?.[Number(oidx)]?.id ?? oidx;
      const raw = ovals[0];
      const value = raw === null || raw === undefined ? null : Number(raw);
      obs.push({ period, value: Number.isNaN(value as number) ? null : value });
    }
    obs.sort((a, b) => (a.period < b.period ? -1 : 1));
    out.push({ series_key: skey, dimensions: dims, observations: obs });
  }
  return {
    flow,
    key,
    title: data.structure?.names?.en ?? data.structure?.name ?? flow,
    series_count: out.length,
    series: out,
  };
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
