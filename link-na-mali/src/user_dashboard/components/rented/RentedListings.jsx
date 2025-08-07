import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../cards";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ShareButton from "../listings/ShareListings";
import DropdownMenu from "../listings/DropdownMenu";
import ExpandedCardDetails from "../listings/ExpandedCardDetails";
import EditFormRenderer from "../listings/EditFormRenderer";
import Details from "../listings/ViewListing";
import Bookings from "../bookings/main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RentedListings = () => {
  const { userData } = useAppContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [previewProperty, setPreviewProperty] = useState(null);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const dropdownRefs = useRef({});
  const navigate = useNavigate();

  const isVideo = useCallback((url) => {
    const videoExtensions = [".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm"];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }, []);

  const fetchRentedListings = useCallback(async () => {
    if (!userData?.user_id) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.linknamali.ke/property/get-user-listings-by-status/${userData.user_id}?status=rented`
      );
      const fetched = response?.data?.data || [];

      const processed = fetched.map((p) => {
        const cover = p.cover_image_url;
        const media = [
          ...(cover ? [cover] : []),
          ...((p.images || []).filter((img) => img !== cover)),
          ...(p.videos || []),
        ];
        return { ...p, media };
      });

      setListings(processed);
    } catch (err) {
      console.error("Error fetching rented listings:", err);
      setError("Failed to fetch rented listings.");
    } finally {
      setLoading(false);
    }
  }, [userData?.user_id]);

  useEffect(() => {
    fetchRentedListings();
  }, [fetchRentedListings]);

  const toggleDropdown = (id) => {
    setDropdownOpen((prev) => (prev === id ? null : id));
  };

  const viewListing = (property) => setPreviewProperty(property);
  const bookListing = (property) => setBookingProperty(property);
  const editProperty = (property) => setSelectedProperty(property);
  const closeModal = () => {
    setPreviewProperty(null);
    setBookingProperty(null);
    setSelectedProperty(null);
  };

  const toggleCardContent = (id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (property) => {
    if (!window.confirm("Delete this listing permanently?")) return;

    try {
      const propertyType = (
        property.category ||
        property.propertyType ||
        property.property_type ||
        ""
      ).toLowerCase();

      const deleteEndpoints = {
        apartments: "/deleteapartment",
        houses: "/deletehouse",
        land: "/deleteland",
        commercial: "/deletecommercial",
      };

      if (!deleteEndpoints[propertyType]) {
        toast.error("Unknown property type.");
        return;
      }

      await axios.delete(`https://api.linknamali.ke${deleteEndpoints[propertyType]}`, {
        headers: { "Content-Type": "application/json" },
        data: { id: property.id, user_id: userData.user_id },
      });

      toast.success("Listing deleted!");
      setListings((prev) => prev.filter((p) => p.id !== property.id));
    } catch (err) {
      toast.error("Error deleting listing.");
      console.error(err);
    }
  };

  const performArchive = async (property) => {
    const willUnarchive = property.deleted === 1;
    const action = willUnarchive ? "unarchive" : "softdeletelisting";

    const rawType = (
      property.category ||
      property.propertyType ||
      property.property_type ||
      ""
    ).toLowerCase();

    const typeMap = {
      apartment: "apartments",
      house: "houses",
      land: "land",
      commercial: "commercial",
      apartments: "apartments",
      houses: "houses",
    };

    const endpointType = typeMap[rawType] || (rawType.endsWith("s") ? rawType : `${rawType}s`);
    const url = `https://api.linknamali.ke/listings/${action}/${endpointType}/${property.id}`;

    try {
      await axios.post(
        url,
        { user_id: userData.user_id },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success(`Property ${willUnarchive ? "unarchived" : "archived"}!`);
      fetchRentedListings();
    } catch (err) {
      toast.error("Archive action failed.");
      console.error(err);
    }
  };

  const handleArchiveClick = (property) => {
    if (property.deleted === 1) {
      performArchive(property);
    } else {
      setArchiveTarget(property);
      setShowArchiveModal(true);
    }
  };

  const confirmArchive = () => {
    if (archiveTarget) {
      performArchive(archiveTarget);
      setArchiveTarget(null);
    }
    setShowArchiveModal(false);
  };

  const cancelArchive = () => {
    setArchiveTarget(null);
    setShowArchiveModal(false);
  };

  return (
    <div className="max-w-full mx-auto mt-8 p-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Rented Listings</h2>

      {loading && <p className="text-center text-lg text-gray-600">Loading rented listings...</p>}
      {error && <p className="text-center text-lg text-red-600">{error}</p>}
      {!loading && listings.length === 0 && (
        <p className="text-center text-gray-600 text-lg mt-10">
          No rented listings available.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.map((property) => (
          <Card
            key={property.id}
            className="p-4 relative border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
          >
            <CardHeader className="flex justify-between items-center mb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 truncate pr-8">
                {property.title}
              </CardTitle>
              <div
                className="relative"
                ref={(el) => (dropdownRefs.current[property.id] = el)}
              >
                <FontAwesomeIcon
                  icon={faEllipsisV}
                  className="cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={() => toggleDropdown(property.id)}
                />
                {dropdownOpen === property.id && (
                  <DropdownMenu
                    property={property}
                    handleDelete={handleDelete}
                    editProperty={editProperty}
                    viewBookings={() => bookListing(property)}
                    viewInquiries={() =>
                      navigate("/user-dashboard", {
                        state: { activeSection: "inquiries", property_id: property.id },
                      })
                    }
                    viewListing={() => viewListing(property)}
                    bookListing={() => bookListing(property)}
                    handleArchiveClick={() => handleArchiveClick(property)}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent>
              {property.media && property.media.length > 0 ? (
                <Carousel showThumbs={false} infiniteLoop useKeyboardArrows>
                  {property.media.map((mediaUrl, idx) => (
                    <div key={idx} className="h-48 flex items-center justify-center bg-gray-100">
                      {isVideo(mediaUrl) ? (
                        <video
                          src={mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`${property.title} - ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = "/default-placeholder.jpg")}
                        />
                      )}
                    </div>
                  ))}
                </Carousel>
              ) : (
                <img
                  src="/default-placeholder.jpg"
                  alt="No media"
                  className="w-full h-48 object-cover mb-4 rounded-lg"
                />
              )}

              <hr className="my-4 border-gray-200" />

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => toggleCardContent(property.id)}
                  className="font-medium text-sm text-[#29327E] hover:text-[#8080A0]"
                >
                  {expandedCard === property.id ? "Hide Details" : "View Details"}
                </button>
                <ShareButton data={property} />
              </div>

              {expandedCard === property.id && (
                <ExpandedCardDetails property={property} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Warning</h3>
            <p className="text-gray-700 mb-6">
              Archiving a property will permanently delete it if it remains archived for 30 days.
              Do you wish to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelArchive}
                className="px-4 py-2 bg-gray-200 rounded text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 bg-red-600 rounded text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
            >
              &times;
            </button>
            <EditFormRenderer property={selectedProperty} onClose={closeModal} onUpdate={fetchRentedListings} />
          </div>
        </div>
      )}

      {previewProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
            >
              &times;
            </button>
            <Details detailsDisplay={previewProperty} />
          </div>
        </div>
      )}

      {bookingProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
            >
              &times;
            </button>
            <Bookings Booking={bookingProperty} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RentedListings;
