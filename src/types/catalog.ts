export type DivisionId = 'police' | 'uniform' | 'bags';

export type ImageView = 'main' | 'front' | 'back' | 'side' | 'both' | 'front-back' | 'detail';

export interface ProductImage {
  src: string;
  view: ImageView;
  caption: string;
  alt: string;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  name: string;
  division: DivisionId;
  category: string;
  catalogueNo: string | null;
  series: string | null;
  colourway: string | null;
  description: string;
  features: string[];
  images: ProductImage[];
  availableSizes: string[];
  availableColours: string[];
  sourcePdf: string;
  sourcePage: number[];
  sourceLabel: string;
  nameSource: string;
  reviewRequired: boolean;
  reviewNotes: string[];
}

export interface Category {
  id: string;
  division: DivisionId;
  label: string;
  group: string;
}

export interface Division {
  id: DivisionId;
  index: string;
  name: string;
  shortName: string;
  /** dedicated division page */
  path: string;
  anchor: string;
  headline: string;
  intro: string;
  theme: 'dark' | 'light';
  featuredProductIds: string[];
  /** Representative image for the divisions index (product id), optional */
  previewProductId?: string;
}

export interface Catalog {
  divisions: Division[];
  categories: Category[];
  products: Product[];
}
