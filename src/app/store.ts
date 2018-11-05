import { CustomStore } from '../common/interface';

class Store implements CustomStore {
	private static instance: Store;

	public static get Instance() {
		return this.instance || (this.instance = new this());
	}

	private state = {};
	private middlewares = [];
	private subscribers = [];

	public subscribe = f => {
		this.subscribers.push(f);
		return this;
	}

	public addMiddleware = f => {
		this.middlewares.push(f);
		return this;
	}

	public setInitialState = (state: object) => {
		this.state = { ...state };
		return this;
	}

	public setResult = prepareResult => {
		(async () => {
			const finalResult = await this.middlewares.reduce(
				async (accPromise, middleware) => {
					const acc = await accPromise;
					return middleware(acc);
				},
				Promise.resolve(prepareResult),
			); // Called all middleware

			Object.assign(this.state, finalResult); // Mutation state

			this.subscribers.forEach(f => f(this.state)); // Called all subscribers
		})();

		return this;
	}

	public getState = () => ({ ...this.state });
}

export default Store.Instance;
