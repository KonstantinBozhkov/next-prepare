import { Response, NextFunction } from 'express';

import handler from './handler';
import {
	ExpressReq,
	OptionMiddleware,
	FetchСontainingProcessedActions,
} from '../common/interface';
import {
	fulfillFetch,
	catchErrorAndProcess,
	bindFulfillFetchToReq,
	validationErrorHandler,
} from './_utils';

const performAnAction = handler.process;

// TODO: Need fix bug, body is any
type ReqContainingFetch = ExpressReq<{ fetch: FetchСontainingProcessedActions }>;

export const middleware = (options?: OptionMiddleware) => {
	const { actionErrorHandler, errorHandler } = options;
	
	validationErrorHandler(errorHandler);

	return async (req: ReqContainingFetch, res: Response, next: NextFunction) => {
		if (req.path !== '/prepare') {
			if (!req.fulfillFetch) {
				bindFulfillFetchToReq({ req, performAnAction, actionErrorHandler });
			}

			return next();
		}

		const fetchFromReq: FetchСontainingProcessedActions = req.body.fetch;
		
		catchErrorAndProcess(errorHandler, req, res)(async () => {
			const result = await fulfillFetch({ req, fetch: fetchFromReq, performAnAction, actionErrorHandler });
			res.json(result).end();
		});
	};
};