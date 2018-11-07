/**
 * I do not use mockRejectedValue and mockResolvedValue, because it’s difficult to see the difference when reading
 */
import { fulfillFetch } from '../_utils';

import {
	SimpleAction,
	ParallelAction,
	PassiveAction,
	OptionalAction,
	// ActionWithPayloadMiddleware - it makes no sense to check, since the middleware will be executed on the client side
} from '../../common/__mocks__/actions';
import { ActionErrorHandler } from '../../common/interface';

const performAnAction = jest.fn();

const mockReq = { foo: 'bar' };

describe('server/_utils', () => {
	describe('fulfillFetch', () => {
		beforeEach(jest.resetAllMocks);

		it('The action will be transmitted in performAnAction with req and empty accumulation', async () => {
			const simpleResult = { d: 0 };

			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult));

			const result = await fulfillFetch({
				req: mockReq,
				fetch: { simple: SimpleAction.action },
				performAnAction,
			});

			expect(performAnAction).toBeCalledWith(SimpleAction.action, mockReq, {});
			expect(result).toEqual({ simple: simpleResult });
		});

		it('The result of parallel execution will be transmitted as accumulation', async () => {
			const parallelResult = { p: 22 };
			const simpleResult = { d: 0 };

			performAnAction.mockReturnValueOnce(Promise.resolve(parallelResult));
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult));

			const result = await fulfillFetch({
				req: mockReq,
				fetch: {
					parallel: ParallelAction.action,
					simple: SimpleAction.action,
				},
				performAnAction,
			});

			// Parallel action will be triggered without accumulation.
			expect(performAnAction.mock.calls[0]).toEqual([ ParallelAction.action, mockReq, undefined ]);

			// The result of parallel is transferred to accumulation
			expect(performAnAction.mock.calls[1]).toEqual([ SimpleAction.action, mockReq, { parallel: parallelResult } ]);
			
			expect(result).toEqual({
				parallel: parallelResult,
				simple: simpleResult,
			});
		});

		// tslint:disable-next-line:max-line-length
		it('The results of parallel executions will be transmitted when invoking normal actions in accumulation. Challenges to normal actions will be added to accumulation.', async () => {
			const parallelResult1 = { p: 22 };
			const parallelResult2 = { а: 99 };
			// This action (passive) should not go to the server, unless the user makes a mistake when using the loader.
			const passiveResult = { c: 'd' };
			const simpleResult = { d: 0 };

			performAnAction.mockReturnValueOnce(Promise.resolve(parallelResult1));
			performAnAction.mockReturnValueOnce(Promise.resolve(parallelResult2));
			performAnAction.mockReturnValueOnce(Promise.resolve(passiveResult));
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult));

			const result = await fulfillFetch({
				req: mockReq,
				fetch: {
					parallel1: ParallelAction.action,
					parallel2: ParallelAction.action,
					passive: PassiveAction.action,
					simple: SimpleAction.action,
				},
				performAnAction,
			});

			// Parallel action will be triggered without accumulation.
			expect(performAnAction.mock.calls[0]).toEqual([ ParallelAction.action, mockReq, undefined ]);
			expect(performAnAction.mock.calls[1]).toEqual([ ParallelAction.action, mockReq, undefined ]);

			// The result of parallel is transferred to accumulation
			expect(performAnAction.mock.calls[2]).toEqual([
				PassiveAction.action,
				mockReq,
				{
					parallel1: parallelResult1,
					parallel2: parallelResult2,
				},
			]);
			expect(performAnAction.mock.calls[3]).toEqual([
				SimpleAction.action,
				mockReq,
				{
					parallel1: parallelResult1,
					parallel2: parallelResult2,
					passive: passiveResult, // Performing the previous action (passive)
				},
			]);
			
			expect(result).toEqual({
				parallel1: parallelResult1,
				parallel2: parallelResult2,
				passive: passiveResult,
				simple: simpleResult,
			});
		});

		it('If an error occurs during the normal action, it will not be caught.', async () => {
			let caughtError;
			const error = new Error('ERROR');

			performAnAction.mockReturnValueOnce(Promise.reject(error));

			try {
				await fulfillFetch({
					req: mockReq,
					fetch: {
						simple1: SimpleAction.action,
						simple2: SimpleAction.action,
					},
					performAnAction,
				});
			} catch (error) {
				caughtError = error;
			}

			expect(performAnAction.mock.calls[0]).toEqual([ SimpleAction.action, mockReq, {} ]);
			expect(performAnAction.mock.calls[1]).toBe(undefined);
			expect(caughtError).toBe(error);
		});

		// tslint:disable-next-line:max-line-length
		it('If the action is not required, then the error will be ignored. And the result of such an action would be null.', async () => {
			const simpleResult1 = { d: 0 };
			const simpleResult2 = { p: 9 };
	
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult1));
			performAnAction.mockReturnValueOnce(Promise.reject(new Error('Any error')));
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult2));
	
			const result = await fulfillFetch({
				req: mockReq,
				fetch: {
					simple1: SimpleAction.action,
					optional: OptionalAction.action,
					simple2: SimpleAction.action,
				},
				performAnAction,
			});
	
			expect(performAnAction.mock.calls[0]).toEqual([
				SimpleAction.action,
				mockReq,
				{},
			]);
			expect(performAnAction.mock.calls[1]).toEqual([
				OptionalAction.action,
				mockReq,
				{
					simple1: simpleResult1,
				},
			]);
			expect(performAnAction.mock.calls[2]).toEqual([
				SimpleAction.action,
				mockReq,
				{
					simple1: simpleResult1,
					optional: null,
				},
			]);

			expect(result).toEqual({
				simple1: simpleResult1,
				optional: null,
				simple2: simpleResult2,
			});
		});

		it('Custom error handling actions. Instead, null will return 0', async () => {
			const simpleResult1 = { d: 0 };
			const simpleResult2 = { p: 9 };

			const actionErrorHandler = jest.fn().mockReturnValueOnce(0);

			const error = new Error('Any error');
	
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult1));
			performAnAction.mockReturnValueOnce(Promise.reject(error));
			performAnAction.mockReturnValueOnce(Promise.resolve(simpleResult2));
	
			const result = await fulfillFetch({
				req: mockReq,
				fetch: {
					simple1: SimpleAction.action,
					optional: OptionalAction.action,
					simple2: SimpleAction.action,
				},
				performAnAction,
				actionErrorHandler,
			});
	
			expect(performAnAction.mock.calls[0]).toEqual([
				SimpleAction.action,
				mockReq,
				{},
			]);
			expect(performAnAction.mock.calls[1]).toEqual([
				OptionalAction.action,
				mockReq,
				{
					simple1: simpleResult1,
				},
			]);
			expect(performAnAction.mock.calls[2]).toEqual([
				SimpleAction.action,
				mockReq,
				{
					simple1: simpleResult1,
					optional: 0,
				},
			]);

			expect(actionErrorHandler).toBeCalledWith(
				error,
				OptionalAction.action,
				mockReq,
				{
					simple1: simpleResult1,
				},
			);

			expect(result).toEqual({
				simple1: simpleResult1,
				optional: 0,
				simple2: simpleResult2,
			});
		});
	});
});