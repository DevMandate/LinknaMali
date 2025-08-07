import React from 'react';

const Amenities = ({ selectedAmenities, setSelectedAmenities }) => {
  const availableAmenities = [
    'Swimming Pool',
    'Gym',
    'Parking',
    'Garden',
    'Security',
    'Playground',
    'Elevator',
    'Fireplace',
    'Balcony',
    'Air Conditioning',
    'Heating',
    'Wheelchair Accessible',
    'Pet Friendly',
    'Laundry Room',
    'Storage',
    'Clubhouse',
    'Business Center',
    'Conference Room',
    'Rooftop Deck',
    'Doorman',
    'Concierge',
    'Fitness Center',
    'Sauna',
    'Jacuzzi',
    'Tennis Court',
    'Basketball Court',
    'Golf Course',
    'Lake Access',
    'Beach Access',
    'Boat Dock',
    'RV Parking',
    'Horse Facilities',
    'Greenhouse',
    'Workshop',
    'Guest House',
    'Wine Cellar',
    'Media Room',
    'Home Theater',
    'Library',
    'Office',
    'Game Room',
    'Barbecue Area',
    'Outdoor Kitchen',
    'Fire Pit',
    'Solar Panels',
    'Backup Generator',
    'Waterfront',
    'Mountain View',
    'City View',
    'Country View',
    'Private Pool',
    'Community Pool',
    'Private Gym',
    'Community Gym',
    'Private Garden',
    'Community Garden',
    'Private Parking',
    'Community Parking',
    'Private Security',
    'Community Security',
    'Private Playground',
    'Community Playground',
  ];

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedAmenities([...selectedAmenities, value]);
    } else {
      setSelectedAmenities(selectedAmenities.filter((amenity) => amenity !== value));
    }
  };

  return (
    <div className="col-span-1 md:col-span-3">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Amenities</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {availableAmenities.map((amenity) => (
          <label key={amenity} className="flex items-center">
            <input
              type="checkbox"
              value={amenity}
              checked={selectedAmenities.includes(amenity)}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            {amenity}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Amenities;