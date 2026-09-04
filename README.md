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
- lakh-versus-crore normalization with explicit soft flags and raw-value traceability;
- per-source observation timestamps and Moneycontrol's reported update time;
- an explicit fiscal-period alignment status instead of silently comparing unlike periods;
- optional Screener financial summaries and shareholding data.

This is a **source-comparison tool**, not another long-history market-data Actor.

Need live NSE/BSE index data, market statistics, peers, 13 quarters, and up to 12 annual years? Use [Indian Stocks: NSE/BSE Data & Financials](https://apify.com/fascinating_lentil/nse-bse-scraper).

## Quick Start

The input form is ready to run without editing: it compares one Reliance record across Moneycontrol and Screener.in with a 2% tolerance, requires both sources for the sample, and uses no proxy. Inspect the agreement score and per-metric differences, then add more symbols or optional Screener.in enrichment.

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
  "unitMismatchCount": 0,
  "validationFlags": ["marketCapCrore:difference-above-tolerance"],
  "fiscalPeriodAlignmentStatus": "not-compared",
  "sourceObservedAt": {
    "screener": "2026-09-02T10:00:00.000Z",
    "moneycontrol": "2026-09-02T10:00:00.250Z",
    "moneycontrolReportedAt": "2026-09-02T15:29:58+05:30"
  },
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
        "withinTolerance": true,
        "screenerObservedAt": "2026-09-02T10:00:00.000Z",
        "moneycontrolObservedAt": "2026-09-02T10:00:00.250Z",
        "unitMismatchType": null,
        "unitMismatchResolution": null,
        "unitConversionApplied": null
      }
    },
    "discrepancies": ["marketCapCrore", "peRatio"],
    "unitMismatchCount": 0,
    "unitMismatchMetrics": [],
    "validationFlags": [
      "marketCapCrore:difference-above-tolerance",
      "peRatio:difference-above-tolerance"
    ]
  },
  "periodAlignment": {
    "status": "not-compared",
    "screenerLatestAnnualPeriod": "Mar 2026",
    "moneycontrolLatestAnnualPeriod": null,
    "aligned": null,
    "warning": "Moneycontrol quote data does not expose a fiscal period. Period-dependent metrics such as ROE and ROCE are not compared across sources."
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

For `marketCapCrore`, a roughly 100x source difference triggers a lakh/crore check. If dividing the larger value by 100 brings both sources within your configured tolerance, the Actor marks the unit mismatch as `auto-resolved`, compares the normalized values, and does not count the same field again as a value discrepancy. Raw source values and the raw difference remain in the comparison output. If normalization does not resolve the difference, the warning remains unresolved for review.

Every compared metric includes the time each source was fetched. Moneycontrol's own reported quote timestamp is retained separately when available. Screener.in does not expose an equivalent timestamp for every field, so the Actor labels the collection time rather than presenting it as a source publication time.

The Moneycontrol quote feed does not expose a comparable fiscal reporting period. The Actor therefore reports fiscal alignment as `not-compared` and does not cross-source compare period-dependent ROE or ROCE values. Explicit periods such as `Mar 2026` are normalized directly. Ambiguous labels such as `FY24` use a visible per-source assumption of an Indian fiscal year ending March 31 (`2024-03-31`); the applied method and assumption are included in `periodAlignment` rather than silently guessed. Optional financial periods remain clearly identified as Screener-only context.

## Other Data Returned

| Group | Fields |
| --- | --- |
| Identity | `symbol`, `companyName`, `nseCode`, `bseCode`, `isin`, `sector`, `industry` |
| Market data | `currentPrice`, `previousClose`, `dayChange`, `dayChangePercent`, `volume`, `week52High`, `week52Low` |
| Valuation | `marketCapCrore`, `peRatio`, `pbRatio`, `dividendYieldPercent`, `epsTtm`, `bookValuePerShare`, `faceValue` |
| Profitability | `roePercent`, `rocePercent`, `salesGrowth3YPercent`, `profitGrowth3YPercent` |
| Ownership | `promoterHoldingPercent`, `fiiHoldingPercent`, `diiHoldingPercent`, `publicHoldingPercent` |
| Optional summaries | `quarterlyResults`, `annualResults` |
| Validation | `validationFlags`, `unitMismatchCount`, `sourceComparison`, `periodAlignment` |
| Traceability | `sourceStatus`, `sourceData`, `sourceObservedAt`, `scrapedAt` |

Financial statement values are in INR crores. Price and per-share values are in INR. Percentage fields use percentage points, so `18.5` means 18.5%.

## Input

| Field | Default | Purpose |
| --- | --- | --- |
| `symbols` | `["RELIANCE"]` | NSE symbols or BSE codes such as `TCS`, `INFY`, or `500325`. |
| `source` | `both` | Compare both sources, or request one source as a fallback. |
| `comparisonTolerancePercent` | `2` | Maximum symmetric percentage difference counted as a match. |
| `requireBothSources` | `false` (prefilled `true`) | Skip incomplete comparisons when enabled. The quick-start form enables it for a complete two-source example. |
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
- Lakh/crore normalization never rewrites raw source values; it only changes the values used for comparison when a 100x conversion resolves the mismatch within tolerance.
- Fiscal-period alignment remains `not-compared` when Moneycontrol does not expose a matching reporting period.
- Moneycontrol values may change during market hours.
- Optional statement and shareholding fields come from Screener.in and are supporting context, not dual-source comparisons.
- Source websites can change their public pages or rate limits.
- This Actor provides data for research and quality-control workflows, not investment advice or trading signals.

## Responsible Use

Use the Actor only for lawful collection of public data. Respect source terms, robots.txt, data-redistribution restrictions, and regulations that apply to your use.

## License

Apache-2.0. See `LICENSE`.
