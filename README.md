# India Stock Fundamentals Scraper

Collect current Indian stock prices, valuation ratios, financial results, growth metrics, and shareholding data from Screener.in and Moneycontrol. The Actor accepts NSE symbols or BSE codes and returns one clean, normalized record per stock.

No login. No API key. Browser-free HTTP scraping.

## Features

- Screener.in fundamentals, ROE, ROCE, growth, quarterly results, annual results, and shareholding
- Moneycontrol live quote data, NSE/BSE identifiers, sector, market cap, P/E, P/B, 52-week range, and volume
- Exact NSE/BSE symbol resolution through Moneycontrol autocomplete data
- One normalized dataset row per stock, even when both sources are selected
- Optional consolidated or standalone Screener.in financials
- Optional Apify proxy support, retries, timeouts, deduplication, and bounded concurrency
- Pay per successful stock record only

## Input

```json
{
  "symbols": ["RELIANCE", "TCS", "INFY", "500180"],
  "source": "both",
  "consolidated": true,
  "includeFinancials": true,
  "includeShareholding": true,
  "maxResults": 10,
  "maxConcurrency": 3,
  "proxyConfiguration": {
    "useApifyProxy": true
  }
}
```

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `symbols` | string[] | `RELIANCE, TCS` | NSE symbols or BSE codes |
| `source` | string | `both` | `screener`, `moneycontrol`, or `both` |
| `consolidated` | boolean | `true` | Use consolidated Screener.in statements |
| `includeFinancials` | boolean | `true` | Include four quarters and five annual periods |
| `includeShareholding` | boolean | `true` | Include latest promoter, FII, DII, and public holdings |
| `maxResults` | integer | `10` | Maximum unique stocks, up to 100 |
| `maxConcurrency` | integer | `3` | Parallel stocks, from 1 to 10 |
| `proxyConfiguration` | object | Apify proxy | Standard Apify proxy configuration |

## Output

Every successful symbol produces one record. The top-level fields are normalized for easy CSV, JSON, Excel, database, and API use. Original source-specific values remain available under `sourceData`.

```json
{
  "symbol": "RELIANCE",
  "companyName": "Reliance Industries",
  "nseCode": "RELIANCE",
  "bseCode": "500325",
  "sector": "Oil & Gas",
  "currentPrice": 1267.5,
  "currentPriceSource": "moneycontrol",
  "marketCapCrore": 1715249.28,
  "peRatio": 39.12,
  "pbRatio": 3.03,
  "roePercent": 8.01,
  "rocePercent": 8.37,
  "promoterHoldingPercent": 50,
  "quarterlyResults": [
    {
      "period": "Mar 2026",
      "revenueCrore": 264573,
      "netProfitCrore": 22146,
      "eps": 16.37
    }
  ],
  "sourceStatus": {
    "screener": { "requested": true, "ok": true, "url": "https://www.screener.in/company/RELIANCE/consolidated/", "error": null },
    "moneycontrol": { "requested": true, "ok": true, "url": "https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI", "error": null }
  },
  "scrapedAt": "2026-06-11T10:00:00.000Z"
}
```

Financial statement values are reported in INR crores. Prices and per-share values are in INR. Percentage fields use percentage points, so `18.5` means 18.5%.

## Pricing

The Actor charges **$0.002 per successful stock record**. Selecting both sources still creates and charges for one merged stock record.

Examples:

| Stocks | Price |
| ---: | ---: |
| 10 | $0.02 |
| 100 | $0.20 |
| 1,000 | $2.00 |

Failed symbols that return no usable data are not stored and are not charged.

## Use Cases

- Fundamental stock screening and watchlists
- Portfolio research and valuation comparison
- Indian equity dashboards and data pipelines
- Historical quarterly and annual financial analysis
- Promoter and institutional shareholding monitoring
- Fintech prototypes and spreadsheet enrichment

## Local Development

```powershell
npm install
npm run build
New-Item -ItemType Directory -Force storage\key_value_stores\default
Copy-Item input.json storage\key_value_stores\default\INPUT.json
npm start
```

Local `input.json` disables the Apify proxy. The Actor input schema enables it by default for cloud runs.

## Data Notes

- Screener.in may expose different standalone and consolidated values.
- Moneycontrol quote values can change during market hours.
- Source-specific values can differ because of update timing or methodology.
- This Actor provides public market data for research and automation, not investment advice.

## License

Apache-2.0
