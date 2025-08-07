import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      const target = document.getElementById("search-results");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const headerOffset = 80;
        window.scrollTo({
          top: 0 - headerOffset,
          behavior: "smooth",
        });
      }
    }, 50);
  }, [location.key]);

  return null;
};

export default ScrollToTop;
