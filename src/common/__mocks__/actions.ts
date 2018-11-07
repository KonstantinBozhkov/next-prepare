import initializeActionCreator from '../initializeActionCreator';
import { Action, PayloadMiddleware } from '../interface';

export namespace SimpleAction {
	export const payload = 545;

	export const actionCreator = initializeActionCreator<number>('SimpleAction');
	export const actionCreatorFields = { type: 'SimpleAction', payload: null };

	export const action = actionCreator(payload);
	export const actionFields: Action<number> = {
		type: 'SimpleAction',
		payload,
		options: { parallel: false, passive: false, optional: false },
	};
}

export namespace ParallelAction {
	export const payload = ['a', 'b', 'c'];

	export const actionCreator = initializeActionCreator<string[]>('ParallelAction');
	export const actionCreatorFields = { type: 'ParallelAction', payload: null };

	export const action = actionCreator(payload, { parallel: true });
	export const actionFields: Action<string[]> = {
		type: 'ParallelAction',
		payload,
		options: { parallel: true, passive: false, optional: false },
	};
}

export namespace PassiveAction {
	interface IPayload {
		firstName: string;
		lastName: string;
	}

	export const payload: IPayload = {
		firstName: 'Joe',
		lastName: 'Jonas',
	};

	export const actionCreator = initializeActionCreator<IPayload>('PassiveAction');
	export const actionCreatorFields = { type: 'PassiveAction', payload: null };

	export const action = actionCreator(payload, { passive: true });
	export const actionFields: Action<IPayload> = {
		type: 'PassiveAction',
		payload,
		options: { parallel: false, passive: true, optional: false },
	};
}

export namespace OptionalAction {
	interface IPayload {
		nickname: string;
	}

	export const payload: IPayload = {
		nickname: 'Noob',
	};

	export const actionCreator = initializeActionCreator<IPayload>('OptionalAction');
	export const actionCreatorFields = { type: 'OptionalAction', payload: null };

	export const action = actionCreator(payload, { optional: true });
	export const actionFields: Action<IPayload> = {
		type: 'OptionalAction',
		payload,
		options: { parallel: false, passive: false, optional: false },
	};
}

export namespace ActionWithPayloadMiddleware {
	interface IPayloadMiddlewareResult {
		title: string;
	}

	export const payloadMiddlewareResult: IPayloadMiddlewareResult = {
		title: 'Foo',
	};

	export const middleware: PayloadMiddleware<IPayloadMiddlewareResult> = () => {
		return payloadMiddlewareResult;
	};

	export const payloadMiddleware = jest.fn(middleware);

	export const actionCreator = initializeActionCreator<IPayloadMiddlewareResult>('ActionWithPayloadMiddleware');
	export const actionCreatorFields = { type: 'ActionWithPayloadMiddleware', payload: null };

	export const action = actionCreator(payloadMiddleware);
	export const actionFields: Action<IPayloadMiddlewareResult> = {
		type: 'ActionWithPayloadMiddleware',
		payload: payloadMiddlewareResult,
		options: { parallel: false, passive: false, optional: false },
	};
}