import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const useScrollMemory = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-wrapper');

    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem('scroll-position');
      if (saved) {
        const { pathname, scrollY } = JSON.parse(saved);
        if (pathname === location.pathname && scrollContainer) {
          setTimeout(() => {
            scrollContainer.scrollTo({ top: scrollY, behavior: 'smooth' });
          }, 50);
        }
      }
    }
  }, [location, navigationType]);

  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-wrapper');

    const saveScroll = () => {
      sessionStorage.setItem(
        'scroll-position',
        JSON.stringify({
          pathname: location.pathname,
          scrollY: scrollContainer?.scrollTop || window.scrollY,
        })
      );
    };

    window.addEventListener('beforeunload', saveScroll);
    return () => {
      saveScroll();
      window.removeEventListener('beforeunload', saveScroll);
    };
  }, [location.pathname]);
};
