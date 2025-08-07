import React from "react";
import { MapPin, Building, Users, Star, Download } from "lucide-react";

const HeroSection = ({ project }) => {
  return (
    <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-screen overflow-hidden">
      {project.cover_image?.image_url && (
        <>
          <img
            src={project.cover_image.image_url}
            alt={project.name}
            className="w-full h-full object-cover scale-105 transition-transform duration-[10s] ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        </>
      )}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-8 md:px-16">
          <div className="max-w-4xl">
            <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-2" />
              <span className="text-white text-xs sm:text-sm font-medium">
                Premium Development
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-white mb-4 sm:mb-6 leading-tight tracking-wide">
              {project.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center text-white/90 mb-6 sm:mb-8 text-sm sm:text-lg space-y-2 sm:space-y-0">
              <div className="flex items-center sm:mr-8 mb-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{project.location}</span>
              </div>
              <div className="flex items-center sm:mr-8 mb-2">
                <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{project.status}</span>
              </div>
              <div className="flex items-center mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{project.number_of_units} Units</span>
              </div>
            </div>
            <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-10 max-w-2xl leading-relaxed">
              {project.description?.substring(0, 150)}...
            </p>
            <div className="flex flex-wrap gap-4">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;