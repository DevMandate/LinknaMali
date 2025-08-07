import React from "react";
import { Building, Map, Calendar, CheckCircle } from "lucide-react";

const OverviewSection = ({ project }) => {
  return (
    <div className="container mx-auto px-4 sm:px-8 md:px-16 py-12 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-start">
        <div>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light mb-6 sm:mb-8"
            style={{ color: "var(--text)" }}
          >
            Project <span style={{ color: "var(--merime-theme)" }}>Overview</span>
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
                <Map
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
      </div>
    </div>
  );
};

export default OverviewSection;