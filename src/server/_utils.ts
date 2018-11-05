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

// Fulfill Parallel

type FulfillParallelFetchProps = {
	req: any;
	fetch: FetchWithProcessedActions;
	performAnAction(action: Action<any>, req: any, accumulation?: any): any;
};

type FulfillParallelFetch = (props: FulfillParallelFetchProps) => Promise<object>;

export const fulfillParallelFetch: FulfillParallelFetch = async ({ req, fetch, performAnAction }) => {
	const resiltParallel = {};

	// starting parallel concessions
	await Promise.all(Object.entries(fetch).map( async ([key, action]) => {
		resiltParallel[key] = await performAnAction(action, req);
	}));

	return resiltParallel;
};

// Fulfill Queue
interface IFulfillQueuePreparesProps {
	req: any;
	fetch: FetchWithProcessedActions;
	accumulation: object;
	performAnAction(action: Action<any>, req: any, accumulation?: any): any;
}

type FulfillQueuePrepares = (props: IFulfillQueuePreparesProps) => Promise<object>;

export const fulfillQueuePrepares: FulfillQueuePrepares = async ({ req, fetch, accumulation, performAnAction }) => {
	return await Object.entries(fetch).reduce(async (accPromise: object, [ key, action ]) => {
		const acc = await accPromise;

		acc[key] = await performAnAction(action, req, acc);

		return acc;
	}, Promise.resolve(accumulation));
};

// Fulfill all

interface IFulfillFetchProps {
	req: any;
	fetch: FetchWithProcessedActions;
	performAnAction(action: Action<any>, req: any, accumulation?: any): any;
}

type FulfillFetch = (props: IFulfillFetchProps) => Promise<object>;

/* Startpoint */
export const fulfillFetch: FulfillFetch = async ({ req, fetch, performAnAction }) => {
	const { parallel, queue } = sortFetch(fetch);

	const parallelResult = await fulfillParallelFetch({ req, fetch: parallel, performAnAction });
	return await fulfillQueuePrepares({ req, fetch: queue, accumulation: parallelResult, performAnAction });
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