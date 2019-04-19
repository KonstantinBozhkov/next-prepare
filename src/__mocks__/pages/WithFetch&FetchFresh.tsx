import * as React from 'react';

import { Fetch } from '../../interface';
import { SimpleAction, ParallelAction } from '../../__mocks__/actions';

export namespace PageWithFetchAndFetchFresh {
	export class Component extends React.Component {
		static fetch: Fetch = {
			simple: SimpleAction.action,
		};

		static fetchFresh: Fetch = {
			parallel: ParallelAction.action,
		};
		
		render() {
			return JSON.stringify(this.props);
		}
	}

	export const fetchResult = {
		simple: SimpleAction.payload,
	};
	export const fetchFreshResult = {
		parallel: ParallelAction.payload,
	};
}