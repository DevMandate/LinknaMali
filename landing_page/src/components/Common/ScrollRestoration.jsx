import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollRestoration = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/') return;

    const scrollToId = sessionStorage.getItem('scrollToId');
    console.log("[ScrollRestoration] Running scroll restoration");
    console.log("[ScrollRestoration] scrollToId:", scrollToId);

    if (scrollToId && !window.__scrollHandled) {
      window.__scrollHandled = true;

      const tryScroll = () => {
        const el = document.getElementById(scrollToId);
        if (el && el.offsetHeight > 0) {
          console.log("[ScrollRestoration] Scrolling to:", scrollToId);
          el.scrollIntoView({ behavior: 'smooth' });
          sessionStorage.removeItem('scrollToId');
        } else {
          setTimeout(tryScroll, 100);
        }
      };

      // Initial delay to allow layout/rendering to stabilize
      setTimeout(tryScroll, 200);
    }
  }, [location.pathname]);

  return null;
};

export default ScrollRestoration;
