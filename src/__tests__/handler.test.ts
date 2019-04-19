import handler from '../handler';
import { actionCreator } from '../action';
import { HttpReq, ExpressReq, RawAction, NextPrepareContext } from '../interface';
import { ctx } from '../__mocks__/constants';
import { SimpleAction, ParallelAction, PassiveAction, OptionalAction } from '../__mocks__/actions';
import { getCorrectAction } from '../_utils';

const mockFunctionHandler = jest.fn()
	.mockReturnValueOnce(1)
	.mockReturnValueOnce(2)
	.mockReturnValueOnce(3);

const mockAccumulation = { this: 'accumulation' };

const actionCreator1 = actionCreator<string, any, HttpReq>('action1');
const action1 = actionCreator1('action1');

const actionCreator2 = actionCreator<number, any, ExpressReq>('action2');
const action2 = actionCreator2(885, { parallel: true, passive: true });

const actionCreator3 = actionCreator<any, any, ExpressReq>('action3');
const action3 = actionCreator3({});

const correctAction = <P, Req>(action: RawAction<P, Req>, prepareCtx: NextPrepareContext<Req>) =>
	getCorrectAction<Req>(action, { pageProps: {}, ctx: prepareCtx });

describe('handler', () => {
	it('Subscription handler by action without options', () => {
		handler.on(actionCreator1, mockFunctionHandler);
		const result = handler.process(action1, ctx.clientSide, mockAccumulation);

		expect(mockFunctionHandler).toBeCalledWith({
			action: action1,
			ctx: ctx.clientSide,
			accumulation: mockAccumulation,
		});
		expect(result).toBe(1);
	});

	it('Subscription handler by action with options', () => {
		handler.on(actionCreator2, mockFunctionHandler);
		const result = handler.process(action2, ctx.serverSide, mockAccumulation);

		expect(mockFunctionHandler).toBeCalledWith({
			action: action2,
			ctx: ctx.serverSide,
			accumulation: mockAccumulation,
		});
		expect(result).toBe(2);
	});

	it('Error when re-subscribing by one actionCreator', () => {
		let err;
		try {
			handler.on(actionCreator1, mockFunctionHandler);
		} catch (error) {
			err = error;
		}
		expect(err).toEqual(
			new Error(`${actionCreator1.type} function already set.`),
		);
	});

	it('Error when contacting for undue action', () => {
		let err;
		try {
			handler.process(action3, ctx.clientSide, mockAccumulation);
		} catch (error) {
			err = error;
		}
		expect(err).toEqual(
			new Error(`Handler with type ${action3.type} is missing.`),
		);
	});

	describe('Test collision', () => {
		beforeEach(jest.resetAllMocks);

		it('Collision subscribe methods', () => {
			const handler1 = () => null;
			const handler2 = () => 0;

			const actionCrt = actionCreator('collision');
			const action = actionCrt(undefined);

			handler
				.on(actionCrt, handler1)
				.on(actionCrt, handler2, true);
			
			const result = handler.process(action, ctx.clientSide, {});
	
			expect(result).toEqual(0);
		});
	});
	
	describe('fulfillFetch', () => {
		beforeEach(jest.resetAllMocks);

		const simpleHandler = jest.fn();
		const passiveHandler = jest.fn();
		const parallelHandler = jest.fn();
		const optionalHandler = jest.fn();

		handler
			.on(SimpleAction.actionCreator, simpleHandler)
			.on(PassiveAction.actionCreator, passiveHandler)
			.on(ParallelAction.actionCreator, parallelHandler)
			.on(OptionalAction.actionCreator, optionalHandler);

		it('The action will be transmitted in performAnAction with req and empty accumulation', async () => {
			const simpleResult = { d: 0 };
			
			simpleHandler.mockResolvedValueOnce(simpleResult);

			const result = await handler.fulfillFetch({
				ctx: ctx.clientSide,
				fetch: { simple: SimpleAction.action },
			});

			expect(result).toEqual({ simple: simpleResult });
		});

		it('The result of parallel execution will be transmitted as accumulation', async () => {
			const simpleResult = { d: 0 };
			const parallelResult = 'parallel';

			simpleHandler.mockResolvedValueOnce(simpleResult);
			parallelHandler.mockResolvedValueOnce(parallelResult);
			
			const result = await handler.fulfillFetch({
				ctx: ctx.clientSide,
				fetch: {
					parallel: ParallelAction.action,
					simple: SimpleAction.action,
				},
			});
			
			expect(result).toEqual({
				parallel: parallelResult,
				simple: simpleResult,
			});
		});

		// tslint:disable-next-line:max-line-length
		it('The results of parallel executions will be transmitted when invoking normal actions in accumulation. Challenges to normal actions will be added to accumulation.', async () => {
			const parallelResult1 = 'parallel1';
			const parallelResult2 = 'parallel2';
			const passiveResult = 43432;
			const simpleResult = {};

			parallelHandler
				.mockResolvedValueOnce(parallelResult1)
				.mockResolvedValueOnce(parallelResult2);

			passiveHandler
				.mockResolvedValueOnce(passiveResult);

			simpleHandler
				.mockResolvedValueOnce(simpleResult);

			const result = await handler.fulfillFetch({
				ctx: ctx.clientSide,
				fetch: {
					passive: PassiveAction.action, // 3
					simple: SimpleAction.action, // 4
					parallel1: ParallelAction.action, // 1
					parallel2: ParallelAction.action, // 2
				},
			});

			// Parallel action will be triggered without accumulation.
			expect(parallelHandler.mock.calls[0]).toEqual([
				{ action: ParallelAction.action, ctx: ctx.clientSide, accumulation: undefined },
			]);
			expect(parallelHandler.mock.calls[1]).toEqual([
				{ action: ParallelAction.action, ctx: ctx.clientSide, accumulation: undefined },
			]);

			// The result of parallel is transferred to accumulation
			expect(passiveHandler.mock.calls[0]).toEqual([
				{
					action: PassiveAction.action,
					ctx: ctx.clientSide,
					accumulation: {
						parallel1: parallelResult1,
						parallel2: parallelResult2,
					},
				},
			]);
			expect(simpleHandler.mock.calls[0]).toEqual([
				{
					action: SimpleAction.action,
					ctx: ctx.clientSide,
					accumulation: {
						parallel1: parallelResult1,
						parallel2: parallelResult2,
						passive: passiveResult, // Performing the previous action (passive)
					},
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

			simpleHandler.mockReturnValueOnce(Promise.reject(error));

			try {
				await handler.fulfillFetch({
					ctx: ctx.clientSide,
					fetch: {
						simple1: SimpleAction.action,
						simple2: SimpleAction.action,
					},
				});
			} catch (error) {
				caughtError = error;
			}

			expect(simpleHandler.mock.calls[0]).toEqual([
				{ action: SimpleAction.action, ctx: ctx.clientSide, accumulation: {} },
			]);
			expect(simpleHandler.mock.calls[1]).toBe(undefined); // TODO: Bug?
			expect(caughtError).toBe(error);
		});

		// tslint:disable-next-line:max-line-length
		it('If the action is not required, then the error will be ignored. And the result of such an action would be null.', async () => {
			const simpleResult1 = { d: 0 };
			const simpleResult2 = { p: 9 };
	
			simpleHandler.mockReturnValueOnce(Promise.resolve(simpleResult1));
			optionalHandler.mockReturnValueOnce(Promise.reject(new Error('Any error')));
			simpleHandler.mockReturnValueOnce(Promise.resolve(simpleResult2));
	
			const result = await handler.fulfillFetch({
				ctx: ctx.clientSide,
				fetch: {
					simple1: SimpleAction.action, // 1
					optional: OptionalAction.action, // 2
					simple2: SimpleAction.action, // 3
				},
			});
	
			expect(simpleHandler.mock.calls[0]).toEqual([
				{
					action: SimpleAction.action,
					ctx: ctx.clientSide,
					accumulation: {},
				},
			]);
			expect(optionalHandler.mock.calls[0]).toEqual([
				{
					action:  OptionalAction.action,
					ctx: ctx.clientSide,
					accumulation: {
						simple1: simpleResult1,
					},
				},
			]);
			expect(simpleHandler.mock.calls[1]).toEqual([
				{
					action: SimpleAction.action,
					ctx: ctx.clientSide,
					accumulation: {
						simple1: simpleResult1,
						optional: null,
					},
				},
			]);

			expect(result).toEqual({
				simple1: simpleResult1,
				optional: null,
				simple2: simpleResult2,
			});
		});
	});
});