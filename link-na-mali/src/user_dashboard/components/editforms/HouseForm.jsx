import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './forms.css';
import LoadingOverlay from '../loadingoverlay/LoadingOverlay';

const HouseForm = ({ property, onClose, onUpdate }) => {
  const [propertyDetails, setPropertyDetails] = useState({
    title: '',
    description: '',
    location: '',
    town: '',
    locality: '',
    price: '',
    availabilityStatus: 'Available',
    size: '',
    purpose: 'Rent',
    house_type: '',
    number_of_bedrooms: '',
    number_of_bathrooms: '',
    map_location: '',
    location_text: '',
    amenities: [],
    images: [], // array of File objects
    documents: [],
    videos: [],

  });
  const [existingImages, setExistingImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(null);

  useEffect(() => {
    if (property) {
      setPropertyDetails({
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        town: property.town || '',
        locality: property.locality || '',
        price: property.price || '',
        availabilityStatus: property.availability_status || 'Available',
        size: property.size?.replace(' sqft', '') || '',
        purpose: property.purpose || 'Rent',
        house_type: property.house_type || '',
        number_of_bedrooms: property.number_of_bedrooms || '',
        number_of_bathrooms: property.number_of_bathrooms || '',
        map_location: property.map_location || '',
        location_text: property.location_text || '',
        amenities: property.amenities?.split(',') || [],
        images: [],
        document: [],
        videos: [],
      });
      setExistingImages(property.images || []);
      setCoverImageIndex(null);
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPropertyDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
  const { name, files } = e.target;
  const selectedFiles = Array.from(files);

  if (name === 'images') {
    const MIN_IMAGE_COUNT = 4;
    const MIN_IMAGE_SIZE = 0.01 * 1024 * 1024; 
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

    const tooSmall = selectedFiles.filter(file => file.size < MIN_IMAGE_SIZE);
    const tooLarge = selectedFiles.filter(file => file.size > MAX_IMAGE_SIZE);

    if (selectedFiles.length < MIN_IMAGE_COUNT) {
      alert(`Please upload at least ${MIN_IMAGE_COUNT} images. You selected ${selectedFiles.length}.`);
      return;
    }

    if (tooSmall.length > 0) {
      const tooSmallDetails = tooSmall
        .map(file => `• ${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
        .join('\n');

      alert(`The following images are smaller than 0.01MB:\n\n${tooSmallDetails}`);
      return;
    }

    if (tooLarge.length > 0) {
      const tooLargeDetails = tooLarge
        .map(file => `• ${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
        .join('\n');

      alert(`The following images exceed the 2MB limit:\n\n${tooLargeDetails}`);
      return;
    }

    setPropertyDetails((prev) => ({
      ...prev,
      images: selectedFiles
    }));
    setCoverImageIndex(null);

  } else {
    setPropertyDetails((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  }
};


  const handleVideoChange = (e) => {
    const { name, files } = e.target;
    setPropertyDetails((prev) => ({
      ...prev,
      [name]: name === 'videos' ? Array.from(files) : files[0],
    }));
  };

  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    setPropertyDetails((prev) => ({
      ...prev,
      [name]: name === 'documents' ? Array.from(files) : files[0],
    }));
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);  
    try {
      const formData = new FormData();
      formData.append('property_type', 'houses');
      formData.append('user_id', property.user_id);
      formData.append('title', propertyDetails.title);
      formData.append('description', propertyDetails.description);
      formData.append('location', propertyDetails.location);
      formData.append('town', propertyDetails.town);
      formData.append('locality', propertyDetails.locality);
      formData.append('price', propertyDetails.price);
      formData.append('availability_status', propertyDetails.availabilityStatus);
      if (propertyDetails.size) {
        formData.append('size', `${propertyDetails.size} sqft`);
      }
      formData.append('purpose', propertyDetails.purpose);
      formData.append('house_type', propertyDetails.house_type);
      formData.append('number_of_bedrooms', propertyDetails.number_of_bedrooms);
      formData.append('number_of_bathrooms', propertyDetails.number_of_bathrooms);
      formData.append('map_location', propertyDetails.map_location);
      formData.append('location_text', propertyDetails.location_text);
      formData.append('amenities', propertyDetails.amenities.join(','));
  
      // Handle image uploads
      if (propertyDetails.images && propertyDetails.images.length > 0) {
        propertyDetails.images.forEach((file) => {
          formData.append('image', file);
        });

        if (coverImageIndex && coverImageIndex.startsWith('new-')) {
          const index = parseInt(coverImageIndex.split('-')[1]);
          formData.append('cover_image', propertyDetails.images[index]);
        }
      } else {
        if (coverImageIndex && coverImageIndex.startsWith('existing-')) {
          const index = parseInt(coverImageIndex.split('-')[1]);
          const coverImageUrl = existingImages[index];
          formData.append('cover_image_url', coverImageUrl);
        }
      }


      if (propertyDetails.documents && propertyDetails.documents.length > 0) {
        propertyDetails.documents.forEach((file) => {
          formData.append('documents', file);
        });
      }

      if (propertyDetails.videos && propertyDetails.videos.length > 0) {
        propertyDetails.videos.forEach((file) => {
          formData.append('videos', file);
        });
      }
  
      // Log FormData entries
      for (let [key, val] of formData.entries()) {
        console.log('FormData entry:', key, val);
      }
  
      // Send update request
      const response = await axios.put(
        `https://api.linknamali.ke/houseupdate/${property.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
  
      console.log('Update response status:', response.status);
      console.log('Update response data:', response.data);
  
      if (response.status === 200) {
        // Show confirmation dialog
        const userConfirmed = window.confirm('House updated successfully! Do you want to close the form?');
        if (userConfirmed) {
          if (onClose) onClose(); // Close the form only if the user clicks "OK"
  
          // Fetch updated property list after the form closes
          const fetchResponse = await axios.get(
            'https://api.linknamali.ke/property/getpropertybyuserid',
            { params: { user_id: property.user_id } }
          );
          console.log('Fetched properties after update:', fetchResponse.data);
  
          if (onUpdate) onUpdate(fetchResponse.data);
        }
      } else {
        alert('Failed to update House Property. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating the House Property. Please check console.');
    } finally {
      setLoading(false); // Hide loading overlay
    }
  };

  return (
    <div>
      {loading && <LoadingOverlay message="Updating House..." />}

      <button onClick={onClose} className="close-btn">X</button>
      <h2>Edit House</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Property Name:</label>
          <input
            type="text"
            name="title"
            value={propertyDetails.title}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={propertyDetails.description}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Location:</label>
          <select
            name="location"
            value={propertyDetails.location}
            onChange={handleChange}
          >
            <option value="" disabled>Select County</option>
            <option value="Mombasa">Mombasa</option>
            <option value="Kilifi">Kilifi</option>
            <option value="Lamu">Lamu</option>
            <option value="Taita Taveta">Taita Taveta</option>
            <option value="Kwale">Kwale</option>
            <option value="Tana River">Tana River</option>
          </select>
        </div>
        <div className="form-group">
          <label>Town:</label>
          <input
            type="text"
            name="town"
            value={propertyDetails.town}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Locality:</label>
          <input
            type="text"
            name="locality"
            value={propertyDetails.locality}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="text"
            name="price"
            value={propertyDetails.price}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Availability Status:</label>
          <select
            name="availabilityStatus"
            value={propertyDetails.availabilityStatus}
            onChange={handleChange}
            placeholder="Availability Status"
          >
            <option value="vacant">Available</option>
            <option value="rented">Rented</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div className="form-group">
          <label>Size (sqft):</label>
          <input
            type="text"
            name="size"
            value={propertyDetails.size}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Purpose:</label>
          <select
            name="purpose"
            value={propertyDetails.purpose}
            onChange={handleChange}
          >
            <option value="Rent">Rent</option>
            <option value="Sale">Sale</option>
            <option value="Short Stay">Short Stay</option>
          </select>
        </div>
        <div className="form-group">
          <label>House Type:</label>
          <select
            name="house_type"
            value={propertyDetails.house_type}
            onChange={handleChange}
          >
            <option value="" disabled>Select House Type</option>
            <option value="Villa">Villa</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Mansion">Mansion</option>
            <option value="Duplex">Duplex</option>
            <option value="Swahili House">Swahili House</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Number of Bedrooms:</label>
          <input
            type="text"
            name="number_of_bedrooms"
            value={propertyDetails.number_of_bedrooms}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Number of Bathrooms:</label>
          <input
            type="text"
            name="number_of_bathrooms"
            value={propertyDetails.number_of_bathrooms}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Pin Location URL:</label>
          <input
            type="text"
            name="map_location"
            value={propertyDetails.map_location}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Nearest Landmark:</label>
          <input
            type="text"
            name="location_text"
            value={propertyDetails.location_text}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Images:</label>
          <input
            type="file"
            name="images"
            multiple
            onChange={handleFileChange}
          />
        </div>
        {propertyDetails.images.length === 0 && existingImages.length > 0 && (
          <div className="col-span-1 md:col-span-3">
            <label className="block mb-2 text-gray-700">Select Cover Image</label>
            <p className="text-sm text-gray-500 mb-2">Click an image to mark it as the cover photo.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`Existing ${index}`}
                    className={`h-32 w-full object-cover rounded border-2 cursor-pointer ${
                      coverImageIndex === `existing-${index}` ? "border-green-500" : "border-transparent"
                    }`}
                    onClick={() => setCoverImageIndex(`existing-${index}`)}
                  />
                  {coverImageIndex === `existing-${index}` && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded-br">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {propertyDetails.images.length > 0 && (
          <div className="col-span-1 md:col-span-3">
            <label className="block mb-2 text-gray-700">Select Cover Image</label>
            <p className="text-sm text-gray-500 mb-2">Click an image to mark it as the cover photo.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {propertyDetails.images.map((img, index) => (
                <div key={`new-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Uploaded ${index}`}
                    className={`h-32 w-full object-cover rounded border-2 cursor-pointer ${
                      coverImageIndex === `new-${index}`
                        ? "border-green-500"
                        : "border-transparent"
                    }`}
                    onClick={() => setCoverImageIndex(`new-${index}`)}
                  />
                  {coverImageIndex === `new-${index}` && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded-br">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Documents:</label>
          <input
            type="file"
            name="documents"
            onChange={handleDocumentChange}
          />
        </div>
        <div className="form-group">
          <label>Videos:</label>
          <input
            type="file"
            name="videos" 
            accept="video/*"           
            multiple
            onChange={handleVideoChange}
          />
        </div>
        <div className="form-group">
          <label>Amenities:</label>
          <input
            type="text"
            name="amenities"
            value={propertyDetails.amenities.join(', ')}
            onChange={(e) =>
              setPropertyDetails(prev => ({
                ...prev,
                amenities: e.target.value.split(',').map(a => a.trim()),
              }))
            }
          />
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default HouseForm;