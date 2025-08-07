import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollPositionRestorer = () => {
  const location = useLocation();

  useEffect(() => {
    const restore = sessionStorage.getItem('restoreScroll');

    if (location.pathname === '/' && restore === 'true') {
      sessionStorage.removeItem('restoreScroll');

      const targetY = window.history.state?.scrollY;
      if (typeof targetY !== 'number') return;

      let attempts = 0;
      const maxAttempts = 20;

      const tryScroll = () => {
        if (document.readyState !== 'complete' && attempts < maxAttempts) {
          attempts++;
          requestAnimationFrame(tryScroll);
          return;
        }

        // Scroll only if document height allows it
        if (document.body.scrollHeight > targetY + window.innerHeight || attempts > 10) {
          console.log('[ScrollRestorer] Restoring scrollY to:', targetY);
          window.scrollTo(0, targetY);
        } else {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };

      setTimeout(() => {
        requestAnimationFrame(tryScroll);
      }, 200);
    }
  }, [location.pathname]);

  return null;
};

export default ScrollPositionRestorer;
