import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ProductDetail } from '../components/products/ProductDetail';
import { useCatalog } from '../context/CatalogContext';
import { NotFound } from './NotFound';

/** Stand-alone product page for direct links and shared URLs. */
export function ProductPage() {
  const { productId = '' } = useParams();
  const { getProduct, getDivision } = useCatalog();
  const navigate = useNavigate();
  const product = getProduct(productId);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
    window.scrollTo(0, 0);
    if (product) document.title = `${product.name} — Everbright Uniforms`;
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      const n = product.images.length;
      if (n < 2) return;
      if (e.key === 'ArrowRight') setImageIndex((i) => (i + 1) % n);
      if (e.key === 'ArrowLeft') setImageIndex((i) => (i - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product]);

  if (!product) return <NotFound />;
  const division = getDivision(product.division);

  return (
    <main className="bg-paper pt-[var(--nav-h)]">
      <div className="gutter border-b border-midnight/10 py-4">
        <button
          type="button"
          onClick={() => navigate('/', { state: { scrollTo: division.anchor } })}
          className="group eyebrow flex items-center gap-3 text-[0.6rem] text-midnight/70 hover:text-midnight"
        >
          <ArrowLeft size={14} strokeWidth={1.2} className="transition-transform group-hover:-translate-x-1" />
          Back to {division.name}
        </button>
      </div>
      <ProductDetail
        product={product}
        mode="page"
        imageIndex={imageIndex}
        onImageIndex={setImageIndex}
        onNavigate={(id) => navigate(`/products/${id}`)}
      />
    </main>
  );
}
