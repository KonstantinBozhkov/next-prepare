import * as React from 'react';

import { Fetch } from '../../../common/interface';
import {
	SimpleAction,
	PassiveAction,
	ActionWithPayloadMiddleware,
} from '../../../common/__mocks__/actions';

export namespace PageWithGetInitialPropsAndFetchAndFetchFresh {
	export class Component extends React.Component {
		static async getInitialProps() {
			return { getInitialProps: 'result' };
		}
		
		static fetch: Fetch = {
			simple: SimpleAction.actionCreator, // Creator
			passive: PassiveAction.action,
		};

		static fetchFresh: Fetch = {
			foo: ActionWithPayloadMiddleware.action,
		};
		
		render() {
			return JSON.stringify(this.props);
		}
	}
	
	export const fetchResult = {
		simple: SimpleAction.payload,
		passive: PassiveAction.payload,
	};

	export const fetchResultWithoutPassive = {
		simple: SimpleAction.payload,
	};

	export const fetchFreshResult = {
		foo: ActionWithPayloadMiddleware.payloadMiddlewareResult,
	};
	export const getInitialPropsResult = { getInitialProps: 'result' };
}