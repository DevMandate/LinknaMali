import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faList,
  faHome,
  faTree,
  faStore,
} from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

import ApartmentForm from '../apartments';
import HouseForm from '../house';
import LandForm from '../land';
import CommercialForm from '../commercials';
import { MyListings } from '../listings';
// NEW: import your Projects dashboard component
import ProjectsDashboard from '../projects/Dashboard';

const sections = [
  { label: 'My Listings', key: 'My Listings', icon: faList },
  { label: 'Create Listing', key: 'Create Listing', icon: faBuilding },
  // NEW: add Projects button
  { label: 'Projects', key: 'Projects', icon: faList },
];

const formSections = [
  { label: 'Apartment', key: 'Apartment', icon: faBuilding },
  { label: 'House', key: 'House', icon: faHome },
  { label: 'Land', key: 'Land', icon: faTree },
  { label: 'Commercial', key: 'Commercial', icon: faStore },
];

const PropertyManagement = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('My Listings');
  const [selectedForm, setSelectedForm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.editId) {
      setSelectedCategory('My Listings');
    }

    if (location.state?.activeSection) {
      setSelectedCategory(location.state.activeSection);
      if (location.state.activeSection === 'Create Listing') {
        setSelectedForm('Apartment'); // Default to Apartment form
      }
    }

  }, [location.state]);

  const renderForm = () => {
    if (isLoading) {
      return <div className="spinner text-center">Loading...</div>;
    }
    switch (selectedForm) {
      case 'Apartment': return <ApartmentForm />;
      case 'House': return <HouseForm />;
      case 'Land': return <LandForm />;
      case 'Commercial': return <CommercialForm />;
      default: return null;
    }
  };

  const CategoryButton = ({ id, label, icon, isSelected, onClick }) => (
    <div
      id={id}
      role="button"
      aria-selected={isSelected}
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-2 rounded p-1.5 md:p-3 text-white m-2 transition duration-300 ease-in-out ${isSelected ? 'bg-tertiary-color shadow-lg scale-105' : 'bg-primary-color'
        }`}
    >
      <FontAwesomeIcon icon={icon} className="text-lg" />
      <span className="text-base font-bold">{label}</span>
    </div>
  );

  const FormButton = ({ id, label, icon, isSelected, onClick }) => (
    <div
      id={id}
      onClick={onClick}
      className={`cursor-pointer rounded-full p-3 text-black m-2 flex items-center transition duration-300 ${isSelected
          ? 'border-b-4 border-tertiary-color bg-secondary-color'
          : ''
        }`}
      title={`Select ${label}`}
    >
      <FontAwesomeIcon icon={icon} className="mr-2" />
      <span className="text-lg">{label}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-800 dark:text-white">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-4 text-center">
        Manage your properties
      </h1>

      <div className="mb-4 md:mb-6 flex flex-wrap justify-start space-x-2">
        {sections.map(({ key, label, icon }) => (
          <CategoryButton
            key={key}
            id={key}
            label={label}
            icon={icon}
            isSelected={selectedCategory === key}
            onClick={() => {
              setSelectedCategory(key);
              setSelectedForm(key === 'Create Listing' ? 'Apartment' : null);
            }}
          />
        ))}
      </div>

      {/* Create Listing Section */}
      {selectedCategory === 'Create Listing' && (
        <>
          <h2 className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 md:mb-6 text-center">
            Select a category to get started
          </h2>
          <div className="mb-4 md:mb-6 flex flex-wrap justify-center">
            {formSections.map(({ key, label, icon }) => (
              <FormButton
                key={key}
                id={key}
                label={label}
                icon={icon}
                isSelected={selectedForm === key}
                onClick={() => setSelectedForm(key)}
              />
            ))}
          </div>
          {renderForm()}
        </>
      )}

      {/* My Listings Section */}
      {selectedCategory === 'My Listings' && (
        <div>
          {true /* Replace with actual condition */ ? (
            <MyListings />
          ) : (
            <div className="text-center text-gray-500">
              <p>No listings found. Create your first listing!</p>
            </div>
          )}
        </div>
      )}

      {/* Projects Dashboard Section */}
      {selectedCategory === 'Projects' && (
        <div className="mt-6">
          <ProjectsDashboard />
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
