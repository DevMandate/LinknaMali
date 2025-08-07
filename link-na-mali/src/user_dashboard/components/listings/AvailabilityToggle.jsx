import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';

const AvailabilityToggle = ({
  propertyType,
  propertyId,
  availability = {},
  setAvailability = () => {}
}) => {
  // 1) Local state to drive the UI immediately
  const [available, setAvailable] = useState(
    availability[propertyId] ?? false
  );

  // 2) Whenever the parent’s map updates, sync it
  useEffect(() => {
    setAvailable(availability[propertyId] ?? false);
  }, [availability, propertyId]);

  const toggleAvailability = async () => {
    try {
      // optimistically flip the local state
      setAvailable(prev => !prev);

      const { data, status } = await axios.post(
        `https://api.linknamali.ke/property/toggle-display/${propertyType}/${propertyId}`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (status === 200) {
        const newDisplay = data.display;
        // 3) Sync back to parent
        setAvailability(prev => ({
          ...prev,
          [propertyId]: newDisplay
        }));
        toast.success(
          newDisplay
            ? '✅ Property is now available.'
            : '🚫 Property is now unavailable.'
        );
      } else {
        // rollback UI on error
        setAvailable(prev => !prev);
        toast.error(data.response || 'Failed to update availability.');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      // rollback UI on error
      setAvailable(prev => !prev);
      const msg =
        err.response?.data?.response ||
        err.response?.data?.message ||
        'Unknown error updating availability.';
      toast.error(msg);
    }
  };

  return (
    <div className="flex items-center mt-2">
      <label className="relative inline-block w-12 h-6">
        <input
          type="checkbox"
          checked={available}
          onChange={toggleAvailability}
          className="opacity-0 w-0 h-0 peer"
        />
        {/* Track */}
        <span
          className={`
            absolute inset-0 rounded-full transition-colors
            bg-gray-300 peer-checked:bg-green-500
          `}
        />
        {/* Thumb */}
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
            transform transition-transform
            ${available ? 'translate-x-6' : ''}
          `}
        />
      </label>
      <span className="ml-3 text-sm font-medium text-gray-900">
        {available ? 'Available' : 'Unavailable'}
      </span>
    </div>
  );
};

AvailabilityToggle.propTypes = {
  propertyType: PropTypes.string.isRequired,
  propertyId: PropTypes.string.isRequired,
  availability: PropTypes.object,
  setAvailability: PropTypes.func
};

export default AvailabilityToggle;
