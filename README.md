# India Stock Fundamentals Scraper - Prices, Ratios, Financials & Shareholding

Scrape Indian stock fundamentals - live prices, valuation ratios, quarterly and annual financial results, growth metrics, and shareholding data - from Screener.in and Moneycontrol. This India stock scraper accepts NSE symbols or BSE codes and returns one clean, normalized record per stock. Export to JSON, CSV, Excel, or HTML, or pull via the Apify API. No login and no API key required.

Built with Node.js 20, TypeScript, and the Apify SDK using browser-free HTTP scraping. It resolves exact NSE/BSE symbols through Moneycontrol autocomplete, merges both sources into a single record per stock, and adds retries, timeouts, deduplication, and bounded concurrency so runs stay reliable at scale.

## What It Extracts

- `symbol`, `companyName`, `nseCode`, `bseCode`, `isin`
- `sector` and `industry`
- `currentPrice` and `currentPriceSource` (moneycontrol or screener)
- `marketCapCrore`, `peRatio`, `pbRatio`, `dividendYieldPercent`
- `epsTtm`, `bookValuePerShare`, `faceValue`
- `roePercent` and `rocePercent`
- `salesGrowth3YPercent` and `profitGrowth3YPercent`
- `week52High`, `week52Low`, `previousClose`, `dayChange`, `dayChangePercent`, `volume`
- `promoterHoldingPercent`, `fiiHoldingPercent`, `diiHoldingPercent`, `publicHoldingPercent`
- `quarterlyResults` and `annualResults` - arrays of `period`, `revenueCrore`, `netProfitCrore`, `eps`
- `sourceStatus` - per-source request status (`requested`, `ok`, `url`, `error`)
- `sourceData` - original Screener.in and Moneycontrol values
- `scrapedAt` - scrape timestamp

Financial statement values are reported in INR crores. Prices and per-share values are in INR. Percentage fields use percentage points, so `18.5` means 18.5%.

## Use Cases

1. Fundamental stock screening and building Indian equity watchlists.
2. Portfolio research and valuation comparison across NSE and BSE stocks.
3. Powering Indian equity dashboards and data pipelines with normalized fields.
4. Historical quarterly and annual financial analysis with growth metrics.
5. Promoter, FII, and DII shareholding monitoring over time.
6. Fintech prototypes and spreadsheet enrichment from real market data.

## Pricing

This Actor uses Apify Pay Per Event pricing. You pay only for successful stock records stored in the dataset. Selecting both sources still creates and charges for one merged stock record. Failed symbols that return no usable data are not stored and are not charged.

| Event name | Price per event | 10 stocks | 100 stocks | 1,000 stocks |
| --- | ---: | ---: | ---: | ---: |
| `stock-scraped` | $0.002 | $0.02 | $0.20 | $2.00 |

## Input

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `symbols` | string[] | yes | `RELIANCE, TCS` | NSE symbols or BSE codes |
| `source` | string | no | `both` | `screener`, `moneycontrol`, or `both` |
| `consolidated` | boolean | no | `true` | Use consolidated Screener.in statements |
| `includeFinancials` | boolean | no | `true` | Include four quarters and five annual periods |
| `includeShareholding` | boolean | no | `true` | Include latest promoter, FII, DII, and public holdings |
| `maxResults` | integer | no | `10` | Maximum unique stocks, up to 100 |
| `maxConcurrency` | integer | no | `3` | Parallel stocks, from 1 to 10 |
| `proxyConfiguration` | object | no | Apify proxy | Optional Apify proxy configuration |

### Example input

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

## How to Scrape India Stock Fundamentals (Step by Step)

1. Click **Try for free** / **Run**.
2. Enter NSE symbols or BSE codes in `symbols` (for example `RELIANCE`, `TCS`, `INFY`, `500325`).
3. Choose a `source`: `screener`, `moneycontrol`, or `both` to merge them into one record.
4. Toggle `includeFinancials` and `includeShareholding`, then set `maxResults` (start small to test).
5. Run the Actor, then export results as JSON, CSV, Excel, or HTML, or pull them via the Apify API.

## Sample Output

```json
{
  "symbol": "RELIANCE",
  "companyName": "Reliance Industries",
  "nseCode": "RELIANCE",
  "bseCode": "500325",
  "isin": "INE002A01018",
  "sector": "Oil & Gas",
  "industry": "Refineries",
  "currentPrice": 1267.5,
  "currentPriceSource": "moneycontrol",
  "marketCapCrore": 1715249.28,
  "peRatio": 39.12,
  "pbRatio": 3.03,
  "dividendYieldPercent": 0.4,
  "epsTtm": 32.4,
  "bookValuePerShare": 418.6,
  "faceValue": 10,
  "roePercent": 8.01,
  "rocePercent": 8.37,
  "salesGrowth3YPercent": 12.5,
  "profitGrowth3YPercent": 9.8,
  "week52High": 1608.8,
  "week52Low": 1114.85,
  "previousClose": 1259.3,
  "dayChange": 8.2,
  "dayChangePercent": 0.65,
  "volume": 8412305,
  "promoterHoldingPercent": 50,
  "fiiHoldingPercent": 21.4,
  "diiHoldingPercent": 17.8,
  "publicHoldingPercent": 10.8,
  "quarterlyResults": [
    {
      "period": "Mar 2026",
      "revenueCrore": 264573,
      "netProfitCrore": 22146,
      "eps": 16.37
    }
  ],
  "annualResults": [
    {
      "period": "Mar 2026",
      "revenueCrore": 1009000,
      "netProfitCrore": 81000,
      "eps": 59.8
    }
  ],
  "sourceStatus": {
    "screener": { "requested": true, "ok": true, "url": "https://www.screener.in/company/RELIANCE/consolidated/", "error": null },
    "moneycontrol": { "requested": true, "ok": true, "url": "https://www.moneycontrol.com/india/stockpricequote/refineries/relianceindustries/RI", "error": null }
  },
  "scrapedAt": "2026-06-11T10:00:00.000Z"
}
```

Original source-specific values remain available under `sourceData`.

## How It Works

1. Validates the input and resolves each symbol to exact NSE/BSE identifiers through Moneycontrol autocomplete data.
2. Fetches fundamentals from Screener.in and live quote data from Moneycontrol over HTTP, based on the selected `source`.
3. Normalizes both sources into one record per stock, including optional quarterly/annual results and shareholding.
4. Deduplicates symbols and records per-source status under `sourceStatus`.
5. Charges `stock-scraped` only after a clean record is saved, then writes it to the Apify Dataset.

## Local Development

```powershell
npm install
npm run build
New-Item -ItemType Directory -Force storage\key_value_stores\default
Copy-Item input.json storage\key_value_stores\default\INPUT.json
npm start
```

Local `input.json` disables the Apify proxy. The Actor input schema enables it by default for cloud runs.

## Known Limits

- Screener.in may expose different standalone and consolidated values; use `consolidated` to choose.
- Moneycontrol quote values can change during market hours.
- Source-specific values can differ because of update timing or methodology.
- `quarterlyResults`, `annualResults`, and shareholding fields are only included when `includeFinancials` / `includeShareholding` are enabled and available.
- `maxResults` is capped at 100 unique stocks per run.
- This Actor provides public market data for research and automation, not investment advice.

## Responsible Use

This Actor is intended for lawful collection of publicly available information only. Users are responsible for ensuring their use complies with the source website's terms, robots.txt, applicable privacy laws, including India's DPDP Act, and all local regulations.

Do not use this Actor to collect, store, sell, or misuse personal data without a lawful basis. The Actor author is not responsible for misuse by end users.

## License

Apache-2.0. See `LICENSE`.
