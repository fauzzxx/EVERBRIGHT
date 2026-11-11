import { Route, Routes, useLocation, type Location } from 'react-router';
import { Cursor } from './components/animations/Cursor';
import { ScrollProgress } from './components/animations/ScrollProgress';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { ProductOverlay } from './components/products/ProductOverlay';
import { DivisionPage } from './pages/DivisionPage';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductPage } from './pages/ProductPage';

export default function App() {
  const location = useLocation();
  const background = (location.state as { background?: Location } | null)?.background;

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <Routes location={background ?? location}>
        <Route path="/" element={<Home />} />
        <Route path="/uniforms" element={<DivisionPage divisionId="uniform" />} />
        <Route path="/police-store" element={<DivisionPage divisionId="police" />} />
        <Route path="/fire-and-safety" element={<DivisionPage divisionId="bags" />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      {background && (
        <Routes>
          <Route path="/products/:productId" element={<ProductOverlay />} />
        </Routes>
      )}
      <Cursor />
    </>
  );
}
