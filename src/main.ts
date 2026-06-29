import { Actor, log } from 'apify';
import type { ProxyConfiguration } from 'crawlee';
import { createStockRecord, scrapeMoneycontrol, scrapeScreener } from './routes.js';
import type { ActorInput, MoneycontrolData, ScreenerData } from './types.js';

const DEFAULT_INPUT: Required<Pick<ActorInput,
    'symbols' | 'source' | 'consolidated' | 'includeFinancials' | 'includeShareholding' | 'maxResults' | 'maxConcurrency'
>> = {
    symbols: ['RELIANCE'],
    source: 'both',
    consolidated: true,
    includeFinancials: false,
    includeShareholding: false,
    maxResults: 1,
    maxConcurrency: 1,
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function runPool<T>(
    items: T[],
    concurrency: number,
    handler: (item: T) => Promise<void>,
    shouldStop: () => boolean,
): Promise<void> {
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (!shouldStop() && nextIndex < items.length) {
            const index = nextIndex++;
            await handler(items[index]);
        }
    });
    await Promise.all(workers);
}

await Actor.init();

try {
    const suppliedInput: ActorInput = (await Actor.getInput<ActorInput>()) ?? DEFAULT_INPUT;
    const input = { ...DEFAULT_INPUT, ...suppliedInput };
    const symbols = [...new Set(input.symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))]
        .slice(0, input.maxResults);

    if (symbols.length === 0) throw new Error('Provide at least one NSE symbol or BSE code in symbols.');

    const proxyConfiguration = suppliedInput.proxyConfiguration
        ? await Actor.createProxyConfiguration(suppliedInput.proxyConfiguration)
        : undefined;
    const wantsScreener = input.source === 'screener' || input.source === 'both';
    const wantsMoneycontrol = input.source === 'moneycontrol' || input.source === 'both';
    let pushed = 0;
    let failed = 0;
    let spendingLimitReached = false;

    log.info(`Scraping ${symbols.length} stock(s) from ${input.source} with concurrency ${input.maxConcurrency}.`);

    await runPool(symbols, input.maxConcurrency, async (symbol) => {
        if (spendingLimitReached) return;

        let screener: ScreenerData | null = null;
        let moneycontrol: MoneycontrolData | null = null;
        const errors = { screener: null as string | null, moneycontrol: null as string | null };

        const tasks: Promise<void>[] = [];
        if (wantsScreener) {
            tasks.push(
                scrapeScreener(symbol, input, proxyConfiguration as ProxyConfiguration | undefined)
                    .then((data) => { screener = data; })
                    .catch((error) => { errors.screener = errorMessage(error); }),
            );
        }
        if (wantsMoneycontrol) {
            tasks.push(
                scrapeMoneycontrol(symbol, proxyConfiguration as ProxyConfiguration | undefined)
                    .then((data) => { moneycontrol = data; })
                    .catch((error) => { errors.moneycontrol = errorMessage(error); }),
            );
        }
        await Promise.all(tasks);

        // Another worker may have reached the spending limit while these requests were in flight.
        if (spendingLimitReached) return;

        if (!screener && !moneycontrol) {
            failed++;
            log.error(`No data returned for ${symbol}.`, errors);
            return;
        }

        const record = createStockRecord(
            symbol,
            { screener: wantsScreener, moneycontrol: wantsMoneycontrol },
            screener,
            moneycontrol,
            errors,
        );
        const chargeResult = await Actor.pushData(record, 'stock-scraped');
        const recordWasSaved = chargeResult.chargedCount > 0 || !chargeResult.eventChargeLimitReached;
        if (recordWasSaved) pushed++;

        if (chargeResult.eventChargeLimitReached) {
            spendingLimitReached = true;
            const message = `Stopped at the user's spending limit after ${pushed} stock record(s).`;
            await Actor.setStatusMessage(message);
            log.warning(message);
            return;
        }

        log.info(`Stored ${record.symbol}: ${record.companyName ?? 'company name unavailable'}.`);
    }, () => spendingLimitReached);

    if (!spendingLimitReached) {
        await Actor.setStatusMessage(`Finished with ${pushed} stock record(s); ${failed} failed.`);
        log.info(`Finished. Stored ${pushed} stock record(s); ${failed} request(s) returned no usable data.`);
    }
} finally {
    await Actor.exit();
}
