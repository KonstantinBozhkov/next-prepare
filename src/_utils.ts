import {
	Action,
	HttpReq,
	RawAction,
	ExpressReq,
	ActionCreator,
	PerformAnAction,
	ActionErrorHandler,
	PayloadMiddlewareArguments,
	FetchСontainingProcessedActions,
	NextPrepareContext,
} from './interface';

export const getCorrectAction = <Req>(
	rawAction: RawAction<any, Req> | ActionCreator<any, any, Req>,
	props: PayloadMiddlewareArguments<Req>,
): Action<any> => {
	// Action Creator
	if (typeof rawAction === 'function') {
		return {
			type: rawAction.type,
			payload: null,
		};
	}

	const options = rawAction.options
		? {
			parallel: !!rawAction.options.parallel, // coercion to the boolean value
			passive: !!rawAction.options.passive, // coercion to the boolean value
			optional: !!rawAction.options.optional, // coercion to the boolean value
		}
		: {
			parallel: false,
			passive: false,
			optional: false,
		};

	// Payload - function middleware
	if (typeof rawAction.payload === 'function') {
		const payloadResult = rawAction.payload(props);
		return { type: rawAction.type, payload: payloadResult, options };
	}

	return {
		type: rawAction.type,
		payload: rawAction.payload,
		options,
	};
};

export const sortFetch = (fetch: FetchСontainingProcessedActions) => {
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

export const initCallHandler = <Req>(
	ctx: NextPrepareContext<Req>,
	performAnAction: PerformAnAction,
	actionErrorHandler?: ActionErrorHandler,
) => {
	return async (action: Action<any>, accumulation?: any) => {
		try {
			return await performAnAction(action, ctx, accumulation);
		} catch (error) {
			if (actionErrorHandler) {
				return actionErrorHandler(error, action, ctx, accumulation);
			}

			if (!action.options || !action.options.optional) {
				throw error;
			}

			return null;
		}
	};
};