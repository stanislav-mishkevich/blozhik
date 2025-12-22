import { useQuery, useMutation } from '@tanstack/react-query';

async function callTrpc(method: string, input?: any) {
	const body = {
		id: 1,
		method: 'query',
		params: { path: method, input: input === undefined ? null : input },
	};

	const res = await fetch('/api/trpc', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify(body),
	});

	const json = await res.json();

	// tRPC-wrapped response shape: { result: { data: ... } } or { error: { message,... } }
	if (Array.isArray(json)) {
		// handle batch - return first
		const first = json[0];
		if (first.error) throw new Error(first.error.message || 'trpc_error');
		return first.result?.data;
	}

	if (json.error) throw new Error(json.error.message || 'trpc_error');
	return json.result?.data;
}

function makeProxy(pathParts: string[] = []): any {
	const handler: ProxyHandler<any> = {
		get(_, prop: string) {
			if (prop === 'useQuery') {
				return function useTrpcQuery(input?: any, options?: any) {
					const key = [pathParts.join('.'), input ?? null];
					const queryFn = () => callTrpc(pathParts.join('.'), input);
					const q = useQuery({ queryKey: key, queryFn, ...(options || {}) } as any);
					return {
						...q,
						data: q.data,
						refetch: q.refetch,
					};
				};
			}

			if (prop === 'useMutation') {
				return function useTrpcMutation(options?: any) {
					const mutation = useMutation({ mutationFn: (vars: any) => callTrpc(pathParts.join('.'), vars), ...(options || {}) } as any);

					return {
						...mutation,
						isPending: mutation.status === 'pending',
						mutate: mutation.mutate,
						mutateAsync: mutation.mutateAsync,
					};
				};
			}

			// descend into namespace
			return makeProxy([...pathParts, prop]);
		},
	};

	return new Proxy({}, handler);
}

export const trpc = makeProxy();
