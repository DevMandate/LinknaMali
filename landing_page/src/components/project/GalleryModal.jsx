import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const GalleryModal = ({
  showGallery,
  galleryImages,
  currentImageIndex,
  handleCloseGallery,
  handlePrevImage,
  handleNextImage,
}) => {
  if (!showGallery) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={handleCloseGallery}
    >
      <button
        onClick={handleCloseGallery}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[10000] p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-900 hover:bg-white transition-all duration-200 shadow-lg"
      >
        <X className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 px-3 sm:px-4 py-1 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm sm:text-base">
        {currentImageIndex + 1} of {galleryImages.length}
      </div>
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-6xl max-h-full">
          <img
            src={galleryImages[currentImageIndex]?.url}
            alt={galleryImages[currentImageIndex]?.caption}
            className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6 rounded-b-lg">
            <p className="text-white text-sm sm:text-base font-medium">
              {galleryImages[currentImageIndex]?.caption}
            </p>
          </div>
        </div>
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all duration-200 group"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all duration-200 group"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </>
        )}
      </div>
      {galleryImages.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 max-w-md w-full px-4">
          <div className="flex space-x-2 sm:space-x-3 justify-center overflow-x-auto pb-2">
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  index === currentImageIndex
                    ? "border-white shadow-lg scale-110"
                    : "border-white/30 hover:border-white/60"
                }`}
              >
                <img
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-4 right-4 text-white/60 text-xs hidden sm:block">
        Use ← → keys to navigate
      </div>
    </div>
  );
};

export default GalleryModal;