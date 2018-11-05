import * as loader from '../loader';
import { FetchWithProcessedActions } from '../../common/interface';

import { ctx } from '../__mocks__/constants';
import {
	SimpleAction,
	ParallelAction,
	PassiveAction,
} from '../../common/__mocks__/actions';

jest.unmock('../loader');

const fetch: FetchWithProcessedActions = {
	simple: SimpleAction.action,
	parallel: ParallelAction.action,
	passive: PassiveAction.action,
};

const response = { simple: 44, two: 'd' };

describe('Test loader', () => {
	describe('Check get', () => {
		it('Server side', async () => {
			ctx.serverSide.req.fulfillFetch = jest.fn().mockReturnValue(response);

			const result = await loader.get({ fetch, ctx: ctx.serverSide });

			expect(result).toBe(response);
			expect(ctx.serverSide.req.fulfillFetch).toBeCalledWith({ fetch });
		});

		it('Client side', async () => {
			(loader.request as any) = jest.fn().mockReturnValue(response);
			const result = await loader.get({ fetch, ctx: ctx.clientSide });

			expect(result).toBe(response);
			expect(loader.request).toBeCalledWith(fetch);
		});
	});
});