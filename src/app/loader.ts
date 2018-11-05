import { FetchWithProcessedActions, Ctx } from '../common/interface';

interface IGetProps {
  ctx: Ctx;
  fetch: FetchWithProcessedActions;
}

export const request = (fetch: FetchWithProcessedActions) => new Promise((resolve, reject) => {
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

export const get = async ({ fetch, ctx }: IGetProps) => {
  // Is server
  if (ctx.req) {
	return await ctx.req.fulfillFetch({ fetch });
  }

  return await request(fetch);
};

export default { request, get };