import React from "react";
import ApartmentForm from "../editforms/ApartmentForm";
import HouseForm from "../editforms/HouseForm";
import LandForm from "../editforms/LandForm";
import CommercialForm from "../editforms/CommercialForm";

const EditFormRenderer = ({ property, onUpdate, onClose }) => {
  const propertyType = (
    property?.propertyType ||
    property?.property_type ||
    ""
  ).toLowerCase();

  switch (propertyType) {
    case "apartment":
    case "apartments":
      return (
        <ApartmentForm
          property={property}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case "house":
    case "houses":
      return (
        <HouseForm
          property={property}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case "land":
      return (
        <LandForm
          property={property}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    case "commercial":
      return (
        <CommercialForm
          property={property}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );
    default:
      return <div>No form found for this property type.</div>;
  }
};

export default EditFormRenderer;