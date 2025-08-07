import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { Card, CardHeader, CardTitle, CardContent } from "../cards";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import "./Mylistings.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import ShareButton from "./ShareListings";
import Details from "./ViewListing";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Bookings from "../bookings/main";
import DropdownMenu from "./DropdownMenu";
import EditFormRenderer from "./EditFormRenderer";
import ExpandedCardDetails from "./ExpandedCardDetails";
import AvailabilityToggle from "./AvailabilityToggle";

const MyListings = () => {
  const { userData } = useAppContext();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewProperty, setPreviewProperty] = useState(null);
  const [availability, setAvailability] = useState({});
  const [filter, setFilter] = useState("approved"); // 'approved', 'pending', 'archived', 'verified'

  // New state for warning modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRefs = useRef({});

  // Memoized helper to determine if a URL points to a video
  const isVideo = useCallback((url) => {
    const videoExtensions = [".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm"];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  }, []);

  // Fetch properties for the logged-in user
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axios.get(
        `https://api.linknamali.ke/property/getpropertybyuserid?user_id=${userData.user_id}`
      );
      const fetchedProperties = response?.data?.data || [];

      const processedProperties = fetchedProperties.map((p) => {
        const cover = p.cover_image_url;
        const media = [
          ...(cover ? [cover] : []),
          ...((p.images || []).filter((img) => img !== cover)),
          ...(p.videos || [])
        ];

        return {
          ...p,
          media,
        };
      });

      setProperties(processedProperties);

      // Initialize availability state based on the `display` field
      const initialAvailability = {};
      processedProperties.forEach((property) => {
        initialAvailability[property.id] = property.display === 1;
      });
      setAvailability(initialAvailability);

    } catch (err) {
      console.error("Error fetching properties:", err);
      setError(
        err.response?.data?.message || "Failed to fetch properties."
      );
    } finally {
      setLoading(false);
    }
  }, [userData.user_id]);

  useEffect(() => {
    if (userData?.user_id) {
      fetchProperties();
    }
  }, [userData, fetchProperties]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRefs.current &&
        !Object.values(dropdownRefs.current).some(
          (ref) => ref && ref.contains(event.target)
        )
      ) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Display success messages using toast
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setSuccessMessage("");
    }
  }, [successMessage]);

  // Scroll to and highlight specific listing if navigated from elsewhere
  useEffect(() => {
    const targetId = location.state?.editId || location.state?.listingId;
    if (targetId && properties.length > 0) {
      const element = document.getElementById(`listing-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.style.animation = "pulseHighlight 10s ease-in-out infinite";
        element.style.border = "2px solid #007bff";
        const timer = setTimeout(() => {
          element.style.animation = "";
          element.style.border = "";
        }, 20000);
        return () => clearTimeout(timer);
      }
    }
  }, [location.state, properties]);

  const handleDelete = useCallback(async (property) => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
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
        toast.error(`Error: Unknown property category - ${propertyType}`);
        return;
      }

      const response = await axios.delete(
        `https://api.linknamali.ke${deleteEndpoints[propertyType]}`,
        {
          headers: { "Content-Type": "application/json" },
          data: { id: property.id, user_id: userData.user_id },
        }
      );

      if (response.status === 200) {
        setProperties((prev) => prev.filter((p) => p.id !== property.id));
        toast.success("Property deleted successfully!");
      } else {
        toast.error("Failed to delete property. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting property:", err);
      toast.error("An error occurred while deleting the property.");
    } finally {
      setDeleting(false);
    }
  }, [userData.user_id]);

  const editProperty = useCallback((property) => {
    setSelectedProperty(property);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProperty(null);
    setPreviewProperty(null);
    setBookingProperty(null);
  }, []);

  const handleUpdate = useCallback(async () => {
    await fetchProperties();
    closeModal();
  }, [fetchProperties, closeModal]);

  const checkBookings = useCallback(async (propertyId) => {
    try {
      const response = await axios.get(
        `https://api.linknamali.ke/bookings/check?property_id=${propertyId}`
      );
      return response.data.hasBookings;
    } catch (err) {
      console.error("Error checking bookings:", err);
      return false;
    }
  }, []);

  const checkInquiries = useCallback(async (propertyId) => {
    try {
      const response = await axios.get(
        `https://api.linknamali.ke/inquiries/check?property_id=${propertyId}`
      );
      return response.data.hasInquiries;
    } catch (err) {
      console.error("Error checking inquiries:", err);
      return false;
    }
  }, []);

  const viewBookings = useCallback(async (property) => {
    const hasBookings = await checkBookings(property.id);
    if (hasBookings) {
      navigate("/user-dashboard", {
        state: {
          activeSection: "bookings",
          property_id: property.id,
          property_type: property.category || property.property_type,
        },
      });
    } else {
      toast.info("No bookings available for this listing at the moment.");
    }
  }, [checkBookings, navigate]);

  const viewInquiries = useCallback(async (property) => {
    const hasInquiries = await checkInquiries(property.id);
    if (hasInquiries) {
      navigate("/user-dashboard", {
        state: { activeSection: "inquiries", property_id: property.id },
      });
    } else {
      toast.info("No inquiries available for this listing at the moment.");
    }
  }, [checkInquiries, navigate]);

  const viewListing = useCallback((property) => {
    setPreviewProperty(property);
  }, []);

  const bookListing = useCallback((property) => {
    setBookingProperty(property);
  }, []);

  const toggleCardContent = useCallback((id) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  }, []);

    // …other hooks and state…

  // Actually perform archive/unarchive API call
  const performArchive = useCallback(async (property) => {
    const willUnarchive = property.deleted === 1;
    const actionLabel = willUnarchive ? "unarchive" : "archive";

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
    const action = willUnarchive ? "unarchive" : "softdeletelisting";
    const url = `https://api.linknamali.ke/listings/${action}/${endpointType}/${property.id}`;

    try {
      const response = await axios.post(
        url,
        { user_id: userData.user_id },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status !== 200) {
        toast.error(`Couldn’t ${actionLabel}—please try again.`);
        return;
      }

      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id
            ? { ...p, deleted: willUnarchive ? 0 : 1 }
            : p
        )
      );
      toast.success(`Property ${actionLabel}d successfully!`);
      fetchProperties();
    } catch (err) {
      console.error(`[${actionLabel}] error:`, err.response || err);
      const msg = err.response?.data?.message;
      toast.error(msg ? `Error: ${msg}` : `Server error. Failed to ${actionLabel} property.`);
    }
  }, [userData.user_id, fetchProperties]);

  // Archive/unarchive handler with warning modal
  const handleArchiveClick = useCallback((property) => {
    const willUnarchive = property.deleted === 1;
    if (!willUnarchive) {
      setArchiveTarget(property);
      setShowArchiveModal(true);
    } else {
      // Directly unarchive if already archived
      performArchive(property);
    }
  }, [performArchive]);
   const toggleDropdown = useCallback((id) => {
    setDropdownOpen((prev) => (prev === id ? null : id));
  }, []);

  // Confirm or cancel archive from modal
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


  // Filter properties based on the selected filter
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      if (filter === "approved") {
        return property.is_approved === "approved" && property.deleted !== 1;
      } else if (filter === "pending") {
        return property.is_approved === "pending" && property.deleted !== 1;
      } else if (filter === "archived") {
        return property.deleted === 1;
      } else if (filter === "verified") {
        return property.manually_verified === 1;
      }
      return false;
    });
  }, [properties, filter]);

  return (
    <div className="max-w-full mx-auto mt-8 p-4">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Properties</h2>

      {/* Filter Buttons */}
      <div className="flex space-x-3 mb-6 flex-wrap">
        {[
          { label: "Approved", value: "approved" },
          { label: "Pending", value: "pending" },
          { label: "Archived", value: "archived" },
          { label: "Verified", value: "verified" },
        ].map((item) => (
          <button
            key={item.value}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
              filter === item.value
                ? "bg-[#29327E] text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-[#8080A0] hover:text-white"
            }`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>


      {loading && (
        <p className="text-center text-lg text-gray-600">Loading properties...</p>
      )}
      {error && <p className="text-center text-lg text-red-600">{error}</p>}
      {!loading && filteredProperties.length === 0 && (
        <p className="text-gray-600 text-center text-lg mt-10">
          No {filter} listings found.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProperties.map((property) => (
          <Card
            key={property.id}
            id={`listing-${property.id}`}
            className="p-4 relative border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
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
                    viewBookings={viewBookings}
                    viewInquiries={viewInquiries}
                    viewListing={viewListing}
                    bookListing={bookListing}
                    deleting={deleting}
                    handleArchiveClick={handleArchiveClick}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Media Carousel */}
              {property.media && property.media.length > 0 ? (
                <Carousel
                  showThumbs={false}
                  infiniteLoop
                  useKeyboardArrows
                  className="rounded-lg overflow-hidden mb-4"
                >
                  {property.media.map((mediaUrl, idx) => (
                    <div
                      key={idx}
                      className="h-48 flex items-center justify-center bg-gray-100"
                    >
                      {isVideo(mediaUrl) ? (
                        <video
                          src={mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`${property.title} - ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/default-placeholder.jpg";
                          }}
                        />
                      )}
                    </div>
                  ))}
                </Carousel>
              ) : (
                <img
                  src="/default-placeholder.jpg"
                  alt="No media available"
                  className="w-full h-48 object-cover mb-4 rounded-lg"
                />
              )}

              <hr className="my-4 border-gray-200" />

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => toggleCardContent(property.id)}
                  className="font-medium text-sm bg-transparent text-[#29327E] hover:text-[#8080A0] transition-colors duration-200"
                >
                  {expandedCard === property.id ? "Hide Details" : "View Details"}
                </button>

                <ShareButton data={property} />
              </div>


              {expandedCard === property.id && (
                <ExpandedCardDetails property={property} />
              )}

              {/* Availability Toggle - Only show for non-archived properties */}
              {filter !== "archived" && (
                <AvailabilityToggle
                  propertyType={
                    property.property_type ||
                    property.propertyType ||
                    property.category
                  }
                  propertyId={property.id}
                  availability={availability}
                  setAvailability={setAvailability}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning Modal for Archiving */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <div className="flex items-start mb-4">
              <svg
                className="w-6 h-6 text-red-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-600">Warning</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Archiving a property will permanently delete it if it remains archived for 30 days.
              Do you wish to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelArchive}
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="close-button absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
              aria-label="Close booking modal"
            >
              &times;
            </button>
            <Bookings Booking={bookingProperty} />
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {selectedProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="close-button absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
              aria-label="Close edit modal"
            >
              &times;
            </button>
            <EditFormRenderer
              property={selectedProperty}
              onUpdate={handleUpdate}
              onClose={closeModal}
            />
          </div>
        </div>
      )}

      {/* Preview Property Modal */}
      {previewProperty && (
        <div className="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6">
            <button
              className="close-button absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-3xl font-bold"
              onClick={closeModal}
              aria-label="Close preview modal"
            >
              &times;
            </button>
            <Details detailsDisplay={previewProperty} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
