import type { Catalog } from '../../types/catalog';

/**
 * Data-access contract for the catalogue. The UI only depends on this
 * interface, so the local JSON source can be swapped for an API client
 * (see apiCatalog.ts) without touching components.
 */
export interface CatalogSource {
  load(signal?: AbortSignal): Promise<Catalog>;
}
