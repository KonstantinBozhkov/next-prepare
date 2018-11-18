import {
	Action,
	PayloadMiddlewareArguments,
	RawAction,
	HttpReq,
	ExpressReq,
	ActionCreator,
} from '../common/interface';

export const getCorrectAction = <Req extends HttpReq | ExpressReq>(
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

export const checkValidAction = action => {
	if (!action) {
		throw new Error('No action.');
	}

	if (typeof action.type !== 'string') {
		throw new Error('Action type must be a string.');
	}

	if (typeof action.payload === 'string') {
		throw new Error('Action payload cannot be a class or function.');
	}

	return action;
};
