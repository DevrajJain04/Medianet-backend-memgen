export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function api<T>(
	path: string,
	options: {
		method?: HttpMethod;
		body?: unknown;
		token?: string | null;
		headers?: Record<string, string>;
	} = {}
): Promise<T> {
	const { method = 'GET', body, token, headers = {} } = options;
	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!res.ok) {
		let details: unknown;
		try { details = await res.json(); } catch { /* noop */ }
		throw new Error((details as any)?.error || `Request failed: ${res.status}`);
	}
	return (await res.json()) as T;
}
