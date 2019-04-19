import * as React from 'react';

import { Fetch } from '../../interface';
import { ActionWithPayloadMiddleware } from '../../__mocks__/actions';

export namespace PageWithGetInitialPropsAndFetch {
	export class Component extends React.Component {
		static async getInitialProps() {
			return { getInitialProps: 'result' };
		}
		
		static fetch: Fetch = {
			foo: ActionWithPayloadMiddleware.action,
		};
		
		render() {
			return JSON.stringify(this.props);
		}
	}
	
	export const getInitialPropsResult = { getInitialProps: 'result' };
	export const fetchResult = {
		foo: ActionWithPayloadMiddleware.payloadMiddlewareResult,
	};
}