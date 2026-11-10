import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource-variable/dm-sans';
import './styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { CatalogProvider } from './context/CatalogContext';
import { SmoothScrollProvider } from './hooks/useSmoothScroll';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SmoothScrollProvider>
        <CatalogProvider>
          <App />
        </CatalogProvider>
      </SmoothScrollProvider>
    </BrowserRouter>
  </StrictMode>,
);
