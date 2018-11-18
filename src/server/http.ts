import { parse } from 'url';
import {  ServerResponse } from 'http';
import { json as bodyParserJson, OptionsJson } from 'body-parser';

import handler from './handler';
import { fulfillFetch, bindFulfillFetchToReq, validationErrorHandler } from './_utils';
import { OptionMiddleware, FetchСontainingProcessedActions, HttpReq } from '../common/interface';

const performAnAction = handler.process;

type ReqContainingFetch = HttpReq<{ fetch: FetchСontainingProcessedActions }>;

export type MiddlewareCallback = (req: ReqContainingFetch, res: ServerResponse) => void;

export const middleware = (
	options: OptionMiddleware,
	callback: MiddlewareCallback,
	bodyParserConfig: OptionsJson,
) => {
	const { errorHandler, actionErrorHandler } = options;
	
	validationErrorHandler(errorHandler);

	const parserMiddleware = bodyParserJson(bodyParserConfig);

	return (req: ReqContainingFetch, res: ServerResponse) => parserMiddleware(req, res, async () => {
		const parsedUrl = parse(req.url, true);
		const { pathname } = parsedUrl;
	
		if (pathname !== '/prepare') {
			bindFulfillFetchToReq({ req, performAnAction, actionErrorHandler });
	
			return callback(req, res);
		}
	
		const { fetch } = req.body;
	
		try {
			const result = await fulfillFetch({ req, fetch, performAnAction });

			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(result));
		} catch (error) {
			if (!errorHandler) {
				res.statusCode = 400;
				res.end();
				return;
			}
			errorHandler(error, req, res);
		}
	});
};