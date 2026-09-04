import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSourceComparison, createStockRecord } from '../dist/routes.js';

const screener = {
    url: 'https://www.screener.in/company/TEST/consolidated/',
    fetchedAt: '2026-08-23T00:00:01.000Z',
    latestAnnualPeriod: 'Mar 2026',
    companyName: 'Test Industries',
    currentPrice: 100,
    marketCapCrore: 1000,
    peRatio: 20,
    bookValuePerShare: null,
    dividendYieldPercent: null,
    rocePercent: 15,
    roePercent: 12,
    faceValue: null,
    week52High: null,
    week52Low: null,
    salesGrowth3YPercent: 8,
    profitGrowth3YPercent: 10,
    promoterHoldingPercent: null,
    fiiHoldingPercent: null,
    diiHoldingPercent: null,
    publicHoldingPercent: null,
    quarterlyResults: [],
    annualResults: [],
};

const moneycontrol = {
    url: 'https://www.moneycontrol.com/test',
    fetchedAt: '2026-08-23T00:00:02.000Z',
    companyName: 'Test Industries',
    nseCode: 'TEST',
    bseCode: '500000',
    isin: 'INE000000000',
    sector: 'Test sector',
    industry: 'Test industry',
    currentPrice: 101,
    previousClose: 99,
    dayChange: 2,
    dayChangePercent: 2.02,
    marketCapCrore: 1100,
    peRatio: 20.2,
    pbRatio: 3,
    dividendYieldPercent: null,
    epsTtm: 5,
    bookValuePerShare: null,
    faceValue: null,
    week52High: null,
    week52Low: null,
    volume: 12345,
    lastUpdated: '2026-08-23T00:00:00.000Z',
};

const compared = createSourceComparison(
    { screener: true, moneycontrol: true },
    screener,
    moneycontrol,
    2,
);

assert.equal(compared.status, 'compared');
assert.equal(compared.comparedMetricCount, 3);
assert.equal(compared.matchingMetricCount, 2);
assert.equal(compared.discrepancyCount, 1);
assert.equal(compared.agreementPercent, 66.67);
assert.deepEqual(compared.discrepancies, ['marketCapCrore']);
assert.equal(compared.metrics.currentPrice.withinTolerance, true);
assert.equal(compared.metrics.marketCapCrore.withinTolerance, false);
assert.equal(compared.metrics.currentPrice.screenerObservedAt, screener.fetchedAt);
assert.equal(compared.metrics.currentPrice.moneycontrolObservedAt, moneycontrol.fetchedAt);
assert.equal(compared.unitMismatchCount, 0);
assert.deepEqual(compared.validationFlags, ['marketCapCrore:difference-above-tolerance']);

const unitMismatch = createSourceComparison(
    { screener: true, moneycontrol: true },
    { ...screener, marketCapCrore: 1000 },
    { ...moneycontrol, marketCapCrore: 100000 },
    2,
);
assert.equal(unitMismatch.metrics.marketCapCrore.unitMismatchType, 'possible-lakh-vs-crore');
assert.equal(unitMismatch.metrics.marketCapCrore.unitMismatchResolution, 'auto-resolved');
assert.equal(unitMismatch.metrics.marketCapCrore.unitConversionApplied, 'moneycontrol-lakh-to-crore');
assert.equal(unitMismatch.metrics.marketCapCrore.comparedMoneycontrolValue, 1000);
assert.equal(unitMismatch.metrics.marketCapCrore.rawDifferencePercent, 196.0396);
assert.equal(unitMismatch.metrics.marketCapCrore.differencePercent, 0);
assert.equal(unitMismatch.metrics.marketCapCrore.withinTolerance, true);
assert.equal(unitMismatch.discrepancyCount, 0);
assert.deepEqual(unitMismatch.discrepancies, []);
assert.deepEqual(unitMismatch.unitMismatchMetrics, ['marketCapCrore']);
assert.deepEqual(unitMismatch.validationFlags, ['marketCapCrore:lakh-crore-auto-resolved']);

const partial = createSourceComparison(
    { screener: true, moneycontrol: true },
    screener,
    null,
    2,
);
assert.equal(partial.status, 'partial');
assert.equal(partial.agreementPercent, null);

const singleSource = createSourceComparison(
    { screener: true, moneycontrol: false },
    screener,
    null,
    2,
);
assert.equal(singleSource.status, 'not-requested');

const record = createStockRecord(
    'TEST',
    { screener: true, moneycontrol: true },
    screener,
    moneycontrol,
    { screener: null, moneycontrol: null },
    2,
);
assert.equal(record.comparisonStatus, 'compared');
assert.equal(record.agreementPercent, compared.agreementPercent);
assert.equal(record.discrepancyCount, compared.discrepancyCount);
assert.equal(record.currentPriceSource, 'moneycontrol');
assert.deepEqual(record.sourceObservedAt, {
    screener: screener.fetchedAt,
    moneycontrol: moneycontrol.fetchedAt,
    moneycontrolReportedAt: moneycontrol.lastUpdated,
});
assert.equal(record.fiscalPeriodAlignmentStatus, 'not-compared');
assert.equal(record.periodAlignment.screenerLatestAnnualPeriod, 'Mar 2026');
assert.equal(record.periodAlignment.screenerPeriodResolution.normalizedEndDate, '2026-03-31');
assert.equal(record.periodAlignment.screenerPeriodResolution.method, 'explicit-month-year');
assert.match(record.periodAlignment.warning, /does not expose a fiscal period/);

const fiscalAssumptionRecord = createStockRecord(
    'TEST',
    { screener: true, moneycontrol: true },
    { ...screener, latestAnnualPeriod: 'FY24' },
    moneycontrol,
    { screener: null, moneycontrol: null },
    2,
);
assert.equal(fiscalAssumptionRecord.periodAlignment.screenerPeriodResolution.normalizedEndDate, '2024-03-31');
assert.equal(fiscalAssumptionRecord.periodAlignment.screenerPeriodResolution.method, 'source-fy-assumption');
assert.match(fiscalAssumptionRecord.periodAlignment.screenerPeriodResolution.assumption, /March 31/);
assert.match(fiscalAssumptionRecord.periodAlignment.sourcePeriodAssumptions.moneycontrol, /March 31/);

const inputSchema = JSON.parse(await readFile(new URL('../INPUT_SCHEMA.json', import.meta.url), 'utf8'));
assert.equal(inputSchema.properties.source.default, 'both');
assert.equal(inputSchema.properties.comparisonTolerancePercent.default, 2);
assert.equal(inputSchema.properties.requireBothSources.default, false);

const actorDefinition = JSON.parse(await readFile(new URL('../.actor/actor.json', import.meta.url), 'utf8'));
assert.match(actorDefinition.title, /Moneycontrol \+ Screener/);
assert.equal(actorDefinition.version, '1.1');

console.log('Dual-source comparison audit passed.');
