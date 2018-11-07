
export type Ctx = {
	err?: any;
	req?: any;
	res?: any;
	pathname: string;
	query: any;
	asPath: string;
};

export type ActionOptions = {
	parallel?: boolean;
	passive?: boolean;
	optional?: boolean;
};

export type RawPayload<P> = P|PayloadMiddleware<P>;

export type RawAction<P> = {
	type: string;
	payload: RawPayload<P>;
	options?: ActionOptions;
};

export type Action<P> = {
	type: string;
	payload: P;
	options?: ActionOptions;
};

export type ActionCreator<P, R> = {
	type: string;
	result: R;
	options?: ActionOptions;
	(payload: RawPayload<P>, options?: ActionOptions): RawAction<P>;
};

export type HandlerFunctionProps<P> = {
	req: any;
	action: Action<P>;
	accumulation?: object;
};

export type HandlerFunction<P, R> = (props: HandlerFunctionProps<P>) => R|Promise<R>;

export type PayloadMiddlewareArguments = {
	pageProps: any,
	ctx: Ctx;
};

export type PayloadMiddleware<P> = (props: PayloadMiddlewareArguments) => P;

export type Fetch = {
	[key: string]: ActionCreator<any, any>|RawAction<any>;
};

export type FetchWithProcessedActions = {
	[key: string]: Action<any>;
};

export type WithPrepareConstructorProps = {
	Component: any;
	pageProps: {
		[key: string]: any;
	};
	err: any;
};

export type CustomStore = {
	setInitialState(state: object): CustomStore;
	setResult(props: object): CustomStore;
	getState(): object;
};

export type ActionErrorHandler = (error: Error, action: Action<any>, req, accumulation?) => void;

export type OptionMiddleware = {
	actionErrorHandler?: ActionErrorHandler;
	errorHandler?: (error: Error, req, res) => void;
};

export type PerformAnAction = (action: Action<any>, req: any, accumulation?: any) => any;