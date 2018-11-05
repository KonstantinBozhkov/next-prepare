import { ActionOptions, ActionCreator, RawAction, PayloadMiddleware } from './interface';

const initializeActionCreator = <P = any, R = any>(type: string): ActionCreator<P, R> => {
	
	interface ICreator {
		(): RawAction<P>;
		type: string;
		result: R;
	}

	// tslint:disable-next-line:only-arrow-functions
	const f = function(
		payload: P|PayloadMiddleware<P>,
		options?: ActionOptions,
	): RawAction<P> {
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