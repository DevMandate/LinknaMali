import React from "react";
import { Map, CheckCircle, Camera } from "lucide-react";

const UnitCard = ({ unit, index, handleInterestClick, handleViewGallery }) => {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center ${
        index % 2 === 1 ? "lg:grid-flow-col-dense" : ""
      }`}
    >
      <div
        className={`${index % 2 === 1 ? "lg:col-start-2" : "lg:col-start-1"} space-y-6 sm:space-y-8`}
      >
        <div>
          <h4 className="text-3xl sm:text-4xl lg:text-6xl font-extralight mb-3 sm:mb-4 leading-tight">
            <span style={{ color: "var(--text)" }}>
              {unit.title || unit.name || unit.type}
            </span>
            <br />
            <span
              style={{ color: "var(--merime-theme)" }}
              className="font-medium text-xl sm:text-2xl lg:text-3xl"
            >
              {unit.type}
            </span>
          </h4>
          <div className="flex items-center text-gray-600 mb-4 sm:mb-6">
            <Map className="w-4 h-4 mr-2" />
            <span>Size: {unit.size || "Contact for details"}</span>
          </div>
        </div>
        {unit.description && (
          <div className="mb-6">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {unit.description}
            </p>
          </div>
        )}
        {unit.features && (
          <div className="space-y-3 sm:space-y-4">
            <h5
              className="text-base sm:text-lg font-semibold mb-3 sm:mb-4"
              style={{ color: "var(--text)" }}
            >
              Features & Amenities
            </h5>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {unit.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors duration-200"
                >
                  <CheckCircle
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0"
                    style={{ color: "var(--merime-theme)" }}
                  />
                  <span className="text-sm sm:text-base text-gray-700">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <h5
            className="text-base sm:text-lg font-semibold mb-3"
            style={{ color: "var(--text)" }}
          >
            Flexible Payment Plan
          </h5>
          <div className="space-y-2 text-xs sm:text-sm text-gray-700">
            <div className="flex items-center">
              <CheckCircle
                className="w-3 h-3 sm:w-4 sm:h-4 mr-2"
                style={{ color: "var(--merime-theme)" }}
              />
              <span>10% deposit on signing</span>
            </div>
            <div className="flex items-center">
              <CheckCircle
                className="w-3 h-3 sm:w-4 sm:h-4 mr-2"
                style={{ color: "var(--merime-theme)" }}
              />
              <span>Balance in 12 equal installments</span>
            </div>
            <div className="flex items-center">
              <CheckCircle
                className="w-3 h-3 sm:w-4 sm:h-4 mr-2"
                style={{ color: "var(--merime-theme)" }}
              />
              <span>KMRC financing available</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-baseline">
            <div>
              <span className="text-xs sm:text-sm text-gray-500 block">
                {unit.price ? "Starting from" : "Price"}
              </span>
              <span
                className="text-2xl sm:text-3xl lg:text-4xl font-bold"
                style={{ color: "var(--text)" }}
              >
                {unit.price
                  ? `KES ${Number(unit.price).toLocaleString()}`
                  : "Contact for pricing"}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleInterestClick(unit)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-white"
              style={{ backgroundColor: "var(--merime-theme)" }}
            >
              I am Interested
            </button>
          </div>
        </div>
      </div>
      <div
        className={`${index % 2 === 1 ? "lg:col-start-1" : "lg:col-start-2"} relative group`}
      >
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          <img
            src={unit.image_url || unit.cover_image || "/placeholder.jpg"}
            alt={`${unit.title || unit.name || unit.type} interior`}
            className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {unit.price && (
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg">
              <span className="font-bold text-sm sm:text-base text-gray-900">
                KES {Number(unit.price).toLocaleString()}
              </span>
            </div>
          )}
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <button
              onClick={() => handleViewGallery(unit)}
              className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium flex items-center shadow-lg hover:bg-white transition-colors duration-200 text-sm"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              View Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitCard;