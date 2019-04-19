import store from '../store';

const delay = () => new Promise(resolve => setTimeout(resolve)); // delay 0

const middleware1 = jest.fn(result => ({ ...result, middleware1: 'value' }));
const middleware2 = jest.fn(async result => ({
	...result,
	middleware_2: 'value',
}));

const subscribe1 = jest.fn();
const subscribe2 = jest.fn();
const subscribe3 = jest.fn();

const mockResult = { foo: 'bar' };

const mockResultAfterMiddleware1 = { ...mockResult, middleware1: 'value' };
const mockResultAfterMiddleware2 = {
	...mockResultAfterMiddleware1,
	middleware_2: 'value',
};

describe('Test store', () => {
	it('Сheck on the need for a subscription', () => {
		expect(store.needToSubscribe).toBe(true);
	});

	it('Subscribe to updates', () => {
		const result = store
			.subscribe(subscribe1)
			.subscribe(subscribe2)
			.subscribe(subscribe3);

		expect(result).toBe(store);
	});

	it('Unsubscribe', () => {
		const result = store
			.unsubscribe(subscribe2);

		expect(result).toBe(store);
	});

	it('Add middlewares', () => {
		const result = store
			.addMiddleware(middleware1)
			.addMiddleware(middleware2);

		expect(result).toBe(store);
	});

	it('Set result to store after processing with middlewares and notify all subscriptions', async () => {
		const result = store.setResult(mockResult);

		expect(result).toBe(store);

		await delay();

		expect(middleware1).toBeCalledWith(mockResult);
		expect(middleware2).toBeCalledWith(mockResultAfterMiddleware1);

		expect(subscribe1).toBeCalledWith(mockResultAfterMiddleware2);
		expect(subscribe2).not.toBeCalled(); // Unsubscribed
		expect(subscribe3).toBeCalledWith(mockResultAfterMiddleware2);
	});

	it('Get state', () => {
		const result = store.getState();

		expect(result).toEqual(mockResultAfterMiddleware2);
	});
});
