import type { Order } from '@server/api/types/order';
import type { Redis } from 'ioredis';
import { createExchangePostingRequest } from '@server/api/lib/api/createExchangePostRequest';
import chalk from 'chalk';
import { createExchangePosting } from '@server/api/services/exchangeCalls/exchangePosting';
import { getCurrenciesFromMarket } from '@server/api/util/getCurrencies';
import type { ExchangeOperation } from '@server/api/types/exchangeOperation';
import { createExecuteTransactionsRequest } from '@server/api/lib/api/createExecuteTransactionsRequest';
import { executeTransactions } from '@server/api/services/exchangeCalls/executeTransactions';
import { setOrderStatus } from '@server/api/lib/orderRedis/setOrderStatus';
import { Status } from '@server/api/const/status';

export const handleOrders = async (id: string, order: Order, redis: Redis) => {
	// Sensible amount of maximum retries, if it goes over that, then major system issue is in effect
	const maxRetryCount = 20;
	try {
		const exchangePostingRequest = createExchangePostingRequest(order);
		console.log(chalk.blue("createExchangePostingRequest"));
		let exchangePostingResult = false;
		let exchangePostingCounter = 0;
		let exchangePostingResponse;

		while (!exchangePostingResult && exchangePostingCounter < maxRetryCount) {
			try {
				exchangePostingResponse = await createExchangePosting(
					exchangePostingRequest,
				);
				exchangePostingResult = true;
			} catch (error) {
				exchangePostingResult = false;
			}
		}

		if (exchangePostingResponse) {
			console.log(chalk.green("exchangePostingResponse SUCCESS"));
			const [sellerCurrency, buyerCurrency] = getCurrenciesFromMarket(
				order.market,
			);

			const seller: ExchangeOperation = {
				amount: Number.parseFloat(exchangePostingResponse.filledSize),
				userId: exchangePostingResponse.otherUserId,
				currency: sellerCurrency,
			};
			const buyer: ExchangeOperation = {
				amount: Number.parseFloat(exchangePostingResponse.filledFunds),
				userId: exchangePostingResponse.buyerUserId,
				currency: buyerCurrency,
			};
			const executeTransactionsRequestBody = createExecuteTransactionsRequest(
				seller,
				buyer,
			);

			console.log(chalk.blue("executeTransactions"));

			let executeTransactionsResponse;
			let executeTransactionsCounter = 0;

			let executeTransactionsResult: boolean = false;

			while (!executeTransactionsResult && executeTransactionsCounter < maxRetryCount) {
				try {
					executeTransactionsResponse = await executeTransactions(
						executeTransactionsRequestBody,
					);
					executeTransactionsResult = true;
				} catch (error) {
					executeTransactionsResult = false;
				}
			}

			if (executeTransactionsResponse) {
				console.log(chalk.green("executeTransactionsResponse SUCCESS"));
				await setOrderStatus(id, Status.COMPLETED, redis);
			} else {
				console.log(
					chalk.red("executeTransactions FAILED, Response: "),
					executeTransactionsResponse,
				);
				await setOrderStatus(id, Status.FAILED, redis);
			}
		} else {
			console.log(chalk.red("exchangePostingResponse FAILED"));
			await setOrderStatus(id, Status.FAILED, redis);
		}
	} catch (error) {
		console.error(chalk.red("createOrders FAILED, Error: "), error);
		await setOrderStatus(id, Status.FAILED, redis);
		throw error;
	}
};
