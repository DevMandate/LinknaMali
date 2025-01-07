import React, { useState } from 'react';
import Amenities from '../amenities';
import Button from '../button'

const CommercialForm = ({ addProperty }) => {
  const [propertyName, setPropertyName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [size, setSize] = useState('');
  const [purpose, setPurpose] = useState('');
  const [commercialType, setCommercialType] = useState('');
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
      commercialType,
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
    setCommercialType('');
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
        value={commercialType}
        onChange={(e) => setCommercialType(e.target.value)}
        placeholder="Commercial Type"
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700">Upload Image</label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
        <div>
          <label className="block text-gray-700">Upload Document</label>
          <input
            type="file"
            onChange={(e) => setDocument(e.target.files[0])}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>
      </div>
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

export default CommercialForm;