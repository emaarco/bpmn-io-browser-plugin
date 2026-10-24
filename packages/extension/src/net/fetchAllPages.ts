import { fetchJson } from './client'

const MAX_PAGES = 20
const PER_PAGE = 100

/** Fetch a paginated REST list (`per_page` / `page` query params) up to 2000 items. */
export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const items: T[] = []
  const separator = url.includes('?') ? '&' : '?'
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchJson<T[]>(`${url}${separator}per_page=${PER_PAGE}&page=${page}`)
    items.push(...batch)
    if (batch.length < PER_PAGE) break
  }
  return items
}
