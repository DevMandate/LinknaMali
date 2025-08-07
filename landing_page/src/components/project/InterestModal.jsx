import React from "react";
import { X, Loader2 } from "lucide-react";

const InterestModal = ({
  showModal,
  selectedUnit,
  formData,
  formErrors = {},
  isSubmitting = false,
  handleCloseModal,
  handleInputChange,
  handleSubmit,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-xl sm:text-2xl font-semibold"
                style={{ color: "var(--text)" }}
              >
                Expression of Interest
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {selectedUnit?.name || selectedUnit?.type} -{" "}
                {selectedUnit?.price
                  ? `KES ${Number(selectedUnit?.price).toLocaleString()}`
                  : "Contact for pricing"}
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Please fill in the form below. We'll contact you shortly.
          </p>
          <div className="space-y-3 sm:space-y-4">
            {/* First Name Field */}
            <div>
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.firstName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 ml-1">
                  {formErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.lastName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 ml-1">
                  {formErrors.lastName}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <div>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number * (e.g., +254712345678)"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.phoneNumber
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.phoneNumber && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 ml-1">
                  {formErrors.phoneNumber}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <input
                type="email"
                name="emailAddress"
                placeholder="Email Address *"
                value={formData.emailAddress}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  formErrors.emailAddress
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {formErrors.emailAddress && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 ml-1">
                  {formErrors.emailAddress}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl mt-4 sm:mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              style={{ backgroundColor: "var(--merime-theme)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Details'
              )}
            </button>

            {/* Required fields note */}
            <p className="text-xs text-gray-500 mt-2 text-center">
              * Required fields
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestModal;