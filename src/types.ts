export type DataSource = 'screener' | 'moneycontrol' | 'both';

export type SourceComparisonStatus = 'compared' | 'partial' | 'not-requested' | 'no-comparable-values';

export interface ActorInput {
    symbols: string[];
    source?: DataSource;
    comparisonTolerancePercent?: number;
    requireBothSources?: boolean;
    consolidated?: boolean;
    includeFinancials?: boolean;
    includeShareholding?: boolean;
    maxResults?: number;
    maxConcurrency?: number;
    proxyConfiguration?: {
        useApifyProxy?: boolean;
        apifyProxyGroups?: string[];
        proxyUrls?: string[];
    };
}

export interface PeriodResult {
    period: string;
    revenueCrore: number | null;
    netProfitCrore: number | null;
    eps: number | null;
}

export interface ScreenerData {
    url: string;
    companyName: string | null;
    currentPrice: number | null;
    marketCapCrore: number | null;
    peRatio: number | null;
    bookValuePerShare: number | null;
    dividendYieldPercent: number | null;
    rocePercent: number | null;
    roePercent: number | null;
    faceValue: number | null;
    week52High: number | null;
    week52Low: number | null;
    salesGrowth3YPercent: number | null;
    profitGrowth3YPercent: number | null;
    promoterHoldingPercent: number | null;
    fiiHoldingPercent: number | null;
    diiHoldingPercent: number | null;
    publicHoldingPercent: number | null;
    quarterlyResults: PeriodResult[];
    annualResults: PeriodResult[];
}

export interface MoneycontrolData {
    url: string;
    companyName: string | null;
    nseCode: string | null;
    bseCode: string | null;
    isin: string | null;
    sector: string | null;
    industry: string | null;
    currentPrice: number | null;
    previousClose: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    marketCapCrore: number | null;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYieldPercent: number | null;
    epsTtm: number | null;
    bookValuePerShare: number | null;
    faceValue: number | null;
    week52High: number | null;
    week52Low: number | null;
    volume: number | null;
    lastUpdated: string | null;
}

export interface SourceState {
    requested: boolean;
    ok: boolean;
    url: string | null;
    error: string | null;
}

export interface MetricComparison {
    screenerValue: number;
    moneycontrolValue: number;
    absoluteDifference: number;
    differencePercent: number;
    withinTolerance: boolean;
}

export interface SourceComparison {
    status: SourceComparisonStatus;
    method: 'symmetric-percent-difference';
    tolerancePercent: number;
    comparedMetricCount: number;
    matchingMetricCount: number;
    discrepancyCount: number;
    agreementPercent: number | null;
    metrics: Record<string, MetricComparison>;
    discrepancies: string[];
}

export interface StockRecord {
    symbol: string;
    companyName: string | null;
    nseCode: string | null;
    bseCode: string | null;
    isin: string | null;
    sector: string | null;
    industry: string | null;
    currentPrice: number | null;
    currentPriceSource: 'moneycontrol' | 'screener' | null;
    marketCapCrore: number | null;
    peRatio: number | null;
    pbRatio: number | null;
    dividendYieldPercent: number | null;
    epsTtm: number | null;
    bookValuePerShare: number | null;
    faceValue: number | null;
    roePercent: number | null;
    rocePercent: number | null;
    salesGrowth3YPercent: number | null;
    profitGrowth3YPercent: number | null;
    week52High: number | null;
    week52Low: number | null;
    previousClose: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    volume: number | null;
    promoterHoldingPercent: number | null;
    fiiHoldingPercent: number | null;
    diiHoldingPercent: number | null;
    publicHoldingPercent: number | null;
    quarterlyResults: PeriodResult[];
    annualResults: PeriodResult[];
    comparisonStatus: SourceComparisonStatus;
    agreementPercent: number | null;
    discrepancyCount: number;
    sourceComparison: SourceComparison;
    sourceStatus: {
        screener: SourceState;
        moneycontrol: SourceState;
    };
    sourceData: {
        screener: ScreenerData | null;
        moneycontrol: MoneycontrolData | null;
    };
    scrapedAt: string;
}
