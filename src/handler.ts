import {
	Action,
	ActionCreator,
	HandlerFunction,
	ActionErrorHandler,
	NextPrepareContext,
	FetchСontainingProcessedActions,
} from './interface';

import { sortFetch, initCallHandler } from './_utils';

class Handler {
	private static instance: Handler;

	public static get Instance() {
		return this.instance || (this.instance = new this());
	}

	private handlers = {} as {
		[key: string]: HandlerFunction<any, any, any>;
	};

	public on = <P, R, Req>(
		action: ActionCreator<P, R, Req>,
		handler: HandlerFunction<P, R, Req>,
		resubscribe?: boolean,
	) => {
		if (!resubscribe && this.handlers[action.type]) {
				throw new Error(`${action.type} function already set.`);
		}

		this.handlers[action.type] = handler;
		return this;
	}

	public process = <Req>(action: Action<any>, ctx: NextPrepareContext<Req>, accumulation?) => {

		if (!this.handlers[action.type]) {
				throw new Error(`Handler with type ${action.type} is missing.`);
		}

		return this.handlers[action.type]({ action, ctx, accumulation });
	}

	public fulfillFetch = async <Req>(props: {
		ctx: NextPrepareContext<Req>;
		fetch: FetchСontainingProcessedActions;
	}) => {
		const { parallel, queue } = sortFetch(props.fetch);
	
		const accumulation = {};
	
		const callHandler = initCallHandler(props.ctx, this.process);
	
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
	}
}

export default Handler.Instance;