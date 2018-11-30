import * as React from 'react';
import { DefaultAppIProps, AppProps } from 'next/app';

import {
	Fetch,
	Action,
	HttpReq,
	CustomStore,
	PageComponent,
	NextPrepareAppContext,
	FetchСontainingProcessedActions,
} from '../common/interface';
import loader from './loader';
import { getCorrectAction } from './_utils';

const checkValidPrepareValue = prepareValue => {
	if (!prepareValue) {
		return false;
	}

	if (
		prepareValue instanceof Array &&
		prepareValue.length > 0 &&
		prepareValue[0] === ''
	) {
		return false;
	}

	return true;
};

interface IConfiguration {
	async: boolean;
	store: CustomStore;
}

interface IWrappedComponentProps extends DefaultAppIProps, AppProps {
	Component: PageComponent;
}

interface IWrappedComponentState {
	pageProps: object;
}

const hoc = ({ store }: IConfiguration) => {
	return BC => { // BC - Base component
		return class WrappedComponent extends React.Component<IWrappedComponentProps, IWrappedComponentState> {
			static displayName = `withPrepare(${BC.displayName || BC.name || 'BaseComponent'})`;

			static async getInitialProps(props: NextPrepareAppContext<HttpReq>) {
				const { Component, ctx } = props;
				const isServer = !!ctx.req;
				const state = {};

				const fetchResult = {};
				const pagePropsFromGetInitialProps = {};

				const needLoad: FetchСontainingProcessedActions = {};

				const fetch: Fetch = Component.fetch || {};
				const fetchFresh: Fetch = Component.fetchFresh || {};

				if (!isServer) {
					Object.assign(state, store.getState());
				}

				// Get props from children component
				if (BC.getInitialProps) {
					const componentResultProps = await BC.getInitialProps(props);

					if (componentResultProps instanceof Object) {
						Object.assign(pagePropsFromGetInitialProps, componentResultProps.pageProps);
					}
				}

				Object.entries(fetch).forEach(([key, rawAction]) => {
						const action: Action<any> = getCorrectAction(rawAction, {
							ctx,
							pageProps: pagePropsFromGetInitialProps,
						});

						if (checkValidPrepareValue(pagePropsFromGetInitialProps[key])) {
							return; // Data already available
						}
						
						if (checkValidPrepareValue(state[key])) {
							fetchResult[key] = state[key];
							return;
						}
		
						if (action.options && action.options.passive) {
							return;
						}

						needLoad[key] = action;
				});

				// Set the required updates
				Object.entries(fetchFresh).forEach(([key, rawAction]) => {
					needLoad[key] = getCorrectAction(rawAction, {
						ctx,
						pageProps: pagePropsFromGetInitialProps,
					});
				});

				if (Object.keys(needLoad).length > 0) {
					try {
						const response = await loader.get({ ctx, fetch: needLoad });
						Object.assign(fetchResult, response);
					} catch (err) {
						return { err: err.stack };
					}
				}

				if (!isServer && Object.keys(fetchResult).length > 0) {
					store.setResult(fetchResult);
				}

				return {
					pageProps: {
						...fetchResult,
						...pagePropsFromGetInitialProps,
					},
				};
			}

			constructor(props) {
				super(props);

				if (props.err) {
					return;
				}

				const fetch: Fetch = { ...props.Component.fetch, ...props.Component.fetchFresh };

				const initialResultPrepare = Object
					.keys(fetch)
					.reduce((acc: object, key) => {
						if (!props.pageProps[key]) {
							// log warning
							return acc;
						}

						acc[key] = props.pageProps[key];

						return acc;
					}, {});

				store.setInitialState(initialResultPrepare);

				this.state = {
					pageProps: props.pageProps,
				};
			}

			componentDidMount() {
				if (store.needToSubscribe) {
					// If the repository is updated, then update the component.
					store.subscribe(this.changeStore);
				}
				// Does not apply to a store that is one level higher, and the tree renders (redux)
			}

			componentWillUnmount() {
				if (store.needToSubscribe) {
					store.unsubscribe(this.changeStore);
				}
			}

			changeStore = (newState: object) => {
				const oldFetchData = {};
				const newFetchData = {};
				
				Object
					.keys({
						...this.props.Component.fetch,
						...this.props.Component.fetchFresh,
					})
					.forEach(key => {
						oldFetchData[key] = this.state.pageProps[key];
						newFetchData[key] = newState[key];
					});
				
				if (JSON.stringify(oldFetchData) !== JSON.stringify(newFetchData)) {
					this.setState({
						pageProps: { ...this.state.pageProps, ...newFetchData },
					});
				}
			}

			render() {
				return (
					<BC
						{ ...this.props }
						pageProps={ this.state.pageProps }
					/>
				);
			}
		};
	};
};

export default (store: CustomStore) => (Component: React.ComponentType) => {
	const defaultConfig = {
		store,
		async: false,
	};

	return hoc(defaultConfig)(Component);
};