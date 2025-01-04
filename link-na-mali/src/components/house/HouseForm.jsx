import React, { useState } from 'react';
import Amenities from '../amenities'
import Button from '../button'

const HouseForm = ({ addProperty }) => {
  const [propertyName, setPropertyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [size, setSize] = useState('');
  const [purpose, setPurpose] = useState('');
  const [number_of_bedrooms, setNumber_of_bedrooms] = useState('');
  const [number_of_bathrooms, setNumber_of_bathrooms] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [image, setImage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    addProperty({
      propertyName,
      description,
      location,
      price,
      availabilityStatus,
      size,
      purpose,
      number_of_bedrooms,
      number_of_bathrooms,
      amenities,
      image,
    });
    setPropertyName('');
    setDescription('');
    setLocation('');
    setPrice('');
    setAvailabilityStatus('');
    setSize('');
    setPurpose('');
    setNumber_of_bedrooms('');
    setNumber_of_bathrooms('');
    setAmenities([]);
    setImage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-black">
      <input
        type="text"
        value={propertyName}
        onChange={(e) => setPropertyName(e.target.value)}
        placeholder="Property"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={availabilityStatus}
        onChange={(e) => setAvailabilityStatus(e.target.value)}
        placeholder="Availability Status"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="Size"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Purpose"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={number_of_bedrooms}
        onChange={(e) => setNumber_of_bedrooms(e.target.value)}
        placeholder="Number of Bedrooms"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <input
        type="text"
        value={number_of_bathrooms}
        onChange={(e) => setNumber_of_bathrooms(e.target.value)}
        placeholder="Number of Bathrooms"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-3 h-32 resize-none bg-white"
      />
      <Amenities selectedAmenities={amenities} setSelectedAmenities={setAmenities} />
      <div className="col-span-3 flex justify-center">
        <Button type="submit">Add to Listing</Button>
      </div>
    </form>
  );
};

export default HouseForm;