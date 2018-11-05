import * as React from 'react';

import loader from '../loader';
import withPrepare from '../withPrepare';
import { getCorrectAction } from '../_utils';
import { CustomStore, Ctx, Fetch, PayloadMiddlewareArguments, FetchWithProcessedActions } from '../../common/interface';

import App from '../__mocks__/pages/_app';
import { ctx } from '../__mocks__/constants';

// Pages
import { EmptyPage } from '../__mocks__/pages/Empty';
import { PageWithFetch } from '../__mocks__/pages/WithFetch';
import { PageWithFetchFresh } from '../__mocks__/pages/WithFetchFresh';
import { PageWithGetInitialProps } from '../__mocks__/pages/WithGetInitialProps';
import { PageWithFetchAndFetchFresh } from '../__mocks__/pages/WithFetch&FetchFresh';
import { PageWithGetInitialPropsAndFetch } from '../__mocks__/pages/WithGetInitialProps&Fetch';
import { PageWithGetInitialPropsAndFetchAndFetchFresh } from '../__mocks__/pages/WithGetInitialProps&Fetch&FetchFresh';

jest.mock('../loader');

const mockStore: CustomStore = {
	setInitialState: jest.fn(),
	getState: jest.fn().mockRejectedValue({}),
	setResult: jest.fn(),
};

// tslint:disable-next-line:max-line-length
const initGetPageProps = WrappedApp => async (Component: React.ComponentClass, context: Ctx) => (await WrappedApp.getInitialProps({ Component, ctx: context })).pageProps;

const getCorrectFetch = (fetch: Fetch, props: PayloadMiddlewareArguments) => {
	return Object.keys(fetch).reduce((acc, key) => {
		return { ...acc, [key]: getCorrectAction(fetch[key], props) };
	}, {});
};

const filterPassive = (fetch: FetchWithProcessedActions) => {
	return Object.keys(fetch).reduce((acc, key) => {
		if (fetch[key].options && fetch[key].options.passive) {
			return acc;
		}
		return { ...acc, [key]: fetch[key] };
	}, {});
};

describe('Test withPrepare', () => {
	const WrappedApp = withPrepare(mockStore)((App as any));
	const getPageProps = initGetPageProps(WrappedApp);

	describe('Check result page properties with fetch', () => {
		beforeEach(jest.resetAllMocks);
		const { Component, fetchResult } = PageWithFetch;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...fetchResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith(fetchResult);
		});

		describe('Client side', async () => {
			beforeEach(jest.resetAllMocks);
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch). The result of his called will be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult });

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch(Component.fetch, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith(fetchResult);
			});

			it('Having the result of fetch in the store does not occur to the loader', async () => {
				(mockStore.getState as any).mockReturnValueOnce(fetchResult);

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);

				expect(pagePropsResult).toEqual({ ...fetchResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).toBeCalledWith(fetchResult);
			});
		});

		describe('Server side', async () => {
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch). The result of his called will NOT be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult });

				const pagePropsResult = await getPageProps(Component, ctx.serverSide);
				const correctFetch = getCorrectFetch(Component.fetch, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchResult });
				expect(mockStore.getState).not.toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.serverSide, fetch: correctFetch });
				expect(mockStore.setResult).not.toBeCalled();
			});
		});
	});

	describe('Check result page properties without getInitialProps and fetch', () => {
		beforeEach(jest.resetAllMocks);
		const { Component } = EmptyPage;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: {},
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith({});
		});

		describe('Client side', () => {
			it('getState will be called and setResult will not', async () => {
				const pagePropsResult = await getPageProps(Component, ctx.clientSide);

				expect(pagePropsResult).toEqual({});
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
			});
		});

		describe('Server side', () => {
			it('getState and setResult will not be called', async () => {
				const pagePropsResult = await getPageProps(Component, ctx.serverSide);

				expect(pagePropsResult).toEqual({});
				expect(mockStore.getState).not.toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
			});
		});
	});

	describe('Check result page properties with getInitialProps', () => {
		beforeEach(jest.resetAllMocks);
		const { Component, getInitialPropsResult } = PageWithGetInitialProps;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...getInitialPropsResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp); 
			expect(mockStore.setInitialState).toBeCalledWith({});
		});

		describe('Client side', () => {
			// tslint:disable-next-line:max-line-length
			it('getState will be called and setResult will not, because the result of getInitialProps is not stored in the state', async () => {
				const pagePropsResult = await getPageProps(Component, ctx.clientSide);

				expect(pagePropsResult).toEqual(getInitialPropsResult);
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
			});
		});

		describe('Server side', () => {
			it('getState and setResult will not be called', async () => {
				const pagePropsResult = await getPageProps(Component, ctx.serverSide);

				expect(pagePropsResult).toEqual(getInitialPropsResult);
				expect(mockStore.getState).not.toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
			});
		});
	});

	describe('Check result page properties with getInitialProps and fetch', () => {
		beforeEach(jest.resetAllMocks);
		const { Component, fetchResult, getInitialPropsResult } = PageWithGetInitialPropsAndFetch;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...fetchResult, ...getInitialPropsResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith(fetchResult);
		});

		describe('Client side', () => {
			beforeEach(jest.resetAllMocks);
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch). The result of his called will be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce(fetchResult);

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch(Component.fetch, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult });
				expect(mockStore.getState).toBeCalled();
				expect(mockStore.setResult).toBeCalledWith(fetchResult);
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch});
			});

			it('Having the result of preparation in the store does not occur to the loader', async () => {
				(mockStore.getState as any).mockReturnValueOnce(fetchResult);

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).not.toBeCalled();
				expect(mockStore.setResult).toBeCalledWith(fetchResult);
			});
		});

		describe('Server side', () => {
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch) array. The result of his called will NOT be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce(fetchResult);

				const pagePropsResult = await getPageProps(Component, ctx.serverSide);
				const correctFetch = getCorrectFetch(Component.fetch, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult });
				expect(mockStore.getState).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.serverSide, fetch: correctFetch });
			});
		});
	});

	describe('Check result page properties with fetchFresh', () => {
		beforeEach(jest.resetAllMocks);
		const { Component, fetchFreshResult } = PageWithFetchFresh;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...fetchFreshResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith(fetchFreshResult);
		});

		describe('Client side', () => {
			beforeEach(jest.resetAllMocks);
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetchFresh) array. The result of his called will be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch(Component.fetchFresh, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchFreshResult });
			});

			it('The result from the store will be ignored and a request for a new result will be made', async () => {
				(mockStore.getState as any).mockReturnValueOnce({ ...fetchFreshResult });
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch(Component.fetchFresh, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchFreshResult });
			});
		});

		describe('Server side', () => {
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetchFresh) array. The result of his called will NOT be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.serverSide);
				const correctFetch = getCorrectFetch(Component.fetchFresh, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchFreshResult });
				expect(mockStore.getState).not.toBeCalled();
				expect(mockStore.setResult).not.toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.serverSide, fetch: correctFetch });
			});
		});
	});

	describe('Check result page properties with fetch and fetchFresh', () => {
		beforeEach(jest.resetAllMocks);
		const { Component, fetchResult, fetchFreshResult } = PageWithFetchAndFetchFresh;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...fetchResult, ...fetchFreshResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
		});

		describe('Client side', () => {
			beforeEach(jest.resetAllMocks);
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch and fetchFresh) array. The result of his called will be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch({ ...Component.fetch, ...Component.fetchFresh }, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
			});
			// tslint:disable-next-line:max-line-length
			it('A request will be made to get a new result on prepareFresh. And the result of prepare will be taken from the store', async () => {
				(mockStore.getState as any).mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });
				loader.get = jest.fn().mockReturnValueOnce(fetchFreshResult);

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch(Component.fetchFresh, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
			});
		});

		describe('Server side', () => {
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (prepareFresh and prepareFresh) array. The result of his called will NOT be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.serverSide);
				const correctFetch = getCorrectFetch({ ...Component.fetch, ...Component.fetchFresh }, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).not.toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.serverSide, fetch: correctFetch });
				expect(mockStore.setResult).not.toBeCalled();
			});
		});
	});

	describe('Check result page properties with getInitialProps, fetch and fetchFresh', () => {
		beforeEach(jest.resetAllMocks);
		const {
			Component,
			getInitialPropsResult,
			fetchResult,
			fetchFreshResult,
			fetchResultWithoutPassive,
		} = PageWithGetInitialPropsAndFetchAndFetchFresh;

		it('Constructor', () => {
			const result = new WrappedApp({
				Component,
				pageProps: { ...getInitialPropsResult, ...fetchResult, ...fetchFreshResult },
				err: null,
			});

			expect(result).toBeInstanceOf(WrappedApp);
			expect(mockStore.setInitialState).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
		});

		describe('Client side', () => {
			beforeEach(jest.resetAllMocks);
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (fetch and fetchFresh). The result of his called will be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				// This page contains a passive action
				const correctFetch = filterPassive(
					getCorrectFetch({ ...Component.fetch, ...Component.fetchFresh }, {
						ctx: ctx.clientSide,
						pageProps: {},
					}),
				);

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
			});
			// tslint:disable-next-line:max-line-length
			it('A request will be made to get a new result on fetchFresh. And the result is fetched taken from the store, and the result is added from getInitialProps', async () => {
				(mockStore.getState as any).mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });
				loader.get = jest.fn().mockReturnValueOnce(fetchFreshResult);

				const pagePropsResult = await getPageProps(Component, ctx.clientSide);
				const correctFetch = getCorrectFetch({ ...Component.fetchFresh }, {
					ctx: ctx.clientSide,
					pageProps: {},
				});

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.clientSide, fetch: correctFetch });
				expect(mockStore.setResult).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
			});
		});

		describe('Server side', () => {
			// tslint:disable-next-line:max-line-length
			it('The loader will be invoked with context arguments and an actions (prepare & prepareFresh) array. The result of his called will NOT be recorded in the store', async () => {
				loader.get = jest.fn().mockReturnValueOnce({ ...fetchResult, ...fetchFreshResult });

				const pagePropsResult = await getPageProps(Component, ctx.serverSide);
				// This page contains a passive action
				const correctFetch = filterPassive(
					getCorrectFetch({ ...Component.fetch, ...Component.fetchFresh }, {
						ctx: ctx.clientSide,
						pageProps: {},
					}),
				);

				expect(pagePropsResult).toEqual({ ...getInitialPropsResult, ...fetchResult, ...fetchFreshResult });
				expect(mockStore.getState).not.toBeCalled();
				expect(loader.get).toBeCalledWith({ ctx: ctx.serverSide, fetch: correctFetch });
				expect(mockStore.setResult).not.toBeCalled();
			});
		});
	});
});