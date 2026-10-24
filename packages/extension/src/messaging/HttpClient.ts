export interface HttpClient {
  fetchText(url: string): Promise<string>
  fetchJson<T = unknown>(url: string): Promise<T>
}

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'FetchError'
  }
}
