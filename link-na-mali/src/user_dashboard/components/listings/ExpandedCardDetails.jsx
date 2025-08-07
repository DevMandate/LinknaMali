import React from "react";

const ExpandedCardDetails = ({ property }) => {
  return (
    <div className="mt-4 space-y-2">
      <p className="text-gray-700 break-words">
        <span className="font-semibold">Amenities:</span>{" "}
        {property.amenities
          ? property.amenities
              .split(",")
              .map((amenity) => amenity.trim())
              .join(", ")
          : "No amenities available"}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Description:</span>{" "}
        {property.description || "No description available"}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Location:</span>{" "}
        {property.location}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Price:</span>{" "}
        {property.price}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Property Type:</span>{" "}
        {property.property_type}
      </p>
      {property.property_type === "commercial" && property.commercial_type && (
        <p className="text-gray-700">
          <span className="font-semibold">Commercial Type:</span>{" "}
          {property.commercial_type}
        </p>
      )}
      {property.property_type === "houses" && property.house_type && (
        <p className="text-gray-700">
          <span className="font-semibold">House Type:</span>{" "}
          {property.house_type}
        </p>
      )}
      {property.property_type === "land" && property.land_type && (
        <p className="text-gray-700">
          <span className="font-semibold">Land Type:</span>{" "}
          {property.land_type}
        </p>
      )}
      <p className="text-gray-700">
        <span className="font-semibold">Availability Status:</span>{" "}
        {property.availability_status}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Size:</span>{" "}
        {property.size}
      </p>
      <p className="text-gray-700">
        <span className="font-semibold">Purpose:</span>{" "}
        {property.purpose}
      </p>
      {property.floor_number && (
        <p className="text-gray-700">
          <span className="font-semibold">Floor:</span>{" "}
          {property.floor_number}
        </p>
      )}
      {property.number_of_bedrooms && (
        <p className="text-gray-700">
          <span className="font-semibold">Bedrooms:</span>{" "}
          {property.number_of_bedrooms}
        </p>
      )}
      {property.number_of_bathrooms && (
        <p className="text-gray-700">
          <span className="font-semibold">Bathrooms:</span>{" "}
          {property.number_of_bathrooms}
        </p>
      )}
      {property.map_location && (
        <p className="text-gray-700">
          <span className="font-semibold">Map Location:</span>{" "}
          <a
            href={property.map_location}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#29327e] text-white px-4 py-2 rounded-lg hover:bg-[#1f285f] transition"
          >
            View Map
          </a>
        </p>
      )}
      {property.location_text && (
        <p className="text-gray-700">
          <span className="font-semibold">Landmark:</span>{" "}
          {property.location_text}
        </p>
      )}
      {property.is_approved && (
        <p className="text-gray-700">
          <span className="font-semibold">Approval Status:</span>{" "}
          <span
            className={`status ${
              property.is_approved === "approved" ? "approved" : "pending"
            }`}
          >
            {property.is_approved}
          </span>
        </p>
      )}
    </div>
  );
};

export default ExpandedCardDetails;
