import { Action, FetchWithProcessedActions } from '../common/interface';

export const sortFetch = (fetch: FetchWithProcessedActions) => {
	const parallel: FetchWithProcessedActions = {};
	const queue: FetchWithProcessedActions = {};

	Object.entries(fetch).forEach(([key, action]) => {
		if (action.options && action.options.parallel) {
			parallel[key] = action;
		} else {
			queue[key] = action;
		}
	});

	return { parallel, queue };
};

interface IFulfillFetchProps {
	req: any;
	fetch: FetchWithProcessedActions;
	performAnAction(action: Action<any>, req: any, accumulation?: any): any;
}

// TODO: Add logger
export const fulfillFetch = async ({ req, fetch, performAnAction }: IFulfillFetchProps) => {
	const { parallel, queue } = sortFetch(fetch);

	const accumulation = {};

	// parallel
	await Promise.all(
		Object.entries(parallel).map( async ([key, action]) => {
			try {
				accumulation[key] = await performAnAction(action, req);
			} catch (error) {
				if (!action.options || !action.options.optional) {
					throw error;
				}
				
				accumulation[key] = null;
				// log
			}
		}),
	);

	// queue
	return await Object.entries(queue).reduce(async (accPromise: object, [ key, action ]) => {
		const acc = await accPromise;
		let result = null;

		try {
			result = await performAnAction(action, req, acc);
		} catch (error) {
			if (!action.options || !action.options.optional) {
				throw error;
			}
			// log
		}
		return { ...acc, [key]: result };
	}, Promise.resolve(accumulation));
};
/* 
export const getHandlers = (pathToHandlers: string): HandlerFunction[] => {
	if (!pathToHandlers) {
		throw new Error('Expected pathToHandlers to be a string');
	}

	if (!fs.existsSync(pathToHandlers)) {
		throw new Error('File not found. Invalid pathToHandlers');
	}

	const handlers = require(pathToHandlers);

	if (typeof pathToHandlers !== 'string') {
		throw new Error('Expected pathToHandlers to be a string');
	}

	if (!handlers) {
		throw new Error('Expected handlers to be a object containing functions');
	}

	Object.values(handlers).forEach(handler => {
		if (typeof handler !== 'function') {
			throw new Error(`Expected ${ handler } handler to be a function.`);
		}
	})
	
	return handlers;
}
*/

export const validationErrorHandler = errorHandler => {
	if (errorHandler && typeof errorHandler !== 'function') {
		throw new Error('Expected handleError to be a function');
	}
};

export const catchErrorAndProcess = (errorHandler, req, res) => async f => {
	try {
		return await f(); 
	} catch (error) {
		if (!errorHandler) {
			return res.status(400).end();
		}
		errorHandler(error, req, res);
	}
};