import * as React from 'react';

import { Fetch } from '../../../common/interface';
import { ParallelAction } from '../../../common/__mocks__/actions';

export namespace PageWithFetchFresh {
	export class Component extends React.Component {
		static fetchFresh: Fetch = {
			bar: ParallelAction.action,
		};
		
		render() {
			return JSON.stringify(this.props);
		}
	}

	export const fetchFreshResult = {
		bar: ParallelAction.payload,
	};
}