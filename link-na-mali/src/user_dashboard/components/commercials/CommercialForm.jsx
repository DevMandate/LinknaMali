import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { Amenities } from "../amenities";
import Button from "../button";
import Modal from "../modal";

const CommercialForm = ({ addProperty = () => {} }) => {
  // Default to empty function if addProperty is not provided
  const { userData } = useAppContext();
  const [propertyName, setPropertyName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [town, setTown] = useState("");
  const [locality, setLocality] = useState("");
  const [price, setPrice] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [size, setSize] = useState("");
  const [purpose, setPurpose] = useState("Rent");
  const [type, setCommercialType] = useState("Office");
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [document, setDocument] = useState(null);
  const [videos, setVideo] = useState([]);
  const [mapLocation, setMapLocation] = useState("");
  const [locationText, setLocationText] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [coverImageIndex, setCoverImageIndex] = useState(null); 

  useEffect(() => {
    console.log("userData:", userData);
    if (userData) {
      setIsLoading(false);
    }
  }, [userData]);

  const handleDescriptionChange = (e) => {
    const words = e.target.value.split(/\s+/);
    if (words.length <= 200) {
      setDescription(e.target.value);
    }
  };

  const handleImageChange = (e) => {
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total limit
  const minImageCount = 4;
  const minImageSize = 0.01 * 1024 * 1024; // 0.01MB
  const maxImageSize = 2 * 1024 * 1024; // 2MB per image
  const files = Array.from(e.target.files);

  // Minimum number of images
  if (files.length < minImageCount) {
    setError(`Please upload at least ${minImageCount} images.`);
    setImages([]);
    return;
  }

  // Minimum size per image
  const tooSmallImages = files.filter((file) => file.size < minImageSize);
  if (tooSmallImages.length > 0) {
    setError(
      `All images must be at least 0.01MB. These files are too small: ${tooSmallImages
        .map((f) => f.name)
        .join(", ")}`
    );
    setImages([]);
    return;
  }

  // Maximum size per image
  const tooLargeImages = files.filter((file) => file.size > maxImageSize);
  if (tooLargeImages.length > 0) {
    setError(
      `Each image must not exceed 2MB. These files are too large: ${tooLargeImages
        .map((f) => f.name)
        .join(", ")}`
    );
    setImages([]);
    return;
  }

  // Total size check
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  if (totalSize > maxTotalSize) {
    setError(
      "The total size of all images exceeds 50MB. Please upload fewer or smaller files."
    );
    setImages([]);
    return;
  }

  setError(null);
  setImages(files);
  setCoverImageIndex(null);
};


  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files); // Convert FileList to array
    const allowedFormats = ["pdf", "docx", "txt"];
    const validDocuments = [];
    const invalidDocuments = [];

    files.forEach((file) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (allowedFormats.includes(fileExtension)) {
        validDocuments.push(file);
      } else {
        invalidDocuments.push(file);
      }
    });

    if (invalidDocuments.length > 0) {
      setError(`Invalid document formats. Allowed formats are pdf, docx, txt.`);
      setDocument(null); // Reset document if any document is invalid
    } else {
      setError(null);
      setDocument(validDocuments); // Set valid documents
    }
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 50 * 1024 * 1024;

    const oversized = files.find((file) => file.size > maxSize);
    if (oversized) {
      setError("One or more videos exceed 50MB.");
      setVideo([]);
      return;
    }

    setError(null);
    setVideo(files);
  };

  const validateForm = () => {
    if (
      !propertyName ||
      !description ||
      !location ||
      !town ||
      !price ||
      !size ||
      !purpose ||
      !type
    ) {
      setError("Please fill in all required fields.");
      return false;
    }

    if (purpose === "Sale" && (!document || document.length === 0)) {
      setError("For Sale properties, a document upload is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only show overlay if validation passes
    if (!validateForm()) {
      setModalMessage("Please fill in all required fields.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    setIsSubmitting(true); // Set to true right before API call

    if (!userData || !userData.user_id) {
      setError("User ID is required to list a property.");
      setIsSubmitting(false); // Hide overlay if user ID is missing
      setModalMessage("User ID is required to list a property.");
      setModalType("error");
      setShowModal(true);
      return;
    }

    if (coverImageIndex === null) {
      setError("Please select a cover image before submitting.");
      setIsSubmitting(false);
      window.alert("Please select a cover image before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("property_type", "commercial"); // Don't remove this ever
    formData.append("user_id", userData.user_id);
    formData.append("title", propertyName);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("town", town);
    formData.append("locality", locality);
    formData.append("price", price);
    formData.append("availability_status", availabilityStatus);
    formData.append("size", `${size} sqft`);
    formData.append("purpose", purpose);
    formData.append("commercial_type", type);
    if (numberOfUnits) {
      formData.append("number_of_units", numberOfUnits);
    }
    formData.append("amenities", amenities.join(","));

    // Append images and documents to the formData object
    if (images?.length > 0) {
      images.forEach((img) => {
        formData.append("images[]", img);
      });
    }
    if (document?.length > 0) {
      document.forEach((doc) => {
        formData.append("document", doc);
      });
    }

    if (mapLocation) {
      formData.append("map_location", mapLocation);
    }
    if (videos?.length > 0) {
      videos.forEach((vid) => {
        formData.append("videos", vid);
      });
    }

    if (locationText) {
      formData.append("location_text", locationText);
    }

    if (coverImageIndex !== null) {
      formData.append("cover_image_index", coverImageIndex);
    }

    try {
      const response = await fetch(
        "https://api.linknamali.ke/listings/createlisting",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      setSuccess("Commercial property added successfully!");
      setError(null);
      addProperty(data);
      setModalMessage("Commercial property added successfully!");
      setModalType("success");
      setShowModal(true); // Show the modal on success

      // Reset form fields
      setPropertyName("");
      setDescription("");
      setLocation("");
      setTown("");
      setLocality("");
      setPrice("");
      setAvailabilityStatus("");
      setSize("");
      setNumberOfUnits("");
      setPurpose("");
      setCommercialType("");
      setAmenities([]);
      setImages([]); // Note that images is now an array
      setDocument([]);
      setVideo([]);
      setMapLocation("");
      setLocationText("");
    } catch (error) {
      console.error("Error adding commercial property:", error);
      setError("Error adding commercial property. Please try again.");
      setSuccess(null);
      setModalMessage("Error adding commercial property. Please try again.");
      setModalType("error");
      setShowModal(true);
    } finally {
      setIsSubmitting(false); // Always hide overlay after submission attempt
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Inline styles for the overlay and spinner */}
      <style jsx>{`
        .full-screen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7); /* Semi-transparent black */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000; /* Ensure it's on top */
          backdrop-filter: blur(5px); /* Optional blur effect */
          -webkit-backdrop-filter: blur(5px); /* For Safari */
        }

        .overlay-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          font-size: 1.5rem;
          text-align: center;
        }

        .spinner {
          border: 8px solid rgba(255, 255, 255, 0.3);
          border-top: 8px solid #fff;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .overlay-message {
          font-weight: bold;
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-black p-4 md:p-6"
      >
        {error && <div className="col-span-3 text-red-500">{error}</div>}
        <input
          type="text"
          value={propertyName}
          onChange={(e) => setPropertyName(e.target.value)}
          placeholder="Property Name"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="" disabled>
            Select County
          </option>
          <option value="Mombasa">Mombasa</option>
          <option value="Kilifi">Kilifi</option>
          <option value="Lamu">Lamu</option>
          <option value="Taita Taveta">Taita Taveta</option>
          <option value="Kwale">Kwale</option>
          <option value="Tana River">Tana River</option>
        </select>
        <input
          type="text"
          value={town}
          onChange={(e) => setTown(e.target.value)}
          placeholder="Town"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <input
          type="text"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Locality"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <select
          value={availabilityStatus}
          onChange={(e) => setAvailabilityStatus(e.target.value)}
          placeholder="Availability Status"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="vacant">Available</option>
          <option value="rented">Rented</option>
          <option value="sold">Sold</option>
        </select>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size (sqft)"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <input
          type="number"
          value={numberOfUnits}
          onChange={(e) => setNumberOfUnits(e.target.value)}
          placeholder="Number of Units"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="Rent">Rent</option>
          <option value="Short Stay">Short Stay</option>
          <option value="Sale">Sale</option>
        </select>
        <select
          value={type}
          onChange={(e) => setCommercialType(e.target.value)}
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="Office">Office</option>
          <option value="Shop">Shop</option>
          <option value="Warehouse">Warehouse</option>
          <option value="Industrial">Industrial</option>
        </select>

        <input
          type="text"
          value={mapLocation}
          onChange={(e) => setMapLocation(e.target.value)}
          placeholder="Upload the URL of your commercial's location"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Describe nearest Landmark e.g. 200m from the main Vipingo road"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700">Upload Images</label>
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
            />
          </div>
          {images.length > 0 && (
            <div className="col-span-1 md:col-span-3">
              <label className="block mb-2 text-gray-700">Select Cover Image</label>
              <p className="text-sm text-gray-500 mb-2">Click an image to mark it as the cover photo.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Uploaded ${index}`}
                      className={`h-32 w-full object-cover rounded border-2 cursor-pointer ${
                      coverImageIndex === index
                        ? "border-green-500"
                        : "border-transparent"
                    }`}
                      onClick={() => setCoverImageIndex(index)}
                    />
                    {coverImageIndex === index && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded-br">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-gray-700">Upload Documents</label>
            <input
              type="file"
              multiple
              onChange={handleDocumentChange}
              className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700">Upload Videos</label>
            <input
              type="file"
              accept="video/*"
              name="videos"
              multiple
              onChange={handleVideoChange}
              className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
            />
          </div>
        </div>

        <textarea
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Description (max 200 words)"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) col-span-1 md:col-span-3 h-32 resize-none bg-white w-full"
        />
        <Amenities
          selectedAmenities={amenities}
          setSelectedAmenities={setAmenities}
        />
        <div className="col-span-1 md:col-span-3 flex justify-center">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Add to Listing"}
          </Button>
        </div>
      </form>

      {/* Full-screen overlay for submission - rendered conditionally */}
      {isSubmitting && (
        <div className="full-screen-overlay">
          <div className="overlay-content">
            <div className="spinner"></div>
            <p className="overlay-message">Submitting your property...</p>
          </div>
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div className="text-center">
          <h2
            className={`text-xl font-bold ${
              modalType === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {modalType === "success" ? "Success" : "Error"}
          </h2>
          <p
            className={
              modalType === "success" ? "text-green-500" : "text-red-500"
            }
          >
            {modalMessage}
          </p>
        </div>
      </Modal>
    </>
  );
};

export default CommercialForm;