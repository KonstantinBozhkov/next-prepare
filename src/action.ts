import {
	RawAction,
	ActionCreator,
	ActionOptions,
	PayloadMiddleware,
} from './interface';

const initializeActionCreator = <P = any, R = any, Req = any>(type: string): ActionCreator<P, R, Req> => {
	
	interface ICreator {
		(): RawAction<P, Req>;
		type: string;
		result: R;
	}

	// tslint:disable-next-line:only-arrow-functions
	const f = function(
		payload: P | PayloadMiddleware<P, Req>,
		options?: ActionOptions,
	): RawAction<P, Req> {
		return {
			type,
			payload,
			options,
		};
	} as ICreator;

	f.type = type;

	return f;
};

export const actionCreator = initializeActionCreator;