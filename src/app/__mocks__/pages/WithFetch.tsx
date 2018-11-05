import * as React from 'react';

import { Fetch } from '../../../common/interface';

import { SimpleAction } from '../../../common/__mocks__/actions';

export namespace PageWithFetch {
	export class Component extends React.Component {
		static fetch: Fetch = {
			simple: SimpleAction.action,
		};
		
		render() {
			return JSON.stringify(this.props);
		}
	}

	export const fetchResult = {
		simple: SimpleAction.payload,
	};
}