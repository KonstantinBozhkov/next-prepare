import { CustomStore } from './interface';

class Store implements CustomStore {
	private static instance: Store;

	public static get Instance() {
		return this.instance || (this.instance = new this());
	}

	private state = {};
	private middlewares = [];
	private subscribers = [];
	public needToSubscribe = true;

	public subscribe = <S = any>(f: (state: S) => void): any => {
		this.subscribers.push(f);
		return this;
	}
	
	public unsubscribe = <S = any>(f: (state: S) => void): any => {
		this.subscribers = this.subscribers.filter(subscriber => subscriber !== f);
		return this;
	}

	public addMiddleware = f => {
		this.middlewares.push(f);
		return this;
	}

	public setInitialState = state => {
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
