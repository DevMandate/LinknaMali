import React from "react";
import UnitCard from "./UnitCard";

const UnitsSection = ({ units, handleInterestClick, handleViewGallery }) => {
  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-8 md:px-16">
        <div className="text-center mb-12 sm:mb-20">
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light mb-4 sm:mb-6"
            style={{ color: "var(--text)" }}
          >
            Available <span style={{ color: "var(--merime-theme)" }}>Units</span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto text-gray-600">
            {units.length > 0
              ? "Choose from our carefully curated selection of premium living spaces"
              : "No properties have been listed under this project yet."}
          </p>
        </div>
        {units.length > 0 && (
          <div className="space-y-16 sm:space-y-32">
            {units.map((unit, index) => (
              <UnitCard
                key={`${unit.type}-${unit.id}`}
                unit={unit}
                index={index}
                handleInterestClick={handleInterestClick}
                handleViewGallery={handleViewGallery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitsSection;