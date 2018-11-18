import { actionCreator, actionCreatorForHttp, actionCreatorForExpress } from '../action';
import { PayloadMiddleware, ActionOptions, HttpReq, ExpressReq } from '../interface';

describe('initializeActionCreator', () => {
	describe('Without options', () => {
		it('Payload is boolean', () => {
			const type = 'type';
			const payload = true;
	
			const action = actionCreator<boolean, string, HttpReq>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});
		
		it('Payload is number', () => {
			const type = 'type';
			const payload = 9;
	
			const action = actionCreatorForExpress<number, boolean>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});

		it('Payload is string', () => {
			const type = 'type';
			const payload = 'foo - bar';
	
			const action = actionCreatorForHttp<string, string>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});
	
		it('Payload is object', () => {
			const type = 'type';
			const payload = { foo: 'bar' };
	
			const action = actionCreatorForHttp<object, object>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});

		it('Payload is array', () => {
			const type = 'type';
			const payload = [ 'foo', 'bar' ];
	
			const action = actionCreator<string[], string, ExpressReq>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});

		// I think it makes no sense to check all types for wrapped payload
		it('Payload wrapped in middleware', () => {
			const type = 'type';
			const payload: PayloadMiddleware<string, HttpReq> = ({ ctx }) => ctx.pathname; // Will not be called

			const action = actionCreatorForHttp<string, number>(type);
			expect(action.type).toBe(type);

			const actionForFetch = action(payload);
			expect(actionForFetch).toEqual({ type, payload });
		});
	});

	describe('With options', () => {
		it('Payload is array', () => {
			const type = 'type';
			const payload = [ 'foo', 'bar' ];

			const options1: ActionOptions = {
				parallel: true,
			};
			const options2: ActionOptions = {
				passive: true,
			};	
			const options3: ActionOptions = {
				optional: true,
			};
			const options4: ActionOptions = {
				parallel: true,
				passive: true,
				optional: true,
			};
	
			const action = actionCreatorForHttp<string[], number>(type);
			expect(action.type).toBe(type);
	
			const actionForFetch1 = action(payload, options1);
			expect(actionForFetch1).toEqual({ type, payload, options: options1});

			const actionForFetch2 = action(payload, options2);
			expect(actionForFetch2).toEqual({ type, payload, options: options2 });

			const actionForFetch3 = action(payload, options3);
			expect(actionForFetch3).toEqual({ type, payload, options: options3 });

			const actionForFetch4 = action(payload, options4);
			expect(actionForFetch4).toEqual({ type, payload, options: options4 });
		});

		// I think it makes no sense to check all types for wrapped payload
		it('Payload wrapped in middleware', () => {
			const type = 'type';
			const payload: PayloadMiddleware<string, HttpReq> = ({ ctx }) => ctx.pathname; // Will not be called

			const options1: ActionOptions = {
				parallel: true,
			};
			const options2: ActionOptions = {
				passive: true,
			};
			const options3: ActionOptions = {
				optional: true,
			};
			const options4: ActionOptions = {
				parallel: true,
				passive: true,
				optional: true,
			};

			const action = actionCreatorForHttp<string, number>(type);
			expect(action.type).toBe(type);

			const actionForFetch1 = action(payload, options1);
			expect(actionForFetch1).toEqual({ type, payload, options: options1});

			const actionForFetch2 = action(payload, options2);
			expect(actionForFetch2).toEqual({ type, payload, options: options2 });

			const actionForFetch3 = action(payload, options3);
			expect(actionForFetch3).toEqual({ type, payload, options: options3 });

			const actionForFetch4 = action(payload, options3);
			expect(actionForFetch4).toEqual({ type, payload, options: options3 });
		});
	});

});