import React, { useState, useEffect } from "react";

const PRIMARY_COLOR = "#29327E";

const DropdownMenu = ({
  property,
  handleDelete,
  editProperty,
  viewInquiries,
  viewListing,
  payForAd,
  deleting,
  handleArchiveClick,
  PreviewAd,
}) => {
  const [archived, setArchived] = useState(property?.deleted === 1);
  const isDisabled = deleting;
  const menuItem =
    "py-2 px-4 hover:bg-gray-100 cursor-pointer transition-colors";

  useEffect(() => {
    setArchived(property?.deleted === 1);
  }, [property]);

  const handleArchiveToggle = async () => {
    if (isDisabled) return;
    const success = await handleArchiveClick(property);
    if (success) {
      setArchived(!archived);
    }
  };

  return (
    <div
      role="menu"
      className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10 transition-opacity duration-300 opacity-100"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ color: PRIMARY_COLOR }}
    >
      {/* Edit */}
      <div
        className={`${menuItem} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !isDisabled && editProperty(property)}
        aria-disabled={isDisabled}
      >
        Edit
      </div>

      {/* Delete */}
      <div
        className={`${menuItem} hover:bg-red-100 ${
          isDisabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !isDisabled && handleDelete(property)}
        aria-disabled={isDisabled}
        style={{ color: isDisabled ? PRIMARY_COLOR : PRIMARY_COLOR }}
      >
        {isDisabled ? "Deleting..." : "Delete"}
      </div>

      {/* View Inquiries */}
      <div
        className={menuItem}
        onClick={() => viewInquiries(property)}
      >
        View Inquiries
      </div>

      {/* Preview Ad */}
      <div
        className={menuItem}
        onClick={() => PreviewAd(property)}
      >
        Preview Ad
      </div>

      {/* Pay for Ad */}
      <div
        className="py-2 px-4 hover:bg-green-100 cursor-pointer"
        onClick={() => payForAd(property)}
      >
        Pay for Ad
      </div>
    </div>
  );
};

export default DropdownMenu;
