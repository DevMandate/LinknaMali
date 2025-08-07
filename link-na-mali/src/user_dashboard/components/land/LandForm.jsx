import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import LandAmenities from "../amenities/LandAmenities";
import Button from "../button";

const LandForm = ({ addProperty }) => {
  if (typeof addProperty !== "function") {
    addProperty = () => {};
  }
  const { userData } = useAppContext();
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [landType, setLandType] = useState("");
  const [location, setLocation] = useState("");
  const [town, setTown] = useState("");
  const [locality, setLocality] = useState("");
  const [price, setPrice] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [purpose, setPurpose] = useState("Rent");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideo] = useState([]);
  const [document, setDocument] = useState(null);
  const [mapLocation, setMapLocation] = useState("");
  const [locationText, setLocationText] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [coverImageIndex, setCoverImageIndex] = useState(null); 

  useEffect(() => {
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
  const minImageSize = 0.01 * 1024 * 1024; 
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
    const files = Array.from(e.target.files);
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
      setError("Invalid document formats. Allowed formats are pdf, docx, txt.");
      setDocument(null);
    } else {
      setError(null);
      setDocument(validDocuments);
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
      !title ||
      !size.trim() ||
      !landType ||
      !location ||
      !town ||
      !price ||
      !availabilityStatus ||
      !purpose ||
      !description ||
      !document ||
      document.length === 0
    ) {
      setError("Please fill in all required fields.");
      return false;
    }

    if (!document || document.length === 0) {
      setError("A document is required for all land listings.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Start submitting state
    setError(null); // Clear previous errors
    setSuccess(null); // Clear previous success messages

    if (!validateForm()) {
      setIsSubmitting(false); // Stop submitting if validation fails
      window.alert("Please fill in all required fields.");
      return;
    }

    if (!userData || !userData.user_id) {
      setError("User ID is required to list a property.");
      setIsSubmitting(false); // Stop submitting
      window.alert("User ID is required to list a property.");
      return;
    }

    if (coverImageIndex === null) {
      setError("Please select a cover image before submitting.");
      setIsSubmitting(false);
      window.alert("Please select a cover image before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("property_type", "land");
    formData.append("user_id", userData.user_id);
    formData.append("title", title);
    formData.append("size", `${size} acres`);
    formData.append("land_type", landType);
    formData.append("location", location);
    formData.append("town", town);
    formData.append("locality", locality);
    formData.append("number_of_units", numberOfUnits);
    formData.append("price", price);
    formData.append("availability_status", availabilityStatus);
    formData.append("purpose", purpose);
    formData.append("description", description);
    formData.append("amenities", amenities.join(","));

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
    if (videos?.length > 0) {
      videos.forEach((vid) => {
        formData.append("videos", vid);
      });
    }

    if (mapLocation) {
      formData.append("map_location", mapLocation);
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
      setSuccess("Land property added successfully!");
      setError(null);
      addProperty(data);
      window.alert("Land property added successfully!");

      // Clear form fields
      setTitle("");
      setSize("");
      setLandType("");
      setLocation("");
      setTown("");
      setLocality("");
      setNumberOfUnits("");
      setPrice("");
      setAvailabilityStatus("");
      setPurpose("");
      setDescription("");
      setAmenities([]);
      setImages([]);
      setDocument([]);
      setVideo([]);
      setMapLocation("");
      setLocationText("");
    } catch (error) {
      console.error("Error adding land:", error);
      setError("Error adding land property. Please try again.");
      setSuccess(null);
      window.alert("Error adding land property. Please try again.");
    } finally {
      setIsSubmitting(false); // Stop submitting state regardless of success or error
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Inline styles for custom colorful loading animation */}
      <style jsx>{`
        @keyframes colorful-spin {
          0% {
            transform: rotate(0deg);
            border-color: #29abe2; /* Cyan */
          }
          33% {
            border-color: #8e44ad; /* Purple */
          }
          66% {
            border-color: #f39c12; /* Orange */
          }
          100% {
            transform: rotate(360deg);
            border-color: #29abe2; /* Cyan */
          }
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6); /* Semi-transparent black background */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 1000; /* Ensure it's on top of other content */
          color: white;
          font-size: 1.2rem;
          text-align: center;
        }

        .colorful-spinner {
          border: 8px solid rgba(255, 255, 255, 0.3); /* Base grey ring */
          border-top: 8px solid #29abe2; /* First color segment for top */
          border-radius: 50%;
          width: 80px; /* Make it bigger */
          height: 80px; /* Make it bigger */
          animation: colorful-spin 1.5s linear infinite; /* Main spin animation */
          margin-bottom: 1.5rem; /* More space below spinner */
          position: relative; /* Needed for pseudo-elements */
          box-shadow: 0 0 15px rgba(41, 171, 226, 0.7); /* Subtle glow */
        }

        .colorful-spinner::before {
          content: '';
          position: absolute;
          top: 4px; /* Adjust to create inner ring */
          left: 4px; /* Adjust to create inner ring */
          right: 4px; /* Adjust to create inner ring */
          bottom: 4px; /* Adjust to create inner ring */
          border: 8px solid transparent;
          border-left-color: #8e44ad; /* Second color segment for left */
          border-radius: 50%;
          animation: colorful-spin 1.8s reverse linear infinite; /* Slightly different speed/direction */
        }

        .colorful-spinner::after {
          content: '';
          position: absolute;
          top: 12px; /* Adjust to create innermost ring */
          left: 12px; /* Adjust to create innermost ring */
          right: 12px; /* Adjust to create innermost ring */
          bottom: 12px; /* Adjust to create innermost ring */
          border: 8px solid transparent;
          border-right-color: #f39c12; /* Third color segment for right */
          border-radius: 50%;
          animation: colorful-spin 2.1s linear infinite; /* Another speed */
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-black p-4 md:p-6"
      >
        {error && <div className="col-span-3 text-red-500">{error}</div>}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Land Title/Name"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Size (acres)"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <select
          value={landType}
          onChange={(e) => setLandType(e.target.value)}
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="" disabled>
            Select Land Type
          </option>
          <option value="Agricultural">Agricultural</option>
          <option value="Commercial">Commercial</option>
          <option value="Residential">Residential</option>
          <option value="Industrial">Industrial</option>
          <option value="Mixed-Use">Mixed-Use</option>
        </select>

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
        <input
          type="number"
          value={numberOfUnits}
          onChange={(e) => setNumberOfUnits(e.target.value)}
          placeholder="Number of Units"
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

        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        >
          <option value="Rent">Rent</option>
          <option value="Short Stay">Short Stay</option>
          <option value="Sale">Sale</option>
        </select>

        <input
          type="text"
          value={mapLocation}
          onChange={(e) => setMapLocation(e.target.value)}
          placeholder="Upload the URL of your Land's location"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Describe nearest Landmark e.g. 200m from the main Vipingo road"
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) bg-white w-full"
        />

        <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          className="px-2 py-1 md:px-4 md:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-var(--secondary-color) col-span-1 md:col-span-2 lg:col-span-3 h-32 resize-none bg-white w-full"
        />

        <LandAmenities
          selectedAmenities={amenities}
          setSelectedAmenities={setAmenities}
        />

        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Add to Listing"}
          </Button>
        </div>
      </form>

      {/* Full-screen loading overlay */}
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="colorful-spinner"></div>
          Creating your property listing...
        </div>
      )}
    </>
  );
};

export default LandForm;