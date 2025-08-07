import React from "react";
import { Trees, Building2, Shield, Droplets } from "lucide-react";

const AmenitiesSection = ({ amenities }) => {
  const defaultAmenities = [
    { name: "Lush Neighbourhood", icon: Trees },
    { name: "Signature Retail Centre", icon: Building2 },
    { name: "24/7 Security", icon: Shield },
    { name: "Reliable Water Supply", icon: Droplets },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-8 md:px-16 py-12 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">
        <div>
          <h3
            className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8"
            style={{ color: "var(--text)" }}
          >
            Premium <span style={{ color: "var(--merime-theme)" }}>Amenities</span>
          </h3>
          {amenities?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="text-center p-4 sm:p-6 rounded-2xl group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white border border-gray-100"
                  style={{ borderColor: "var(--merime-theme)" }}
                >
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: "var(--merime-theme)" }}
                  >
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h4 className="font-medium text-xs sm:text-sm text-gray-800">
                    {amenity}
                  </h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {defaultAmenities.map((amenity, index) => (
                <div
                  key={index}
                  className="text-center p-4 sm:p-6 rounded-2xl group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white border border-gray-100"
                  style={{ borderColor: "var(--merime-theme)" }}
                >
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: "var(--merime-theme)" }}
                  >
                    <amenity.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h4 className="font-medium text-xs sm:text-sm text-gray-800">
                    {amenity.name}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmenitiesSection;