import { Ctx } from '../../common/interface';

const defaultClientSideCtx: Ctx = { pathname: '/', query: {}, asPath: '/' };
const defaultServerSideCtx: Ctx = { ...defaultClientSideCtx, req: {}, res: {} };

export const ctx = {
	clientSide: defaultClientSideCtx,
	serverSide: defaultServerSideCtx,
};