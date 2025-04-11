import { env } from "~/env";
import { apiCall } from "@server/api/lib/apiCall";
import {
	type ExchangePostingRequest,
	type ExchangePostingResponse,
	ExchangePostingResponseSchema,
} from "@server/api/types/exchangePostingTypes";

export const createExchangePosting = (
	exchangePostingRequest: ExchangePostingRequest,
) =>
	apiCall<ExchangePostingRequest, ExchangePostingResponse>(
		`${env.EXCHANGE_HOST}/exchange-posting`,
		"POST",
		ExchangePostingResponseSchema,
		exchangePostingRequest,
	);
