import { categories as localCategories, divisions as localDivisions } from '../../data/categories';
import type { Catalog, Product } from '../../types/catalog';
import type { CatalogSource } from './types';

/**
 * Remote catalogue source — ready for the backend integration.
 * Expects `${VITE_API_BASE_URL}/products` to return Product[] (same shape as
 * src/data/products.json). Division/category metadata falls back to the local
 * definitions unless the API also provides `/divisions` and `/categories`.
 */
export function createApiCatalog(baseUrl: string): CatalogSource {
  const url = (path: string) => `${baseUrl.replace(/\/$/, '')}${path}`;
  return {
    async load(signal) {
      const res = await fetch(url('/products'), { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Catalogue request failed (${res.status})`);
      const products = (await res.json()) as Product[];
      const catalog: Catalog = { divisions: localDivisions, categories: localCategories, products };
      return catalog;
    },
  };
}
