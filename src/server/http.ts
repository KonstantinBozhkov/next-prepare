import { parse } from 'url';
import * as bodyParser from 'body-parser';

import handler from './handler';
import { fulfillFetch, validationErrorHandler } from './_utils';
import { OptionMiddleware, FetchWithProcessedActions } from '../common/interface';

const performAnAction = handler.process;

export const middleware = (options: OptionMiddleware, callback: (req, res) => any, conf: any) => {
	const { errorHandler } = options;
	
	validationErrorHandler(errorHandler);

	const parserMiddleware = bodyParser.json(conf);

	return (req, res) => parserMiddleware(req, res, async () => {
		const parsedUrl = parse(req.url, true);
		const { pathname } = parsedUrl;
	
		if (pathname !== '/prepare') {
			req.fulfillFetch = async ({ fetch }) => fulfillFetch({ req, fetch, performAnAction });
	
			return callback(req, res);
		}
	
		const fetchFromReq: FetchWithProcessedActions = req.body.fetch;
	
		try {
			const result = await fulfillFetch({ req, fetch: fetchFromReq, performAnAction });

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