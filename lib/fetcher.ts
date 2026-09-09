/** Error thrown by `fetcher` for non-2xx responses so SWR enters its error state. */
export class FetchError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

export default async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // Non-JSON error body; keep the status message.
    }
    throw new FetchError(res.status, message);
  }
  return res.json();
}
