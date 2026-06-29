# India Stock Fundamentals Scraper - Screener.in + Moneycontrol

Scrape public Indian stock fundamentals from Screener.in and Moneycontrol. Enter NSE symbols or BSE codes and get one normalized row per stock with price, market cap, valuation ratios, profitability metrics, 52-week range, sector details, and optional financial statement and shareholding data.

Use it for Indian equity watchlists, portfolio research, data dashboards, spreadsheet enrichment, and scheduled exports. No login or API key is required. This Actor provides market data for research and informational workflows only; it is not financial advice.

## Quick Start

```json
{
  "symbols": ["RELIANCE"],
  "source": "both",
  "consolidated": true,
  "includeFinancials": false,
  "includeShareholding": false,
  "maxResults": 1,
  "maxConcurrency": 1,
  "proxyConfiguration": {
    "useApifyProxy": false
  }
}
```

This runs one stock through both sources, keeps proxy off, and skips larger statement/shareholding tables so the first run stays fast and low-cost.

## What It Extracts

| Group | Fields |
| --- | --- |
| Company identity | `symbol`, `companyName`, `nseCode`, `bseCode`, `isin`, `sector`, `industry` |
| Price and market data | `currentPrice`, `currentPriceSource`, `previousClose`, `dayChange`, `dayChangePercent`, `volume`, `week52High`, `week52Low` |
| Valuation | `marketCapCrore`, `peRatio`, `pbRatio`, `dividendYieldPercent`, `epsTtm`, `bookValuePerShare`, `faceValue` |
| Profitability and growth | `roePercent`, `rocePercent`, `salesGrowth3YPercent`, `profitGrowth3YPercent` |
| Ownership | `promoterHoldingPercent`, `fiiHoldingPercent`, `diiHoldingPercent`, `publicHoldingPercent` |
| Statements | `quarterlyResults`, `annualResults` with period, revenue, net profit, and EPS |
| Traceability | `sourceStatus`, `sourceData`, `scrapedAt` |

Financial statement values are in INR crores. Prices and per-share values are in INR. Percentage fields use percentage points, so `18.5` means 18.5%.

## Input

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `symbols` | string array | `["RELIANCE"]` | NSE symbols or BSE codes, for example `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`, or `500325`. |
| `source` | string | `both` | Use `screener`, `moneycontrol`, or `both`. |
| `consolidated` | boolean | `true` | Use consolidated Screener.in financials when available. |
| `includeFinancials` | boolean | `false` | Include latest quarterly and annual statement rows from Screener.in. |
| `includeShareholding` | boolean | `false` | Include promoter, FII, DII, and public holding percentages when available. |
| `maxResults` | integer | `1` | Maximum unique stocks to process in one run. |
| `maxConcurrency` | integer | `1` | Number of stocks processed at the same time. Increase carefully for larger lists. |
| `proxyConfiguration` | object | disabled | Usually not needed for small runs. Enable Apify Proxy only if source blocking appears. |

## Output

The Actor saves one dataset row per stock. The table view highlights the most useful research fields: symbol, company, price, daily change, market cap, valuation ratios, ROE/ROCE, promoter holding, sector, and scrape time. The full JSON record can also include source-level status, source URLs, raw source values, statement arrays, and shareholding data.

## Verified Sample

An existing successful run for `RELIANCE` returned this trimmed row:

```json
{
  "symbol": "RELIANCE",
  "companyName": "Reliance Industries",
  "nseCode": "RELIANCE",
  "bseCode": "500325",
  "isin": "INE002A01018",
  "sector": "Oil & Gas",
  "industry": "Oil Exploration and Production",
  "currentPrice": 1309.5,
  "currentPriceSource": "moneycontrol",
  "marketCapCrore": 1772085.95,
  "peRatio": 40.42,
  "pbRatio": 3.13,
  "dividendYieldPercent": 0.46,
  "roePercent": 8.91,
  "rocePercent": 10.3,
  "salesGrowth3YPercent": 6,
  "profitGrowth3YPercent": 5,
  "week52High": 1611.8,
  "week52Low": 1253.2,
  "previousClose": 1328.1,
  "dayChange": -18.6,
  "dayChangePercent": -1.4005,
  "volume": 24887034,
  "sourceStatus": {
    "screener": {
      "requested": true,
      "ok": true,
      "url": "https://www.screener.in/company/RELIANCE/consolidated/",
      "error": null
    },
    "moneycontrol": {
      "requested": true,
      "ok": true,
      "url": "https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI",
      "error": null
    }
  },
  "scrapedAt": "2026-06-21T13:18:12.181Z"
}
```

## Pricing

Active pay-per-event pricing:

| Event | Price |
| --- | ---: |
| `stock-scraped` | `$0.002` per saved stock row |
| `apify-actor-start` | `$0.00005` per GB at run start |

Each successful stock row is saved and charged atomically. Selecting both sources still creates one merged dataset row per stock. Failed symbols are not billed, and the Actor stops taking new symbols when the user's spending limit is reached.

## Common Workflows

1. Build an Indian equity watchlist from NSE symbols.
2. Compare market cap, P/E, P/B, ROE, ROCE, and dividend yield across stocks.
3. Export Moneycontrol quote data and Screener.in fundamentals to CSV or Excel.
4. Enable `includeFinancials` for quarterly and annual result arrays.
5. Schedule a small saved task for recurring portfolio snapshots.

## Notes and Limits

- Screener.in and Moneycontrol can differ because of update timing, methodology, or market-hours movement.
- Moneycontrol quote values can change during the trading day.
- `includeFinancials` and `includeShareholding` add more fields but can increase runtime.
- `maxResults` is capped at 100 unique stocks per run.
- This Actor extracts public market data. It does not provide recommendations, trading signals, or investment advice.

## Responsible Use

Use this Actor only for lawful collection of publicly available market data. Respect source website terms, robots.txt, data redistribution rules, and any regulations that apply to how you store or use exported financial data.

## License

Apache-2.0. See `LICENSE`.
