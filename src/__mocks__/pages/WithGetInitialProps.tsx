import * as React from 'react';

export namespace PageWithGetInitialProps {

	export class Component extends React.Component {
		static async getInitialProps() {
			return { foo: 'bar' };
		}
	
		render() {
			return JSON.stringify(this.props);
		}
	}

	export const getInitialPropsResult = { foo: 'bar' };

}