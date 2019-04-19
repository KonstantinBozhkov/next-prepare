import { RouterProps } from 'next/router';
import { NextPrepareContext, HttpReq } from '../interface';
import { ServerResponse } from 'http';
import * as MockReq from 'mock-req';

const defaultClientSideCtx: NextPrepareContext<HttpReq> = {
	pathname: '/',
	query: {},
	asPath: '/',
};

export const mockReq = new MockReq({
	method: 'PUT',
	url: '/stuff?q=thing',
	headers: {
		Accept: 'text/plain',
	},
	search: 'thing',
});

const defaultServerSideCtx: NextPrepareContext<HttpReq> = {
	...defaultClientSideCtx,
	req: mockReq,
	res: new ServerResponse(mockReq),
};

export const ctx = {
	clientSide: defaultClientSideCtx,
	serverSide: defaultServerSideCtx,
};

export const mockRouter: RouterProps = {
	asPath: '/',
	route: '/',
	pathname: '/',
	query: {},
	components: {},
	back: () => null,
	beforePopState: () => null,
	prefetch: () => null,
	push: () => null,
	reload: () => null,
	replace: () => null,
	events: {
		on: () => null,
		off: () => null,
	},
};