import React from "react";

const DropdownMenu = ({
  property,
  handleDelete,
  editProperty,
  viewBookings,
  viewInquiries,
  viewListing,
  bookListing,
  deleting,
  handleArchiveClick,
}) => {
  return (
    <div
      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 transition-opacity duration-300 opacity-100"
      onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from propagating
    >
      <div
        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={() => editProperty(property)}
      >
        Edit
      </div>
      <div
        className={`py-2 px-4 hover:bg-red-100 cursor-pointer ${
          deleting ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={() => !deleting && handleDelete(property)}
      >
        {deleting ? "Deleting..." : "Delete"}
      </div>
      <div
  className={`py-2 px-4 hover:bg-gray-100 cursor-pointer ${
    deleting ? "opacity-50 cursor-not-allowed" : ""
  }`}
  onClick={() => !deleting && handleArchiveClick(property)}
>
  {deleting ? "Processing..." : property?.deleted === 1 ? "Unarchive" : "Archive"}
</div>
      <div
        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={() => viewBookings(property)}
      >
        View Bookings
      </div>
      <div
        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={() => viewInquiries(property)}
      >
        View Inquiries
      </div>
      <div
        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={() => viewListing(property)}
      >
        View Listing
      </div>
      <div
        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
        onClick={() => bookListing(property)}
      >
        Book Listing
      </div>
    </div>
  );
};

export default DropdownMenu;