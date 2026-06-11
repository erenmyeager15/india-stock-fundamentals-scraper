import { load, type CheerioAPI } from 'cheerio';
import { ProxyAgent, fetch } from 'undici';
import type { ProxyConfiguration } from 'crawlee';
import type {
    ActorInput,
    MoneycontrolData,
    PeriodResult,
    ScreenerData,
    SourceState,
    StockRecord,
} from './types.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT_MS = 30_000;

interface MoneycontrolSuggestion {
    link_src?: string;
    pdt_dis_nm?: string;
    name?: string;
    sc_id?: string;
}

interface MoneycontrolResponse {
    code?: string;
    message?: string;
    data?: Record<string, unknown>;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(value: string): string {
    return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeLabel(value: string): string {
    return cleanText(value).replace(/\s*\+\s*$/, '').toLowerCase();
}

export function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const original = cleanText(String(value));
    if (!original || original === '-' || /^n\/?a$/i.test(original)) return null;

    const isNegative = /^\(.*\)$/.test(original) || original.startsWith('-');
    const cleaned = original
        .replace(/[₹,%]/g, '')
        .replace(/\b(?:cr\.?|crores?|rs\.?)\b/gi, '')
        .replace(/[()]/g, '')
        .replace(/,/g, '')
        .trim();
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return isNegative ? -Math.abs(parsed) : parsed;
}

async function fetchResource<T extends 'text' | 'json'>(
    url: string,
    responseType: T,
    proxyConfiguration?: ProxyConfiguration,
): Promise<T extends 'json' ? unknown : string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;
        const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

        try {
            const response = await fetch(url, {
                dispatcher,
                headers: {
                    accept: responseType === 'json' ? 'application/json,text/plain,*/*' : 'text/html,application/xhtml+xml',
                    'accept-language': 'en-US,en;q=0.9',
                    referer: 'https://www.moneycontrol.com/',
                    'user-agent': USER_AGENT,
                },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const body = responseType === 'json' ? await response.json() : await response.text();
            return body as T extends 'json' ? unknown : string;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < 2) await sleep(500 * 2 ** attempt + Math.random() * 250);
        } finally {
            if (dispatcher) await dispatcher.close();
        }
    }

    throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? 'unknown error'}`);
}

function getTopRatios($: CheerioAPI): Map<string, number[]> {
    const ratios = new Map<string, number[]>();
    $('#top-ratios li').each((_index, element) => {
        const name = normalizeLabel($(element).find('.name').text());
        const values = $(element)
            .find('.number')
            .map((_i, numberElement) => parseNumber($(numberElement).text()))
            .get()
            .filter((value): value is number => value !== null);
        if (name) ratios.set(name, values);
    });
    return ratios;
}

function getGrowthRate($: CheerioAPI, heading: string): number | null {
    let result: number | null = null;
    $('.ranges-table').each((_index, table) => {
        if (cleanText($(table).find('th').first().text()).toLowerCase() !== heading.toLowerCase()) return;
        $(table).find('tr').each((_rowIndex, row) => {
            const cells = $(row).find('td');
            if (normalizeLabel(cells.eq(0).text()) === '3 years:') {
                result = parseNumber(cells.eq(1).text());
            }
        });
    });
    return result;
}

function getLatestShareholding($: CheerioAPI, label: string): number | null {
    let result: number | null = null;
    $('#quarterly-shp table tbody tr').each((_index, row) => {
        const cells = $(row).find('td');
        const rowLabel = normalizeLabel(cells.eq(0).text());
        if (rowLabel === label.toLowerCase()) result = parseNumber(cells.last().text());
    });
    return result;
}

function getFinancialResults($: CheerioAPI, sectionSelector: string, limit: number, annual: boolean): PeriodResult[] {
    const table = $(`${sectionSelector} [data-result-table] table`).first();
    const periods = table
        .find('thead th')
        .slice(1)
        .map((_index, element) => cleanText($(element).text()))
        .get();
    const rows = new Map<string, Array<number | null>>();

    table.find('tbody tr').each((_index, row) => {
        const cells = $(row).find('td');
        const label = normalizeLabel(cells.eq(0).text());
        if (!label) return;
        rows.set(
            label,
            cells
                .slice(1)
                .map((_cellIndex, cell) => parseNumber($(cell).text()))
                .get(),
        );
    });

    const sales = rows.get('sales') ?? [];
    const netProfit = rows.get('net profit') ?? [];
    const eps = rows.get('eps in rs') ?? [];
    const indexes = periods
        .map((period, index) => ({ period, index }))
        .filter(({ period }) => !annual || /^[A-Z][a-z]{2}\s+\d{4}$/.test(period))
        .slice(-limit);

    return indexes.map(({ period, index }) => ({
        period,
        revenueCrore: sales[index] ?? null,
        netProfitCrore: netProfit[index] ?? null,
        eps: eps[index] ?? null,
    }));
}

export function parseScreenerHtml(
    html: string,
    url: string,
    options: Pick<ActorInput, 'includeFinancials' | 'includeShareholding'>,
): ScreenerData {
    const $ = load(html);
    const top = getTopRatios($);
    const highLow = top.get('high / low') ?? [];

    return {
        url,
        companyName: cleanText($('h1').first().text()) || null,
        currentPrice: top.get('current price')?.[0] ?? null,
        marketCapCrore: top.get('market cap')?.[0] ?? null,
        peRatio: top.get('stock p/e')?.[0] ?? null,
        bookValuePerShare: top.get('book value')?.[0] ?? null,
        dividendYieldPercent: top.get('dividend yield')?.[0] ?? null,
        rocePercent: top.get('roce')?.[0] ?? null,
        roePercent: top.get('roe')?.[0] ?? null,
        faceValue: top.get('face value')?.[0] ?? null,
        week52High: highLow[0] ?? null,
        week52Low: highLow[1] ?? null,
        salesGrowth3YPercent: getGrowthRate($, 'Compounded Sales Growth'),
        profitGrowth3YPercent: getGrowthRate($, 'Compounded Profit Growth'),
        promoterHoldingPercent: options.includeShareholding ? getLatestShareholding($, 'promoters') : null,
        fiiHoldingPercent: options.includeShareholding ? getLatestShareholding($, 'fiis') : null,
        diiHoldingPercent: options.includeShareholding ? getLatestShareholding($, 'diis') : null,
        publicHoldingPercent: options.includeShareholding ? getLatestShareholding($, 'public') : null,
        quarterlyResults: options.includeFinancials ? getFinancialResults($, '#quarters', 4, false) : [],
        annualResults: options.includeFinancials ? getFinancialResults($, '#profit-loss', 5, true) : [],
    };
}

export async function scrapeScreener(
    symbol: string,
    options: Pick<ActorInput, 'consolidated' | 'includeFinancials' | 'includeShareholding'>,
    proxyConfiguration?: ProxyConfiguration,
): Promise<ScreenerData> {
    const suffix = options.consolidated ? '/consolidated/' : '/';
    const url = `https://www.screener.in/company/${encodeURIComponent(symbol)}${suffix}`;
    const html = await fetchResource(url, 'text', proxyConfiguration);
    return parseScreenerHtml(html, url, options);
}

function suggestionCodes(suggestion: MoneycontrolSuggestion): string[] {
    const text = cleanText(load(suggestion.pdt_dis_nm ?? '').text());
    return text
        .split(',')
        .map((part) => cleanText(part).toUpperCase())
        .filter(Boolean);
}

function chooseSuggestion(symbol: string, suggestions: MoneycontrolSuggestion[]): MoneycontrolSuggestion | null {
    const target = symbol.toUpperCase();
    return (
        suggestions.find((suggestion) => suggestionCodes(suggestion).includes(target)) ??
        suggestions.find((suggestion) => suggestion.sc_id?.toUpperCase() === target) ??
        suggestions[0] ??
        null
    );
}

function stringValue(data: Record<string, unknown>, key: string): string | null {
    const value = data[key];
    return value === null || value === undefined || value === '' ? null : String(value);
}

export function parseMoneycontrolQuote(
    suggestion: MoneycontrolSuggestion,
    response: MoneycontrolResponse,
): MoneycontrolData {
    if (response.code !== '200' || !response.data) {
        throw new Error(response.message || 'Moneycontrol quote API returned no data');
    }

    const data = response.data;
    return {
        url: suggestion.link_src ?? '',
        companyName: stringValue(data, 'SC_FULLNM') ?? suggestion.name ?? null,
        nseCode: stringValue(data, 'NSEID'),
        bseCode: stringValue(data, 'BSEID'),
        isin: stringValue(data, 'isinid'),
        sector: stringValue(data, 'main_sector'),
        industry: stringValue(data, 'newSubsector') ?? stringValue(data, 'SC_SUBSEC'),
        currentPrice: parseNumber(data.pricecurrent),
        previousClose: parseNumber(data.priceprevclose),
        dayChange: parseNumber(data.pricechange),
        dayChangePercent: parseNumber(data.pricepercentchange),
        marketCapCrore: parseNumber(data.MKTCAP),
        peRatio: parseNumber(data.PE),
        pbRatio: parseNumber(data.PB),
        dividendYieldPercent: parseNumber(data.DY),
        epsTtm: parseNumber(data.SC_TTM),
        bookValuePerShare: parseNumber(data.BV),
        faceValue: parseNumber(data.FV),
        week52High: parseNumber(data['52H']),
        week52Low: parseNumber(data['52L']),
        volume: parseNumber(data.VOL),
        lastUpdated: stringValue(data, 'lastupd'),
    };
}

export async function scrapeMoneycontrol(
    symbol: string,
    proxyConfiguration?: ProxyConfiguration,
): Promise<MoneycontrolData> {
    const searchUrl = `https://www.moneycontrol.com/mccode/common/autosuggestion_solr.php?query=${encodeURIComponent(symbol)}&type=1&format=json`;
    const suggestions = (await fetchResource(searchUrl, 'json', proxyConfiguration)) as MoneycontrolSuggestion[];
    const suggestion = chooseSuggestion(symbol, Array.isArray(suggestions) ? suggestions : []);
    if (!suggestion?.sc_id) throw new Error(`No Moneycontrol match found for ${symbol}`);

    const quoteUrl = `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${encodeURIComponent(suggestion.sc_id)}`;
    const response = (await fetchResource(quoteUrl, 'json', proxyConfiguration)) as MoneycontrolResponse;
    return parseMoneycontrolQuote(suggestion, response);
}

function sourceState(requested: boolean, data: { url: string } | null, error: string | null): SourceState {
    return {
        requested,
        ok: data !== null,
        url: data?.url || null,
        error,
    };
}

function firstNumber(...values: Array<number | null | undefined>): number | null {
    return values.find((value): value is number => value !== null && value !== undefined) ?? null;
}

export function createStockRecord(
    symbol: string,
    requestedSources: { screener: boolean; moneycontrol: boolean },
    screener: ScreenerData | null,
    moneycontrol: MoneycontrolData | null,
    errors: { screener: string | null; moneycontrol: string | null },
): StockRecord {
    const priceSource = moneycontrol?.currentPrice !== null && moneycontrol?.currentPrice !== undefined
        ? 'moneycontrol'
        : screener?.currentPrice !== null && screener?.currentPrice !== undefined
          ? 'screener'
          : null;

    return {
        symbol: moneycontrol?.nseCode ?? symbol,
        companyName: moneycontrol?.companyName ?? screener?.companyName ?? null,
        nseCode: moneycontrol?.nseCode ?? null,
        bseCode: moneycontrol?.bseCode ?? null,
        isin: moneycontrol?.isin ?? null,
        sector: moneycontrol?.sector ?? null,
        industry: moneycontrol?.industry ?? null,
        currentPrice: firstNumber(moneycontrol?.currentPrice, screener?.currentPrice),
        currentPriceSource: priceSource,
        marketCapCrore: firstNumber(moneycontrol?.marketCapCrore, screener?.marketCapCrore),
        peRatio: firstNumber(moneycontrol?.peRatio, screener?.peRatio),
        pbRatio: moneycontrol?.pbRatio ?? null,
        dividendYieldPercent: firstNumber(moneycontrol?.dividendYieldPercent, screener?.dividendYieldPercent),
        epsTtm: moneycontrol?.epsTtm ?? null,
        bookValuePerShare: firstNumber(moneycontrol?.bookValuePerShare, screener?.bookValuePerShare),
        faceValue: firstNumber(moneycontrol?.faceValue, screener?.faceValue),
        roePercent: screener?.roePercent ?? null,
        rocePercent: screener?.rocePercent ?? null,
        salesGrowth3YPercent: screener?.salesGrowth3YPercent ?? null,
        profitGrowth3YPercent: screener?.profitGrowth3YPercent ?? null,
        week52High: firstNumber(moneycontrol?.week52High, screener?.week52High),
        week52Low: firstNumber(moneycontrol?.week52Low, screener?.week52Low),
        previousClose: moneycontrol?.previousClose ?? null,
        dayChange: moneycontrol?.dayChange ?? null,
        dayChangePercent: moneycontrol?.dayChangePercent ?? null,
        volume: moneycontrol?.volume ?? null,
        promoterHoldingPercent: screener?.promoterHoldingPercent ?? null,
        fiiHoldingPercent: screener?.fiiHoldingPercent ?? null,
        diiHoldingPercent: screener?.diiHoldingPercent ?? null,
        publicHoldingPercent: screener?.publicHoldingPercent ?? null,
        quarterlyResults: screener?.quarterlyResults ?? [],
        annualResults: screener?.annualResults ?? [],
        sourceStatus: {
            screener: sourceState(requestedSources.screener, screener, errors.screener),
            moneycontrol: sourceState(requestedSources.moneycontrol, moneycontrol, errors.moneycontrol),
        },
        sourceData: { screener, moneycontrol },
        scrapedAt: new Date().toISOString(),
    };
}
