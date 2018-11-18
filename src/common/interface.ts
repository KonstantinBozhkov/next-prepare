import { NextAppContext } from 'next/app';
import { NextContext } from 'next';
import { Request } from 'express';

/* MAIN */
// [NextContext]
export type NextPrepareContext<Req> = NextContext & {
	req?: Req,
};

// [NextAppContext]
export type NextPrepareAppContext<Req> = NextAppContext & {
	Component: PageComponent;
	ctx: NextPrepareContext<Req>;
};

export type Fetch<Req = HttpReq> = {
	[key: string]: ActionCreator<any, any, Req> | RawAction<any, Req>;
};

export type FetchСontainingProcessedActions = {
	[key: string]: Action<any>;
};

export type PageComponent = React.ComponentType & {
	fetch?: Fetch;
	fetchFresh?: Fetch;
};

type RequestFields<B> = {
	fulfillFetch: FulfillFetchInReq;
	body?: B;
};

export type ExpressReq<B = any> = Request & RequestFields<B> & {
	body: B;
};

export type HttpReq<B = any> = NextContext['req'] & RequestFields<B>;

/* ACTION */
export type ActionOptions = {
	parallel?: boolean;
	passive?: boolean;
	optional?: boolean;
};

export type RawPayload<P, Req> = P | PayloadMiddleware<P, Req>;

export type RawAction<P, Req> = {
	type: string;
	payload: RawPayload<P, Req>;
	options?: ActionOptions;
};

export type Action<P> = {
	type: string;
	payload: P;
	options?: ActionOptions;
};

export type ActionCreator<P, R, Req> = {
	type: string;
	result: R;
	options?: ActionOptions;
	(payload: RawPayload<P, Req>, options?: ActionOptions): RawAction<P, Req>;
};

export type PayloadMiddlewareArguments<Req> = {
	pageProps: any,
	ctx: NextPrepareContext<Req>;
};

export type PayloadMiddleware<P, Req> = (props: PayloadMiddlewareArguments<Req>) => P;

/* HANDLER */
export type HandlerFunctionProps<P> = {
	req: any;
	action: Action<P>;
	accumulation?: object;
};

export type HandlerFunction<P, R> = (props: HandlerFunctionProps<P>) => R|Promise<R>;

/* MIDDLEWARES */
export type FulfillFetchInReq = <Req>(fetch: FetchСontainingProcessedActions) => Promise<any>;

export type ActionErrorHandler = (error: Error, action: Action<any>, req, accumulation?) => void;

export type OptionMiddleware = {
	actionErrorHandler?: ActionErrorHandler;
	errorHandler?: (error: Error, req, res) => void;
};

export type PerformAnAction = (action: Action<any>, req: any, accumulation?: any) => any;

/* STORE */
export type CustomStore = {
	unsubscribe<S = any>(f: (state: S) => void): CustomStore;
	subscribe<S = any>(f: (state: S) => void): CustomStore;
	setInitialState<S = any>(state: S): CustomStore;
	setResult(props: object): CustomStore;
	getState(): object;
	needToSubscribe?: boolean;
};