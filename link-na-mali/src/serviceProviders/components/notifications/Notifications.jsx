// src/serviceProviders/components/Notifications.jsx
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AppContext from '../../context/ServiceProviderAppContext';

const API_BASE = 'https://api.linknamali.ke';

const Notifications = ({ forceOpen = false, onClose = () => {}, onCountChange = () => {} }) => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const providerUserId = userData?.user_id;

  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(
    () => JSON.parse(localStorage.getItem('readNotificationIds')) || []
  );
  const [deletedIds, setDeletedIds] = useState(
    () => JSON.parse(localStorage.getItem('deletedNotificationIds')) || []
  );

  const popupRef = useRef(null);

  const persist = (key, arr, setter) => {
    localStorage.setItem(key, JSON.stringify(arr));
    setter(arr);
  };

  const updateCount = useCallback(
    (notifs, reads, dels) => {
      const unread = notifs.filter(
        (n) => !reads.includes(n.id) && !dels.includes(n.id)
      ).length;
      onCountChange(unread);
    },
    [onCountChange]
  );

  const fetchNotifications = useCallback(async () => {
    if (!providerUserId) return;
    try {
      const result = [];
      // New bookings
      const bookingsRes = await fetch(
        `${API_BASE}/service_bookings/${providerUserId}`,
        { credentials: 'include' }
      );
      const bookingsData = await bookingsRes.json();
      (bookingsData.bookings || []).forEach((b) => {
        if (b.status === 'pending') {
          const id = `booking-${b.id}-${b.booking_date}`;
          result.push({
            id,
            message: `New booking by ${b.first_name} ${b.last_name}`,
            target: `/service-providers/bookings`,
          });
        }
      });
      // New inquiries
      const inqRes = await fetch(
        `${API_BASE}/providerinquiries?user_id=${providerUserId}`
      );
      const inqData = await inqRes.json();
      (inqData.inquiries || []).forEach((i) => {
        if (i.status === 'unread') {
          const id = `inquiry-${i.id}-${i.created_at}`;
          result.push({
            id,
            message: `New inquiry from ${i.first_name}`,
            target: `/service-providers/messages`,
          });
        }
      });
      const unique = Array.from(new Map(result.map((n) => [n.id, n])).values());
      unique.sort((a, b) => b.id.localeCompare(a.id));
      setNotifications(unique);
      updateCount(unique, readIds, deletedIds);
    } catch (err) {
      console.error('Notification fetch error', err);
    }
  }, [providerUserId, readIds, deletedIds, updateCount]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  useEffect(() => {
    updateCount(notifications, readIds, deletedIds);
  }, [notifications, readIds, deletedIds, updateCount]);

  useEffect(() => {
    const handler = (e) => {
      if (
        forceOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [forceOpen, onClose]);

  if (!forceOpen) return null;

  const visible = notifications.filter((n) => !deletedIds.includes(n.id));

  const markRead = (id) => {
    const newRead = [...readIds, id];
    persist('readNotificationIds', newRead, setReadIds);
    updateCount(notifications, newRead, deletedIds);
  };

  const deleteOne = (id) => {
    const newDel = [...deletedIds, id];
    persist('deletedNotificationIds', newDel, setDeletedIds);
    updateCount(notifications, readIds, newDel);
  };

  return (
    <div
      ref={popupRef}
      className="absolute top-16 sm:top-[100px] right-4 bg-white border shadow-lg rounded p-4 w-64 sm:w-80 max-h-[80vh] overflow-y-auto z-50"
    >
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose} className="text-gray-500">
          &times;
        </button>
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-gray-500">No new notifications.</p>
      )}
      {visible.map((n) => (
        <div
          key={n.id}
          className="mb-3 p-2 border rounded cursor-pointer hover:bg-gray-100"
          onClick={() => navigate(n.target)}
        >
          <p className="text-sm">{n.message}</p>
          <div className="flex justify-end space-x-2 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                markRead(n.id);
              }}
              className="text-[#29327E] text-xs"
            >
              Mark read
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteOne(n.id);
              }}
              className="text-red-600 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

Notifications.propTypes = {
  forceOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onCountChange: PropTypes.func,
};

export default Notifications;
