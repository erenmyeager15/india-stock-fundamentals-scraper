# Moneycontrol + Screener Stock Data Validator

Compare two public Indian stock sources in one clean record for **$2 per 1,000 saved stocks**.

Moneycontrol and Screener.in can show different prices, market caps, valuation ratios, or 52-week ranges because their update timing and calculation methods differ. This Actor collects both, keeps the original source values, and shows exactly where they agree or differ.

Use it for data-quality checks, spreadsheet validation, portfolio dashboards, source monitoring, and research pipelines that should not silently trust a single website. No login or API key is required.

## What Makes This Actor Different

For every stock, the Actor can return:

- one normalized record for easy export;
- source-level status, URLs, errors, and raw values;
- side-by-side Moneycontrol and Screener values for shared metrics;
- absolute and percentage differences per metric;
- configurable discrepancy tolerance;
- an agreement percentage and discrepancy list;
- optional Screener financial summaries and shareholding data.

This is a **source-comparison tool**, not another long-history market-data Actor.

Need live NSE/BSE index data, market statistics, peers, 13 quarters, and up to 12 annual years? Use [Indian Stocks: NSE/BSE Data & Financials](https://apify.com/fascinating_lentil/nse-bse-scraper).

## Quick Start

```json
{
  "symbols": ["RELIANCE"],
  "source": "both",
  "comparisonTolerancePercent": 2,
  "requireBothSources": true,
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

This compares one company across both sources. It saves the record only when both sources respond and marks a shared metric as matching when the difference is 2% or less.

## Comparison Output

Each saved item contains top-level fields for filtering plus the full comparison object:

```json
{
  "symbol": "RELIANCE",
  "companyName": "Reliance Industries",
  "comparisonStatus": "compared",
  "agreementPercent": 75,
  "discrepancyCount": 2,
  "currentPrice": 1500,
  "currentPriceSource": "moneycontrol",
  "sourceComparison": {
    "status": "compared",
    "method": "symmetric-percent-difference",
    "tolerancePercent": 2,
    "comparedMetricCount": 8,
    "matchingMetricCount": 6,
    "discrepancyCount": 2,
    "agreementPercent": 75,
    "metrics": {
      "currentPrice": {
        "screenerValue": 1498,
        "moneycontrolValue": 1500,
        "absoluteDifference": 2,
        "differencePercent": 0.1334,
        "withinTolerance": true
      }
    },
    "discrepancies": ["marketCapCrore", "peRatio"]
  },
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
      "url": "https://www.moneycontrol.com/...",
      "error": null
    }
  }
}
```

The numbers above illustrate the output structure; live values change with the sources.

## Metrics Compared

When both sources provide them, the Actor compares:

- current price;
- market capitalization;
- P/E ratio;
- book value per share;
- dividend yield;
- face value;
- 52-week high;
- 52-week low.

The percentage difference is symmetric: neither source is treated as the unquestioned baseline. A 2% tolerance means a difference of 2% or less is counted as an agreement.

## Other Data Returned

| Group | Fields |
| --- | --- |
| Identity | `symbol`, `companyName`, `nseCode`, `bseCode`, `isin`, `sector`, `industry` |
| Market data | `currentPrice`, `previousClose`, `dayChange`, `dayChangePercent`, `volume`, `week52High`, `week52Low` |
| Valuation | `marketCapCrore`, `peRatio`, `pbRatio`, `dividendYieldPercent`, `epsTtm`, `bookValuePerShare`, `faceValue` |
| Profitability | `roePercent`, `rocePercent`, `salesGrowth3YPercent`, `profitGrowth3YPercent` |
| Ownership | `promoterHoldingPercent`, `fiiHoldingPercent`, `diiHoldingPercent`, `publicHoldingPercent` |
| Optional summaries | `quarterlyResults`, `annualResults` |
| Traceability | `sourceStatus`, `sourceData`, `scrapedAt` |

Financial statement values are in INR crores. Price and per-share values are in INR. Percentage fields use percentage points, so `18.5` means 18.5%.

## Input

| Field | Default | Purpose |
| --- | --- | --- |
| `symbols` | `["RELIANCE"]` | NSE symbols or BSE codes such as `TCS`, `INFY`, or `500325`. |
| `source` | `both` | Compare both sources, or request one source as a fallback. |
| `comparisonTolerancePercent` | `2` | Maximum symmetric percentage difference counted as a match. |
| `requireBothSources` | `false` | Skip incomplete comparisons when enabled. Requires `source: "both"`. |
| `consolidated` | `true` | Request consolidated Screener.in data when available. |
| `includeFinancials` | `false` | Add the latest four quarters and five annual summary periods. |
| `includeShareholding` | `false` | Add latest promoter, FII, DII, and public holdings. |
| `maxResults` | `1` | Maximum unique symbols, up to 100 per run. |
| `maxConcurrency` | `1` | Parallel stocks, up to 10. Keep modest to reduce source blocking. |
| `proxyConfiguration` | disabled | Optional. Small verified runs normally do not require a proxy. |

## Comparison Statuses

- `compared`: both sources returned data and at least one shared metric was compared.
- `partial`: both were requested, but only one source returned usable data.
- `not-requested`: the run intentionally requested only one source.
- `no-comparable-values`: both sources responded but shared numeric values were unavailable.

Enable `requireBothSources` when partial rows would be unsuitable for your workflow.

## Pricing

| Event | Price |
| --- | ---: |
| `stock-scraped` | `$0.002` per saved stock record |
| `apify-actor-start` | `$0.00005` per GB at run start |

Selecting both sources still creates and charges only one dataset item per stock. Stocks that return no usable data are not billed. The Actor also respects the user's maximum run charge.

## Limits and Interpretation

- A match means the values fall within your selected tolerance; it does not prove either source is correct.
- Differences can be legitimate because of market movement, reporting periods, rounding, or source methodology.
- Moneycontrol values may change during market hours.
- Optional statement and shareholding fields come from Screener.in and are supporting context, not dual-source comparisons.
- Source websites can change their public pages or rate limits.
- This Actor provides data for research and quality-control workflows, not investment advice or trading signals.

## Responsible Use

Use the Actor only for lawful collection of public data. Respect source terms, robots.txt, data-redistribution restrictions, and regulations that apply to your use.

## License

Apache-2.0. See `LICENSE`.
