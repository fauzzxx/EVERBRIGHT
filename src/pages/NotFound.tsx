import { useNavigate } from 'react-router';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <main data-nav="dark" className="weave grid min-h-svh place-items-center bg-midnight px-6 text-center text-ivory">
      <div>
        <p className="eyebrow text-gold">Page not found</p>
        <h1 className="display mt-6 text-[clamp(3rem,9vw,7rem)]">Off the pattern.</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/70">The page you were looking for is not part of the catalogue.</p>
        <button type="button" onClick={() => navigate('/')} className="btn btn-outline-light mt-10">
          Return home
        </button>
      </div>
    </main>
  );
}
