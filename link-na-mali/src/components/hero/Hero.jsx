import React, { useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Button from '../button';

const HeroSection = () => {
  const [propertyType, setPropertyType] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const handleSearch = () => {
    // Dummy API call
    console.log('Search properties:', { propertyType, location, priceRange });
    // You can replace this with an actual API call
  };

  return (
    <div className="relative">
      {/* Carousel */}
      <Carousel autoPlay infiniteLoop showThumbs={false} showStatus={false}>
        <div>
          <img src="https://via.placeholder.com/800x400" alt="Property 1" />
        </div>
        <div>
          <img src="https://via.placeholder.com/800x400" alt="Property 2" />
        </div>
        <div>
          <img src="https://via.placeholder.com/800x400" alt="Property 3" />
        </div>
      </Carousel>

      {/* Search Widget */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-md shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Find Your Dream Property</h2>
          <div className="mb-4">
            <label className="block text-gray-700">Property Type</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300"
            >
              <option value="">Select Type</option>
              <option value="house">Mansion</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300"
              placeholder="Enter location"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Price Range</label>
            <input
              type="text"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300"
              placeholder="Enter price range"
            />
          </div>
          <Button onClick={handleSearch} className="w-full bg-blue-500 text-white hover:bg-blue-600">
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;