import {
	HttpReq,
	RawAction,
	ExpressReq,
	ActionCreator,
	ActionOptions,
	PayloadMiddleware,
} from './interface';

export {
	HttpReq,
	RawAction,
	ExpressReq,
	ActionCreator,
	ActionOptions,
	PayloadMiddleware,
};

const initializeActionCreator = <P, R, Req>(type: string): ActionCreator<P, R, Req> => {
	
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

export default initializeActionCreator;

export const actionCreator = initializeActionCreator;
export const actionCreatorForHttp = <P, R>(type: string) => initializeActionCreator<P, R, HttpReq>(type);
export const actionCreatorForExpress = <P, R>(type: string) => initializeActionCreator<P, R, ExpressReq>(type);