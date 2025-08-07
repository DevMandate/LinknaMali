import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ArchiveProperty = ({ rawType, property, userData, setProperties, setSuccessMessage }) => {
  const [isArchived, setIsArchived] = useState(property.deleted === 1);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Map known type keywords to backend endpoint keys
  const typeMap = {
    apartment: 'apartments',
    apartments: 'apartments',
    house: 'houses',
    houses: 'houses',
    land: 'land',
    commercial: 'commercial',
  };

  // Always derive a plural endpoint type (fallback: add 's')
  const getEndpointType = () => {
    const key = rawType.toLowerCase();
    if (typeMap[key]) return typeMap[key];
    return key.endsWith('s') ? key : `${key}s`;
  };

  // Fetch archived (deleted) properties
  const fetchArchivedProperties = async () => {
    const endpointType = getEndpointType();
    const url = `https://api.linknamali.ke/listings/archived/${endpointType}/${userData.user_id}`;
    console.log('[Fetch Archived Properties] GET →', url);
    try {
      const response = await axios.get(url);
      if (response.status === 200) setProperties(response.data.data);
      else console.warn('[Fetch Archived Properties] unexpected status:', response.status);
    } catch (error) {
      console.error('[Fetch Archived Properties] error:', error.response || error);
      alert('Failed to fetch archived properties. Please try again later.');
    }
  };

  // Fetch active (non-deleted) properties
  const fetchActiveProperties = async () => {
    const endpointType = getEndpointType();
    const url = `https://api.linknamali.ke/listings/${endpointType}/${userData.user_id}`;
    console.log('[Fetch Active Properties] GET →', url);
    try {
      const response = await axios.get(url);
      if (response.status === 200) setProperties(response.data.data);
      else console.warn('[Fetch Active Properties] unexpected status:', response.status);
    } catch (error) {
      console.error('[Fetch Active Properties] error:', error.response || error);
      alert('Failed to fetch active properties. Please try again later.');
    }
  };

  // Actually perform the archive/unarchive API call
  const performArchiveToggle = async () => {
    const endpointType = getEndpointType();
    const action = isArchived ? 'unarchive' : 'softdeletelisting';
    const url = `https://api.linknamali.ke/listings/${action}/${endpointType}/${property.id}`;
    console.log(
      `[${isArchived ? 'Unarchive' : 'Archive'}] POST →`, url, 'with user_id=', userData.user_id
    );
    try {
      const response = await axios.post(
        url,
        { user_id: userData.user_id },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.status === 200) {
        setSuccessMessage(
          isArchived ? 'Property unarchived successfully!' : 'Property archived successfully!'
        );
        setIsArchived(prev => !prev);
        // Refresh correct listing
        isArchived ? fetchActiveProperties() : fetchArchivedProperties();
      } else {
        console.warn(
          `[${isArchived ? 'Unarchive' : 'Archive'}] unexpected status:`, response.status
        );
        alert(`Couldn’t ${isArchived ? 'unarchive' : 'archive'}—please try again.`);
      }
    } catch (error) {
      console.error(
        `[${isArchived ? 'Unarchive' : 'Archive'}] error:`, error.response || error
      );
      const msg = error.response?.data?.message;
      alert(msg ? `Error: ${msg}` : 'Server error. Please try again later.');
    }
  };

  // Show the warning modal before archiving
  const handleArchiveClick = () => {
    if (!isArchived) {
      setShowWarningModal(true);
    } else {
      performArchiveToggle(); // Directly unarchive if already archived
    }
  };

  // When user confirms in modal, proceed to archive
  const confirmArchive = () => {
    setShowWarningModal(false);
    performArchiveToggle();
  };

  // Cancel modal without archiving
  const cancelArchive = () => {
    setShowWarningModal(false);
  };

  useEffect(() => {
    if (isArchived) fetchArchivedProperties();
  }, [isArchived]);

  return (
    <>
      <button
        onClick={handleArchiveClick}
        className={`px-4 py-2 rounded text-white ${
          isArchived ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isArchived ? 'Unarchive Property' : 'Archive Property'}
      </button>

      {showWarningModal && (
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
    </>
  );
};

export default ArchiveProperty;
