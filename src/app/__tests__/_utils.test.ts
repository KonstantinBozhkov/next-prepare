import { getCorrectAction } from '../_utils';
import { PayloadMiddlewareArguments } from '../../common/interface';

import {
	SimpleAction,
	ParallelAction,
	PassiveAction,
	ActionWithPayloadMiddleware,
} from '../../common/__mocks__/actions';
import { ctx } from '../__mocks__/constants';

const mockArguments: PayloadMiddlewareArguments = {
	ctx: ctx.clientSide,
	pageProps: {},
};

describe('app/_utils', () => {
	describe('getCorrectAction', () => {
		describe('SimpleAction', () => {
			const { actionCreator, actionCreatorFields, action, actionFields } = SimpleAction;
			it('Convert actionCreator to action', () => {
				expect(
					getCorrectAction(actionCreator, mockArguments),
				).toEqual(actionCreatorFields);
			});

			it('Will return unchanged action', () => {
				expect(
					getCorrectAction(action, mockArguments),
				).toEqual(actionFields);
			});
		});

		describe('ParallelAction', () => {
			const { actionCreator, actionCreatorFields, action, actionFields } = ParallelAction;
			it('Convert actionCreator to action', () => {
				expect(
					getCorrectAction(actionCreator, mockArguments),
				).toEqual(actionCreatorFields);
			});

			it('Will return unchanged action', () => {
				expect(
					getCorrectAction(action, mockArguments),
				).toEqual(actionFields);
			});
		});

		describe('PassiveAction', () => {
			const { actionCreator, actionCreatorFields, action, actionFields } = PassiveAction;
			it('Convert actionCreator to action', () => {
				expect(
					getCorrectAction(actionCreator, mockArguments),
				).toEqual(actionCreatorFields);
			});

			it('Will return unchanged action', () => {
				expect(
					getCorrectAction(action, mockArguments),
				).toEqual(actionFields);
			});
		});

		describe('ActionWithPayloadMiddleware', () => {
			const {
				action,
				actionFields,
				actionCreator,
				actionCreatorFields,
				payloadMiddleware,
			} = ActionWithPayloadMiddleware;
			it('Convert actionCreator to action', () => {
				expect(
					getCorrectAction(actionCreator, mockArguments),
				).toEqual(actionCreatorFields);
			});

			it('Will execute middleware, and the result of execution will add in action', () => {
				expect(
					getCorrectAction(action, mockArguments),
				).toEqual(actionFields);
				expect(payloadMiddleware).toBeCalledWith(mockArguments);
			});
		});

		// TODO: Add throws
	});

	// TODO: Add test checkValidAction
});