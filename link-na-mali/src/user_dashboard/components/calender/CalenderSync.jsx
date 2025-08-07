import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../../context/AppContext";
import { Calendar, Settings, Plus, Trash2, RefreshCw, HelpCircle, X } from "lucide-react";

const PRIMARY_COLOR = "#29327E";

const CalendarSync = () => {
  const [phase, setPhase] = useState("manage"); // 'manage' or 'settings'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { userData } = useAppContext();
  const [properties, setProperties] = useState([]);
  const [externalCalendars, setExternalCalendars] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.user_id) {
      fetchProperties();
    }
  }, [userData]);

  // Fetch external calendars when a property is selected
  useEffect(() => {
    if (selectedProperty) {
      fetchExternalCalendars(selectedProperty);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(
        `https://api.linknamali.ke/property/getpropertybyuserid?user_id=${userData.user_id}`
      );

      if (data.response === "Success") {
        setProperties(data.data || []);
      } else {
        setProperties([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProperties([]);
      } else {
        setError(
          err.response?.data?.response ||
            err.response?.data?.message ||
            "Unable to load listings."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalCalendars = async (propertyId) => {
    try {
      const response = await axios.get(
        `https://api.linknamali.ke/api/calender/properties/${propertyId}/external-calendars`
      );

      if (response.data.success) {
        setExternalCalendars(response.data.calendars || []);
      }
    } catch (err) {
      console.error("Error fetching external calendars:", err);
      setExternalCalendars([]);
    }
  };

  const addExternalCalendar = async (e) => {
    e.preventDefault();

    if (!selectedProperty || !selectedPlatform || !icalUrl) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `https://api.linknamali.ke/api/calender/properties/${selectedProperty}/external-calendars`,
        {
          platform_name: selectedPlatform,
          ical_url: icalUrl,
          property_type:
            properties.find((p) => p.id === selectedProperty)?.property_type ||
            "apartment",
          is_active: true,
        }
      );

      console.log("CALENDER SYNC RESPONSE: ", response);

      if (response.data.success) {
        setSuccess("External calendar added successfully and sync initiated!");
        // Reset form
        setSelectedPlatform("");
        setIcalUrl("");
        // Refresh the external calendars list
        fetchExternalCalendars(selectedProperty);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add external calendar"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteExternalCalendar = async (calendarId) => {
    if (
      !window.confirm("Are you sure you want to delete this calendar sync?")
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `https://api.linknamali.ke/api/calender/external-calendars/${calendarId}`
      );

      if (response.data.success) {
        setSuccess("External calendar deleted successfully");
        // Refresh the external calendars list
        if (selectedProperty) {
          fetchExternalCalendars(selectedProperty);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete external calendar"
      );
    }
  };

  const triggerManualSync = async (propertyId) => {
    setSyncLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `https://api.linknamali.ke/api/calender/properties/${propertyId}/sync`
      );

      if (response.data.success) {
        setSuccess("Calendar sync triggered successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to trigger sync");
    } finally {
      setSyncLoading(false);
    }
  };

  const triggerSyncAllCalendars = async () => {
    setSyncLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `https://api.linknamali.ke/api/calender/sync-all`
      );

      if (response.data.success) {
        setSuccess("All calendars sync triggered successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to trigger sync");
    } finally {
      setSyncLoading(false);
    }
  };

  const redirectToPropertyListing = () => {
    navigate("/user-dashboard/property-management", {
      state: { activeSection: "Create Listing" },
    });
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Help Modal Component
  const HelpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">How to Sync Calendars</h2>
          <button
            onClick={() => setShowHelpModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* What it does */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-blue-800 text-sm">
              <strong>What this does:</strong> Prevents double bookings by automatically blocking dates across all platforms when you get a reservation anywhere.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-[#29327E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div className="text-sm">
                <div className="font-semibold mb-1">Get your iCal URL:</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Airbnb:</strong> Calendar → Availability → Export calendar</div>
                  <div><strong>Booking.com:</strong> Extranet → Calendar → Sync calendars</div>
                  <div><strong>VRBO:</strong> Calendar → Import/Export → Export</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-[#29327E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div className="text-sm">
                <strong>Add to LinknaMali:</strong> Select property, choose platform, paste URL, click "Add Sync"
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="bg-[#29327E] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-sm">
                <strong>Done!</strong> Calendars sync every 30 minutes. Use "Sync All" for immediate updates.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowHelpModal(false)}
            className="w-full bg-[#29327E] hover:bg-[#1f2563] text-white py-2 px-4 rounded transition-colors duration-200"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full p-4">
      {/* Page Title and Button Group */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          {/* My Syncs Button */}
          <button
            onClick={() => setPhase("manage")}
            className={`
                            flex items-center font-bold py-2 px-4 rounded transition-colors duration-200
                            ${
                              phase === "manage"
                                ? "bg-[#29327E] hover:bg-[#29327E] text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }
                        `}
          >
            <Calendar className="mr-2" size={18} /> My Syncs
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setPhase("settings")}
            className={`
                            flex items-center font-bold py-2 px-4 rounded transition-colors duration-200
                            ${
                              phase === "settings"
                                ? "bg-[#29327E] hover:bg-[#29327E] text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }
                        `}
          >
            <Settings className="mr-2" size={18} /> Settings
          </button>
        </div>

        {/* How to Sync Button */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="flex items-center px-4 py-2 bg-white border-2 border-[#29327E] text-[#29327E] hover:bg-[#29327E] hover:text-white rounded transition-colors duration-200"
        >
          <HelpCircle className="mr-2" size={18} />
          How to Sync
        </button>
      </div>

      {/* Help Modal */}
      {showHelpModal && <HelpModal />}

      {/* Content based on selected phase */}
      {phase === "manage" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Calendar Synchronization</h3>
            <button
              onClick={triggerSyncAllCalendars}
              disabled={syncLoading}
              className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw
                className={`mr-1 ${syncLoading ? "animate-spin" : ""}`}
                size={14}
              />
              {syncLoading ? "Syncing..." : "Sync All"}
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Connect your external booking platforms to sync calendars
            automatically.
          </p>

          {/* Success Message */}
          {success && (
            <div className="text-green-600 text-sm mb-4 p-3 bg-green-50 border border-green-200 rounded">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          {/* Empty State */}
          {properties.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <div className="mb-4">
                <Calendar className="mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No properties yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first property listing
              </p>
              <button
                onClick={redirectToPropertyListing}
                className="inline-flex items-center px-4 py-2 bg-[#29327E] hover:bg-[#1f2563] text-white rounded-md transition-colors duration-200"
              >
                <Plus className="mr-2" size={16} />
                Add Property
              </button>
            </div>
          )}

          {/* Add New Sync Form - Only show if there are properties */}
          {properties.length > 0 && (
            <form onSubmit={addExternalCalendar} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Property
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  disabled={loading}
                  required
                >
                  <option value="">
                    {loading ? "Loading properties..." : "Choose a property..."}
                  </option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title || property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="">Choose platform...</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="VRBO">VRBO</option>
                  <option value="Expedia">Expedia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  iCal URL
                </label>
                <input
                  type="url"
                  value={icalUrl}
                  onChange={(e) => setIcalUrl(e.target.value)}
                  placeholder="Paste your iCal URL here..."
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-[#29327E] hover:bg-[#1f2563] text-white px-6 py-2 rounded transition-colors duration-200 disabled:opacity-50"
              >
                {submitLoading ? "Adding..." : "Add Sync"}
              </button>
            </form>
          )}

          {/* Existing External Calendars */}
          {selectedProperty && externalCalendars.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">
                Connected Calendars
              </h4>
              <div className="space-y-3">
                {externalCalendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {calendar.platform_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {calendar.ical_url}
                      </div>
                      <div className="text-xs text-gray-400">
                        Added:{" "}
                        {new Date(calendar.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          calendar.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {calendar.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => triggerManualSync(selectedProperty)}
                        disabled={syncLoading}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Trigger manual sync"
                      >
                        <RefreshCw
                          className={syncLoading ? "animate-spin" : ""}
                          size={14}
                        />
                      </button>
                      <button
                        onClick={() => deleteExternalCalendar(calendar.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete calendar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "settings" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Sync Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sync Frequency
              </label>
              <select className="border rounded px-3 py-2 w-full">
                <option>Every 30 minutes</option>
                <option>Every hour</option>
                <option>Every 2 hours</option>
                <option>Every 6 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Platform
              </label>
              <select className="border rounded px-3 py-2 w-full">
                <option>Booking.com</option>
                <option>Airbnb</option>
                <option>VRBO</option>
                <option>LinknaMali</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoSync"
                className="rounded"
                defaultChecked
              />
              <label
                htmlFor="autoSync"
                className="text-sm font-medium text-gray-700"
              >
                Enable automatic synchronization
              </label>
            </div>

            <button className="bg-[#29327E] hover:bg-[#1f2563] text-white px-6 py-2 rounded transition-colors duration-200">
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSync;