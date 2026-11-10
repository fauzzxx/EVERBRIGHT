import { createApiCatalog } from './apiCatalog';
import { localCatalog } from './localCatalog';
import type { CatalogSource } from './types';

const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

/** Switch to the API by setting VITE_CATALOG_SOURCE=api and VITE_API_BASE_URL. */
export const catalogSource: CatalogSource =
  import.meta.env.VITE_CATALOG_SOURCE === 'api' && apiBase ? createApiCatalog(apiBase) : localCatalog;

export type { CatalogSource };
