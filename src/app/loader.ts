import {
	HttpReq,
	ExpressReq,
	NextPrepareContext,
	FetchСontainingProcessedActions,
} from '../common/interface';

interface IGetProps<Req extends HttpReq | ExpressReq> {
  ctx: NextPrepareContext<Req>;
  fetch: FetchСontainingProcessedActions;
}

export const request = (fetch: FetchСontainingProcessedActions) => new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', '/prepare', true);
	xhr.setRequestHeader('Accept', 'application/json');
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(JSON.stringify({ fetch }));

	xhr.onreadystatechange = () => {
		if (xhr.readyState !== 4) {
			return;
		}

		try {
			if (xhr.status !== 200) {
				throw xhr;
			}
			resolve(JSON.parse(xhr.responseText));
		} catch (error) {
			reject(error);
		}
	};
});

export const get = async <Req extends HttpReq | ExpressReq>({ fetch, ctx }: IGetProps<Req>) => {
  // Is server
  if (ctx.req) {
	return await ctx.req.fulfillFetch(fetch);
  }

  return await request(fetch);
};

export default { request, get };