import React from "react";

const LandAmenities = ({ selectedAmenities, setSelectedAmenities }) => {
  const amenities = [
    "Road Access",
    "Electricity",
    "Water Supply",
    "Sewage/Drainage System",
    "Internet and Phone Connectivity",
    "Scenic Views",
    "Topography",
    "Soil Quality",
    "Proximity to Water Bodies",
    "Climate Conditions",
    "Proximity to Urban Areas",
    "Nearby Public Transportation",
    "Accessibility to Major Roads/Highways",
    "Distance to Key Amenities",
    "Zoning",
    "Buildability",
    "Fencing",
    "Power Backup Options",
    "On-Site Structures",
    "Irrigation Systems",
    "Gated Access",
    "Security Systems",
    "Lighting",
    "Landscaping",
    "Trails",
    "Recreational Areas",
    "Sports Facilities",
    "Farmland Suitability",
    "Existing Orchards/Plantations",
    "Animal Grazing Areas",
    "Farm Equipment Storage",
    "Land Ownership Status",
    "Surveys and Title Deeds",
    "Historical/Cultural Value",
    "Shared Amenities",
    "HOA Services",
  ];

  const handleChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedAmenities([...selectedAmenities, value]);
    } else {
      setSelectedAmenities(selectedAmenities.filter((amenity) => amenity !== value));
    }
  };

  return (
    <div className="col-span-1 md:col-span-3">
      <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">Amenities</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {amenities.map((amenity) => (
          <label key={amenity} className="flex items-center">
            <input
              type="checkbox"
              value={amenity}
              checked={selectedAmenities.includes(amenity)}
              onChange={handleChange}
              className="mr-2"
            />
            {amenity}
          </label>
        ))}
      </div>
    </div>
  );
};

export default LandAmenities;