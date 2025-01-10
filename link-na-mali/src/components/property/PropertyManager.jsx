import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faHome, faTree, faStore } from '@fortawesome/free-solid-svg-icons';
import ApartmentForm from '../apartments'
import HouseForm from '../house'
import LandForm from '../land'
import CommercialForm from '../commercials'
import Button from '../button'

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Apartment');

  const addProperty = (newProperty) => {
    setProperties([...properties, newProperty]);
  };

  const deleteProperty = (id) => {
    setProperties(properties.filter((property) => property.id !== id));
  };

  const filteredProperties = selectedCategory === 'All'
    ? properties
    : properties.filter(property => property.propertyType === selectedCategory);

  const sections = [
    { label: 'Apartment', key: 'Apartment', icon: faBuilding, color: 'bg-blue-500' },
    { label: 'House', key: 'House', icon: faHome, color: 'bg-green-500' },
    { label: 'Land', key: 'Land', icon: faTree, color: 'bg-yellow-500' },
    { label: 'Commercial', key: 'Commercial', icon: faStore, color: 'bg-red-500' },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Property Listing</h1>
      <div className="mb-6 flex justify-center space-x-2">
        {sections.map((section) => (
          <div
            key={section.key}
            onClick={() => setSelectedCategory(section.key)}
            className={`cursor-pointer shadow-lg rounded-lg p-6 flex items-center space-x-4 transition duration-200 ease-in-out transform hover:scale-105 ${
              selectedCategory === section.key ? `${section.color} text-white` : `${section.color} text-white opacity-75`
            }`}
          >
            <FontAwesomeIcon icon={section.icon} className="text-3xl" />
            <span className="text-xl font-semibold">{section.label}</span>
          </div>
        ))}
      </div>
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg p-6">
        {selectedCategory === 'Apartment' && <ApartmentForm addProperty={addProperty} />}
        {selectedCategory === 'House' && <HouseForm addProperty={addProperty} />}
        {selectedCategory === 'Land' && <LandForm addProperty={addProperty} />}
        {selectedCategory === 'Commercial' && <CommercialForm addProperty={addProperty} />}
      </div>
      <div className="max-w-full mx-auto mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Properties</h2>
        <table className="table-auto w-full text-left bg-white text-black shadow-md rounded-lg border border-gray-200">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-2 border-b">#</th>
              <th className="px-4 py-2 border-b">Property</th>
              <th className="px-4 py-2 border-b">Location</th>
              <th className="px-4 py-2 border-b">Price</th>
              <th className="px-4 py-2 border-b">Type</th>
              <th className="px-4 py-2 border-b">Status</th>
              <th className="px-4 py-2 border-b">Size</th>
              <th className="px-4 py-2 border-b">Purpose</th>
              <th className="px-4 py-2 border-b">Floor</th>
              <th className="px-4 py-2 border-b">Bedrooms</th>
              <th className="px-4 py-2 border-b">Bathrooms</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property, index) => (
              <tr key={property.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                <td className="px-4 py-2 border-b">{index + 1}</td>
                <td className="px-4 py-2 border-b">{property.title}</td>
                <td className="px-4 py-2 border-b">{property.location}</td>
                <td className="px-4 py-2 border-b">{property.price}</td>
                <td className="px-4 py-2 border-b">{property.propertyType}</td>
                <td className="px-4 py-2 border-b">{property.availabilityStatus}</td>
                <td className="px-4 py-2 border-b">{property.size}</td>
                <td className="px-4 py-2 border-b">{property.purpose}</td>
                <td className="px-4 py-2 border-b">{property.floor_number}</td>
                <td className="px-4 py-2 border-b">{property.number_of_bedrooms}</td>
                <td className="px-4 py-2 border-b">{property.number_of_bathrooms}</td>
                <td className="px-4 py-2 border-b">
                  <Button>Edit</Button>
                </td>
                <td className="px-4 py-2 border-b">
                  <Button onClick={() => deleteProperty(property.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyManagement;