import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  HeroSection,
  UnitsSection,
  ContactSection,
  GalleryModal,
  InterestModal,
} from "../components/project";
import {
  MapPin,
  Calendar,
  Building,
  Users,
  CheckCircle,
  Download,
  Star,
  Phone,
  Mail,
  Shield,
  Droplets,
  Trees,
  Building2,
  Map as MapIcon,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Car,
  Zap,
  Eye,
  Home,
  Wifi,
} from "lucide-react";

const BASE_URL = "https://api.linknamali.ke";

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emailAddress: "",
  });
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // New states for form validation
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/projects/projectsproperties/${id}`
        );
        setProject(response.data.project);
        setError(null);
      } catch (err) {
        console.error("Error loading project:", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showGallery) return;
      if (e.key === "Escape") {
        handleCloseGallery();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showGallery, galleryImages.length]);

  // Function to get appropriate icon for amenity
  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    
    if (amenityLower.includes('security')) return Shield;
    if (amenityLower.includes('water') || amenityLower.includes('supply')) return Droplets;
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return Car;
    if (amenityLower.includes('generator') || amenityLower.includes('backup') || amenityLower.includes('power')) return Zap;
    if (amenityLower.includes('cctv') || amenityLower.includes('surveillance') || amenityLower.includes('camera')) return Eye;
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return Building2;
    if (amenityLower.includes('pool') || amenityLower.includes('swimming')) return Droplets;
    if (amenityLower.includes('playground') || amenityLower.includes('garden') || amenityLower.includes('green')) return Trees;
    if (amenityLower.includes('internet') || amenityLower.includes('wifi')) return Wifi;
    if (amenityLower.includes('retail') || amenityLower.includes('shopping')) return Building2;
    
    // Default icon
    return Home;
  };

  // Validation helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    // Kenyan phone number validation (supports various formats)
    const phoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const validateForm = (formData) => {
    const errors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    // Phone Number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid Kenyan phone number";
    }

    // Email validation
    if (!formData.emailAddress.trim()) {
      errors.emailAddress = "Email address is required";
    } else if (!validateEmail(formData.emailAddress)) {
      errors.emailAddress = "Please enter a valid email address";
    }

    return errors;
  };

  const getAllUnits = () => {
    if (!project) return [];
    console.log("Project data:", project);
    
    const allUnits = [];
    const addUnits = (units, type) => {
      if (Array.isArray(units)) {
        units.forEach((unit) => {
          if (unit && typeof unit === "object") {
            allUnits.push({ ...unit, type });
          } else {
            console.warn(`Invalid unit in ${type}:`, unit);
          }
        });
      }
    };
    addUnits(project.apartments, "Apartment");
    addUnits(project.houses, "House");
    addUnits(project.land, "Land");
    addUnits(project.commercial, "Commercial Unit");
    return allUnits;
  };

  const handleInterestClick = (unit) => {
    setSelectedUnit(unit);
    setShowModal(true);
  };

  // Enhanced handleCloseModal to clear errors
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUnit(null);
    setFormData({
      firstName: "",
      lastName: "",
      phoneNumber: "",
      emailAddress: "",
    });
    setFormErrors({}); // Clear errors
    setIsSubmitting(false);
  };

  // Enhanced handleInputChange to clear field error on change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // HandleSubmit Interest Submit
  const handleSubmit = async () => {
    // Clear previous errors
    setFormErrors({});

    // Validate form
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(
        `input[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.focus();
      }
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare submission data for the API
      const submissionData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        emailAddress: formData.emailAddress.trim().toLowerCase(),
        project_id: id,
      };

      // Make API call to submit interest
      const response = await fetch(`${BASE_URL}/projects/submitinterest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
        credentials: "include",
      });

      if (response.status === 201) {
        // Success feedback
        alert(
          "Thank you for your interest! We will contact you shortly. A confirmation email has been sent to your email address."
        );

        // Close modal and reset form
        handleCloseModal();
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Error submitting form:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data?.response ||
          error.response.data?.message ||
          "Server error occurred";
        alert(`Sorry, there was an error: ${errorMessage}. Please try again.`);
      } else if (error.request) {
        // Network error
        alert(
          "Sorry, there was a network error. Please check your connection and try again."
        );
      } else {
        // Other error
        alert(
          "Sorry, there was an error submitting your request. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewGallery = (unit) => {
    const images = [];
    if (unit.image_url) {
      images.push({
        url: unit.image_url,
        caption: `${
          unit.title || unit.name || unit.type || "Unit"
        } - Main View`,
      });
    }
    if (unit.cover_image && unit.cover_image !== unit.image_url) {
      images.push({
        url: unit.cover_image,
        caption: `${
          unit.title || unit.name || unit.type || "Unit"
        } - Cover View`,
      });
    }
    if (unit.images && Array.isArray(unit.images)) {
      unit.images.forEach((img, index) => {
        images.push({
          url: typeof img === "string" ? img : img.url || img.image_url,
          caption: `${unit.title || unit.name || unit.type || "Unit"} - View ${
            index + 1
          }`,
        });
      });
    }
    if (images.length === 0) {
      images.push({
        url: "/placeholder.jpg",
        caption: `${
          unit.title || unit.name || unit.type || "Unit"
        } - No images available`,
      });
    }
    setGalleryImages(images);
    setCurrentImageIndex(0);
    setShowGallery(true);
  };

  const handleCloseGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  const allUnits = getAllUnits();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection project={project} />
      <div className="container mx-auto px-4 sm:px-8 md:px-16 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">
          {/* Left Column - Project Details */}
          <div>
            <h2
              className="text-2xl sm:text-4xl md:text-5xl font-light mb-6 sm:mb-8"
              style={{ color: "var(--text)" }}
            >
              Project
              <span style={{ color: "var(--merime-theme)" }}> Overview</span>
            </h2>
            <p className="text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 text-gray-700">
              {project.description}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="p-3 sm:p-4 rounded-xl bg-white shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-1 text-gray-600">
                      No. of units
                    </p>
                    <p
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: "var(--merime-theme)" }}
                    >
                      {project.number_of_units}
                    </p>
                  </div>
                  <Building
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "var(--merime-theme)" }}
                  />
                </div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-white shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium mb-1 text-gray-600">
                      Status
                    </p>
                    <p
                      className="text-xl sm:text-2xl font-bold"
                      style={{ color: "var(--merime-theme)" }}
                    >
                      {project.status}
                    </p>
                  </div>
                  <MapIcon
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    style={{ color: "var(--merime-theme)" }}
                  />
                </div>
              </div>
            </div>
            {(project.start_date || project.end_date) && (
              <div className="p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 bg-white shadow-lg border border-gray-100">
                <h3
                  className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
                  style={{ color: "var(--text)" }}
                >
                  Project Timeline:
                </h3>
                {project.start_date && (
                  <div className="flex items-center mb-2">
                    <Calendar
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-3"
                      style={{ color: "var(--merime-theme)" }}
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      <strong>Start Date:</strong>{" "}
                      {new Date(project.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex items-center">
                    <Calendar
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-3"
                      style={{ color: "var(--merime-theme)" }}
                    />
                    <span className="text-sm sm:text-base text-gray-700">
                      <strong>End Date:</strong>{" "}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 bg-white shadow-lg border border-gray-100">
              <h3
                className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
                style={{ color: "var(--text)" }}
              >
                Attractive payment plan:
              </h3>
              <div className="flex items-center mb-3 sm:mb-4">
                <CheckCircle
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-3"
                  style={{ color: "var(--merime-theme)" }}
                />
                <span className="text-sm sm:text-base text-gray-700">
                  10% on signing the letter of offer and balance in equal
                  installments within 12 months
                </span>
              </div>
              <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-gray-600">
                Financing Options available:
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-700">
                We also offer financing solutions through the Kenya Mortgage
                Refinance Company (KMRC), SACCOs, and a variety of trusted
                banking partners to make homeownership even more accessible.
              </p>
            </div>
          </div>
          {/* Right Column - Amenities */}
          <div>
            <h3
              className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8"
              style={{ color: "var(--text)" }}
            >
              Premium{" "}
              <span style={{ color: "var(--merime-theme)" }}>Amenities</span>
            </h3>
            {project.amenities?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {project.amenities.map((amenity, index) => {
                  const IconComponent = getAmenityIcon(amenity);
                  return (
                    <div
                      key={index}
                      className="text-center p-4 sm:p-6 rounded-2xl group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white border border-gray-100"
                      style={{ borderColor: "var(--merime-theme)" }}
                    >
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        style={{ backgroundColor: "var(--merime-theme)" }}
                      >
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h4 className="font-medium text-xs sm:text-sm text-gray-800">
                        {amenity}
                      </h4>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 rounded-2xl bg-white border border-gray-100">
                <p className="text-gray-500">No amenities data available for this project.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <UnitsSection
        units={allUnits}
        handleInterestClick={handleInterestClick}
        handleViewGallery={handleViewGallery}
      />
      <ContactSection />
      <GalleryModal
        showGallery={showGallery}
        galleryImages={galleryImages}
        currentImageIndex={currentImageIndex}
        handleCloseGallery={handleCloseGallery}
        handlePrevImage={handlePrevImage}
        handleNextImage={handleNextImage}
      />
      <InterestModal
        showModal={showModal}
        selectedUnit={selectedUnit}
        formData={formData}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        handleCloseModal={handleCloseModal}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
      <style jsx>{`
        :root {
          --merime-theme: #3b82f6;
          --text: #1f2937;
        }
        input:focus {
          border-color: var(--merime-theme) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;