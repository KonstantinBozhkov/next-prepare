import { ActionCreator, HandlerFunction, Action } from '../common/interface';

class Handler {
	private static instance: Handler;

	public static get Instance() {
		return this.instance || (this.instance = new this());
	}

	private handlers = {} as {
			[key: string]: HandlerFunction<any, any>;
	};

	public on = <P, R>(action: ActionCreator<P, R>, handler: HandlerFunction<P, R> ) => {
		if (this.handlers[action.type]) {
				throw new Error(`${action.type} function already set.`);
		}

		this.handlers[action.type] = handler;
		return this;
	}

	public process = (action: Action<any>, req, accumulation?) => {
		if (!this.handlers[action.type]) {
				throw new Error(`Handler with type ${action.type} is missing.`);
		}

		return this.handlers[action.type]({ action, req, accumulation });
	}
}

export default Handler.Instance;