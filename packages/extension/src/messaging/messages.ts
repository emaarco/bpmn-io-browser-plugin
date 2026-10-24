export interface FetchTextRequest {
  type: 'fetchText'
  url: string
}

export interface InjectViewScriptRequest {
  type: 'injectViewScript'
  script: string
}

export type BackgroundRequest = FetchTextRequest | InjectViewScriptRequest

export type FetchTextResponse =
  { ok: true; text: string } | { ok: false; error: string; status?: number }
