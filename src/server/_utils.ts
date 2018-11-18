import {
	Action,
	HttpReq,
	ExpressReq,
	PerformAnAction,
	FulfillFetchInReq,
	ActionErrorHandler,
	FetchСontainingProcessedActions,
} from '../common/interface';

const sortFetch = (fetch: FetchСontainingProcessedActions) => {
	const parallel: FetchСontainingProcessedActions = {};
	const queue: FetchСontainingProcessedActions = {};

	Object.entries(fetch).forEach(([key, action]) => {
		if (action.options && action.options.parallel) {
			parallel[key] = action;
		} else {
			queue[key] = action;
		}
	});

	return { parallel, queue };
};

const initCallHandler = (req: any, performAnAction: PerformAnAction, actionErrorHandler?: ActionErrorHandler) => {
	return async (action: Action<any>, accumulation?: any) => {
		try {
			return await performAnAction(action, req, accumulation);
		} catch (error) {
			if (actionErrorHandler) {
				return actionErrorHandler(error, action, req, accumulation);
			}

			if (!action.options || !action.options.optional) {
				throw error;
			}

			return null;
		}
	};
};

export const fulfillFetch = async <Req extends HttpReq | ExpressReq>(props: {
	req: Req;
	fetch: FetchСontainingProcessedActions;
	performAnAction: PerformAnAction;
	actionErrorHandler?: ActionErrorHandler;
}) => {
	const { parallel, queue } = sortFetch(props.fetch);

	const accumulation = {};

	const callHandler = initCallHandler(props.req, props.performAnAction, props.actionErrorHandler);

	// parallel
	await Promise.all(
		Object.entries(parallel).map( async ([key, action]) => {
			accumulation[key] = await callHandler(action);
		}),
	);

	// queue
	return await Object.entries(queue).reduce(async (accPromise: object, [ key, action ]) => {
		const acc = await accPromise;
		let result = null;

		result = await callHandler(action, acc);

		return { ...acc, [key]: result };
	}, Promise.resolve(accumulation));
};

const initFulfillFetchInReq = <Req extends HttpReq | ExpressReq>(props: {
	req: Req;
	performAnAction: PerformAnAction;
	actionErrorHandler?: ActionErrorHandler;
}): FulfillFetchInReq => fetch => fulfillFetch({ ...props, fetch });

export const bindFulfillFetchToReq = <Req extends HttpReq | ExpressReq>(props: {
	req: Req;
	performAnAction: PerformAnAction;
	actionErrorHandler?: ActionErrorHandler;
}): Req => {
	(props.req as any).fulfillFetch = initFulfillFetchInReq<Req>(props);
	return props.req as any; // TODO: Need refactor
};

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