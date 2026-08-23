import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSourceComparison, createStockRecord } from '../dist/routes.js';

const screener = {
    url: 'https://www.screener.in/company/TEST/consolidated/',
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

const inputSchema = JSON.parse(await readFile(new URL('../INPUT_SCHEMA.json', import.meta.url), 'utf8'));
assert.equal(inputSchema.properties.source.default, 'both');
assert.equal(inputSchema.properties.comparisonTolerancePercent.default, 2);
assert.equal(inputSchema.properties.requireBothSources.default, false);

const actorDefinition = JSON.parse(await readFile(new URL('../.actor/actor.json', import.meta.url), 'utf8'));
assert.match(actorDefinition.title, /Moneycontrol \+ Screener/);
assert.equal(actorDefinition.version, '1.1');

console.log('Dual-source comparison audit passed.');
