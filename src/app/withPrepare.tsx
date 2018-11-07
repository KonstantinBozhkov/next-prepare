import * as React from 'react';

import {
	Action,
	Fetch,
	FetchWithProcessedActions,
	CustomStore,
	WithPrepareConstructorProps,
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

const hoc = ({ store }: IConfiguration) => {
	return BC => { // BC - Base component
		return class WrappedComponent extends React.Component {
			static displayName = `withPrepare(${BC.displayName || BC.name || 'BaseComponent'})`;

			static async getInitialProps(props) {
				const { Component, ctx } = props;
				const isServer = !!ctx.req;
				const state = {};

				const fetchResult = {};
				const pagePropsFromGetInitialProps = {};

				const needLoad: FetchWithProcessedActions = {};

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

			constructor(props: WithPrepareConstructorProps) {
				super(props);

				if (props.err) {
						return;
				}

				const fetch: Fetch = Object.assign({}, props.Component.fetch, props.Component.fetchFresh);

				const initialResultPrepare = Object.keys(fetch).reduce((acc: object, key) => {
					if (!props.pageProps[key]) {
							// log warning
							return acc;
					}

					return Object.assign(acc, { [key]: props.pageProps[key] });
				}, {});

				store.setInitialState(initialResultPrepare);
			}

			render() {
				return <BC {...this.props} />;
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