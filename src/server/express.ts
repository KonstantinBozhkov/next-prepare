import handler from './handler';
import { FetchWithProcessedActions, OptionMiddleware } from '../common/interface';
import { fulfillFetch, validationErrorHandler, catchErrorAndProcess } from './_utils';

const performAnAction = handler.process;

export const middleware = (options?: OptionMiddleware) => {
	const { actionErrorHandler, errorHandler } = options;
	
	validationErrorHandler(errorHandler);

	return async (req, res, next) => {
		if (req.path !== '/prepare') {
			if (!req.fulfillFetch) {
				req.fulfillFetch = async ({ fetch }) => {
					return catchErrorAndProcess(errorHandler, req, res)(async () => {
						return await fulfillFetch({ req, fetch, performAnAction, actionErrorHandler });
					});
				};
			}

			return next();
		}

		const fetchFromReq: FetchWithProcessedActions = req.body.fetch;
		
		catchErrorAndProcess(errorHandler, req, res)(async () => {
			const result = await fulfillFetch({ req, fetch: fetchFromReq, performAnAction, actionErrorHandler });
			res.json(result).end();
		});
	};
};