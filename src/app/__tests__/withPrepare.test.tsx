import * as React from 'react';
import { mount } from 'enzyme';

import loader from '../loader';
import withPrepare from '../withPrepare';
import { getCorrectAction } from '../_utils';
import {
	CustomStore,
	HttpReq,
	Fetch,
	NextPrepareContext,
	PayloadMiddlewareArguments,
	FetchСontainingProcessedActions,
} from '../../common/interface';

import App from '../__mocks__/pages/_app';
import { ctx, mockRouter } from '../__mocks__/constants';

// Pages
import { EmptyPage } from '../__mocks__/pages/Empty';
import { PageWithFetch } from '../__mocks__/pages/WithFetch';
import { PageWithFetchFresh } from '../__mocks__/pages/WithFetchFresh';
import { PageWithGetInitialProps } from '../__mocks__/pages/WithGetInitialProps';
import { PageWithFetchAndFetchFresh } from '../__mocks__/pages/WithFetch&FetchFresh';
import { PageWithGetInitialPropsAndFetch } from '../__mocks__/pages/WithGetInitialProps&Fetch';
import { PageWithGetInitialPropsAndFetchAndFetchFresh } from '../__mocks__/pages/WithGetInitialProps&Fetch&FetchFresh';

jest.mock('../loader');

// Store
const createMockStore = (needToSubscribe = false): CustomStore => ({
	needToSubscribe,
	subscribe: jest.fn(),
	unsubscribe: jest.fn(),
	setInitialState: jest.fn(),
	getState: jest.fn().mockRejectedValue({}),
	setResult: jest.fn(),
});

type InitGetPageProps = (Wrapped) =>
	<Req>(Component: React.ComponentType, context: NextPrepareContext<Req>) => Promise<any>;
// tslint:disable-next-line:max-line-length
const initGetPageProps: InitGetPageProps = Wrapped => async (Component, context) => (await Wrapped.getInitialProps({ Component, ctx: context })).pageProps;

const getCorrectFetch = (fetch: Fetch, props: PayloadMiddlewareArguments<HttpReq>) => {
	return Object.keys(fetch).reduce((acc, key) => {
		return { ...acc, [key]: getCorrectAction(fetch[key], props) };
	}, {});
};

const filterPassive = (fetch: FetchСontainingProcessedActions) => {
	return Object.keys(fetch).reduce((acc, key) => {
		if (fetch[key].options && fetch[key].options.passive) {
			return acc;
		}
		return { ...acc, [key]: fetch[key] };
	}, {});
};

// EmptyPage
describe('Check result page properties without getInitialProps and fetch', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component } = EmptyPage;

	describe('Getting page props', () => {
		beforeEach(jest.resetAllMocks);

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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={ {} }
				/>,
			);

			expect(mockStore.setInitialState).toBeCalledWith({});
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithGetInitialProps
describe('Check result page properties with getInitialProps', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component, getInitialPropsResult } = PageWithGetInitialProps;

	describe('Getting page props', () => {
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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={ getInitialPropsResult }
				/>,
			);
			const page = wrapper.find(Component);

			expect(mockStore.setInitialState).toBeCalledWith({});
			expect(page.props()).toEqual(getInitialPropsResult);
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithFetch
describe('Check result page properties with fetch', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component, fetchResult } = PageWithFetch;

	describe('Getting page props', () => {
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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={ fetchResult }
				/>,
			);
			const page = wrapper.find(Component);

			expect(mockStore.setInitialState).toBeCalledWith(fetchResult);
			expect(page.props()).toEqual(fetchResult);
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithGetInitialPropsAndFetch
describe('Check result page properties with getInitialProps and fetch', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component, fetchResult, getInitialPropsResult } = PageWithGetInitialPropsAndFetch;

	describe('Getting page props', () => {
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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={ { ...fetchResult, ...getInitialPropsResult } }
				/>,
			);
			const page = wrapper.find(Component);

			expect(mockStore.setInitialState).toBeCalledWith(fetchResult);
			expect(page.props()).toEqual({ ...fetchResult, ...getInitialPropsResult });
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithFetchFresh
describe('Check result page properties with fetchFresh', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component, fetchFreshResult } = PageWithFetchFresh;

	describe('Getting page props', () => {
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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={ fetchFreshResult }
				/>,
			);
			const page = wrapper.find(Component);

			expect(mockStore.setInitialState).toBeCalledWith(fetchFreshResult);
			expect(page.props()).toEqual(fetchFreshResult);
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithFetchAndFetchFresh
describe('Check result page properties with fetch and fetchFresh', () => {
	beforeEach(jest.resetAllMocks);

	const mockStore = createMockStore();
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const { Component, fetchResult, fetchFreshResult } = PageWithFetchAndFetchFresh;

	describe('Getting page props', () => {
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

	describe('Lifecycle', () => {
		it('Mount', () => {
			const wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={{ ...fetchResult, ...fetchFreshResult }}
				/>,
			);
			const page = wrapper.find(Component);

			expect(mockStore.setInitialState).toBeCalledWith({ ...fetchResult, ...fetchFreshResult });
			expect(page.props()).toEqual({ ...fetchResult, ...fetchFreshResult });
			expect(wrapper).toMatchSnapshot();
		});
	});
});

// PageWithGetInitialPropsAndFetchAndFetchFresh
describe('Check result page properties with getInitialProps, fetch and fetchFresh', () => {
	
	const mockStore = createMockStore(true); // With subscribe
	const WrappedApp = withPrepare(mockStore)(App);
	const getPageProps = initGetPageProps(WrappedApp);
	const {
		Component,
		getInitialPropsResult,
		fetchResult,
		fetchFreshResult,
		fetchResultWithoutPassive,
	} = PageWithGetInitialPropsAndFetchAndFetchFresh;

	describe('Getting page props', () => {
		beforeEach(jest.resetAllMocks);

		describe('Client side', () => {
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

	describe('Lifecycle', () => {
		jest.resetAllMocks();
		let wrapper;
		let page;

		it('Mount', () => {
			wrapper = mount(
				<WrappedApp
					Component={ Component }
					router={ mockRouter }
					pageProps={{ ...getInitialPropsResult, ...fetchResultWithoutPassive, ...fetchFreshResult }}
				/>,
			);
			page = wrapper.find(Component);

			expect((mockStore.setInitialState as any).mock.calls[0])
				.toEqual([{ ...fetchResultWithoutPassive, ...fetchFreshResult }]);

			// Without passive
			expect(page.props())
				.toEqual({
					...getInitialPropsResult,
					...fetchResultWithoutPassive,
					...fetchFreshResult,
				});

			expect(wrapper).toMatchSnapshot();
		});
		
		it('Rerender with updated page props', async () => {
			// Since the component is subscribed to the changes, we pass in new parameters to it.
			(mockStore.subscribe as any).mock.calls[0][0]({
				...fetchResult, // With passive
				...fetchFreshResult,
			});
			
			wrapper.update(); // Need to call this method to update
			page = wrapper.find(Component);

			// With passive
			expect(page.props())
				.toEqual({
					...getInitialPropsResult,
					...fetchResult,
					...fetchFreshResult,
				});
		});
	});
});