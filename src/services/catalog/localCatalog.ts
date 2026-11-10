import { categories, divisions } from '../../data/categories';
import type { Product } from '../../types/catalog';
import type { CatalogSource } from './types';

/** Catalogue served from the generated local JSON manifest (loaded as its own chunk). */
export const localCatalog: CatalogSource = {
  async load() {
    const { default: products } = await import('../../data/products.json');
    return {
      divisions,
      categories,
      products: products as Product[],
    };
  },
};
