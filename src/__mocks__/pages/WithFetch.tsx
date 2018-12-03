import * as React from 'react';

import { Fetch } from '../../interface';
import { SimpleAction } from '../../__mocks__/actions';

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