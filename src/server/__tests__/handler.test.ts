import handler from '../handler';
import { actionCreator, HttpReq, ExpressReq } from '../../common/action';

const mockFunctionHandler = jest.fn()
	.mockReturnValueOnce(1)
	.mockReturnValueOnce(2)
	.mockReturnValueOnce(3);

const mockReq = { this: 'req' };
const mockAccumulation = { this: 'accumulation' };

const actionCreator1 = actionCreator<string, any, HttpReq>('action1');
const action1 = actionCreator1('action1');

const actionCreator2 = actionCreator<number, any, ExpressReq>('action2');
const action2 = actionCreator2(885, { parallel: true, passive: true });

const actionCreator3 = actionCreator<any, any, ExpressReq>('action3');
const action3 = actionCreator3({});

describe('handler', () => {
	it('Subscription handler by action without options', () => {
		handler.on(actionCreator1, mockFunctionHandler);
		const result = handler.process(action1, mockReq, mockAccumulation);

		expect(mockFunctionHandler).toBeCalledWith({
			action: action1,
			req: mockReq,
			accumulation: mockAccumulation,
		});
		expect(result).toBe(1);
	});

	it('Subscription handler by action with options', () => {
		handler.on(actionCreator2, mockFunctionHandler);
		const result = handler.process(action2, mockReq, mockAccumulation);

		expect(mockFunctionHandler).toBeCalledWith({
			action: action2,
			req: mockReq,
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
			handler.process(action3, mockReq, mockAccumulation);
		} catch (error) {
			err = error;
		}
		expect(err).toEqual(
			new Error(`Handler with type ${action3.type} is missing.`),
		);
	});
});