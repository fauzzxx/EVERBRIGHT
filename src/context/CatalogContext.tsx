import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { brand } from '../config/brand';
import { catalogSource } from '../services/catalog';
import type { Catalog, Category, Division, DivisionId, Product } from '../types/catalog';

interface CatalogApi {
  catalog: Catalog;
  products: Product[];
  getProduct(id: string): Product | undefined;
  getDivision(id: DivisionId): Division;
  productsFor(division: DivisionId, category?: string): Product[];
  categoriesFor(division: DivisionId): (Category & { count: number })[];
  categoryLabel(id: string): string;
}

const Ctx = createContext<CatalogApi | null>(null);

function sortProducts(a: Product, b: Product) {
  const sa = a.series ?? '';
  const sb = b.series ?? '';
  if (sa !== sb) return sa.localeCompare(sb);
  const na = a.catalogueNo ? parseInt(a.catalogueNo.replace(/\D/g, ''), 10) : a.sourcePage[0];
  const nb = b.catalogueNo ? parseInt(b.catalogueNo.replace(/\D/g, ''), 10) : b.sourcePage[0];
  return na - nb;
}

function buildApi(catalog: Catalog): CatalogApi {
  const products = catalog.products.filter((p) => brand.showReviewRequiredProducts || !p.reviewRequired);
  const byId = new Map(products.map((p) => [p.id, p]));
  const catOrder = new Map(catalog.categories.map((c, i) => [c.id, i]));
  const ordered = [...products].sort(
    (a, b) => (catOrder.get(a.category) ?? 99) - (catOrder.get(b.category) ?? 99) || sortProducts(a, b),
  );
  return {
    catalog,
    products: ordered,
    getProduct: (id) => byId.get(id),
    getDivision: (id) => catalog.divisions.find((d) => d.id === id)!,
    productsFor: (division, category) =>
      ordered.filter((p) => p.division === division && (!category || category === 'all' || p.category === category)),
    categoriesFor: (division) =>
      catalog.categories
        .filter((c) => c.division === division)
        .map((c) => ({ ...c, count: ordered.filter((p) => p.category === c.id).length }))
        .filter((c) => c.count > 0),
    categoryLabel: (id) => catalog.categories.find((c) => c.id === id)?.label ?? id,
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; catalog?: Catalog; error?: string }>({
    status: 'loading',
  });

  useEffect(() => {
    const ctrl = new AbortController();
    catalogSource
      .load(ctrl.signal)
      .then((catalog) => setState({ status: 'ready', catalog }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({ status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
      });
    return () => ctrl.abort();
  }, []);

  const api = useMemo(() => (state.catalog ? buildApi(state.catalog) : null), [state.catalog]);

  if (state.status === 'error') {
    return (
      <div className="grid min-h-svh place-items-center bg-midnight p-8 text-center text-ivory">
        <div>
          <p className="eyebrow text-gold">Catalogue unavailable</p>
          <p className="mt-4 font-serif text-3xl">{state.error}</p>
        </div>
      </div>
    );
  }
  if (!api) return <div className="min-h-svh bg-midnight" aria-busy="true" />;
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
