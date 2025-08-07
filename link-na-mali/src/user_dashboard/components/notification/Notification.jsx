import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

// Helper functions for localStorage read state
const getNotificationReadStatus = (key) => localStorage.getItem(key) === "true";
const setNotificationReadStatus = (key, status) =>
  localStorage.setItem(key, status ? "true" : "false");

// Helpers for deleted notifications
const getDeletedNotificationIds = (userId) => {
  const data = localStorage.getItem(`deleted-notifs-${userId}`);
  return data ? JSON.parse(data) : [];
};
const setDeletedNotificationIdsLS = (userId, ids) => {
  localStorage.setItem(`deleted-notifs-${userId}`, JSON.stringify(ids));
};

// Helper to format a message up to the first full stop
const formatMessage = (message) => {
  if (!message) return "";
  const index = message.indexOf(".");
  return index !== -1 ? message.substring(0, index + 1) : message;
};

// Error cache to store last error message for each URL
const errorCache = {};

// A helper function to safely fetch data
const safeFetch = async (url, defaultValue = {}) => {
  try {
    const response = await axios.get(url);
    // Clear any previous error for this URL if successful
    if (errorCache[url]) {
      delete errorCache[url];
    }
    return response.data;
  } catch (err) {
    const errMsg = err.response
      ? `Request to ${url} failed with status: ${err.response.status}`
      : `Request to ${url} failed: ${err.message}`;
    // Hide errors permanently by not logging them
    errorCache[url] = errMsg;
    return defaultValue;
  }
};

const Notification = ({ userId, iconClassName = "text-gray-600" }) => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [editConversations, setEditConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState(getDeletedNotificationIds(userId));
  const popupRef = useRef(null);

  const fetchNotifications = async () => {
    // Fetch enquiries
    const enquiriesData = await safeFetch(`https://api.linknamali.ke/getenquiries/${userId}`, { enquiries: [] });
    const mappedEnquiries = enquiriesData.enquiries
      ? enquiriesData.enquiries.map((inq) => ({
          ...inq,
          notifType: "enquiry",
          read: getNotificationReadStatus(`notif-${userId}-enquiry-${inq.id}`)
        }))
      : [];
    setEnquiries(mappedEnquiries);

    // Fetch bookings
    const bookingsData = await safeFetch(`https://api.linknamali.ke/allbookings/${userId}`, { bookings: [] });
    const mappedBookings = bookingsData.bookings
      ? bookingsData.bookings.map((bk) => ({
          ...bk,
          notifType: "booking",
          read: getNotificationReadStatus(`notif-${userId}-booking-${bk.id}`)
        }))
      : [];
    setBookings(mappedBookings);

    // Fetch edit requests
    const editRequestsData = await safeFetch(`https://api.linknamali.ke/editrequests`, { editRequests: [] });
    const mappedEditRequests = editRequestsData.editRequests
      ? editRequestsData.editRequests.map((edit) => ({
          ...edit,
          notifType: "editRequest",
          read: getNotificationReadStatus(`notif-${userId}-edit-${edit.id}`)
        }))
      : [];
    setEditRequests(mappedEditRequests);

    // Fetch admin edit conversations
    const convData = await safeFetch(`https://api.linknamali.ke/edit_conversations`, { editConversations: [] });
    const allConversations = convData.editConversations || [];
    const filteredConversations = allConversations.filter(
      (conv) => conv.receiver_id === userId
    );
    const mappedConversations = filteredConversations.map((conv) => ({
      ...conv,
      notifType: "editConversation",
      read: getNotificationReadStatus(`notif-${userId}-edit-conv-${conv.id}`)
    }));
    setEditConversations(mappedConversations);

    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [userId]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Update notification state and persist in localStorage
  const updateNotificationState = (notif, newReadState) => {
    let key;
    if (notif.notifType === "editConversation") {
      key = `notif-${userId}-edit-conv-${notif.id}`;
    } else if (notif.notifType === "editRequest") {
      key = `notif-${userId}-edit-${notif.id}`;
    } else {
      key = `notif-${userId}-${notif.notifType}-${notif.id}`;
    }
    setNotificationReadStatus(key, newReadState);
    if (notif.notifType === "enquiry") {
      setEnquiries((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: newReadState } : n))
      );
    } else if (notif.notifType === "booking") {
      setBookings((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: newReadState } : n))
      );
    } else if (notif.notifType === "editRequest") {
      setEditRequests((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: newReadState } : n))
      );
    } else if (notif.notifType === "editConversation") {
      setEditConversations((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: newReadState } : n))
      );
    }
  };

  const handleNotificationClick = (notif) => {
    updateNotificationState(notif, true);
    if (notif.notifType === "enquiry") {
      navigate("/user-dashboard", { state: { activeSection: "inquiries", inquiryId: notif.id } });
    } else if (notif.notifType === "booking") {
      navigate("/user-dashboard", { state: { activeSection: "bookings", bookingId: notif.id } });
    } else if (notif.notifType === "editRequest" || notif.notifType === "editConversation") {
      navigate("/user-dashboard/property-management", { state: { editId: notif.property_id || notif.id } });
    }
    setIsOpen(false);
  };

  const deleteNotification = (notifId) => {
    const newDeleted = [...deletedNotificationIds, notifId];
    setDeletedNotificationIds(newDeleted);
    setDeletedNotificationIdsLS(userId, newDeleted);
  };

  const combinedNotifications = [
    ...enquiries,
    ...bookings,
    ...editRequests,
    ...editConversations
  ].filter((notif) => !deletedNotificationIds.includes(notif.id));

  combinedNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const totalNotifications = combinedNotifications.filter((notif) => !notif.read).length;

  const markAllAsRead = () => {
    combinedNotifications.forEach((notif) => {
      updateNotificationState(notif, true);
    });
  };

  return (
  <div className="relative">
    <button
      onClick={handleToggle}
      className="relative text-xl focus:outline-none bg-secondary-color rounded-full p-2"
    >
      <FontAwesomeIcon icon={faBell} className={iconClassName} />
      {totalNotifications > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {totalNotifications}
        </span>
      )}
    </button>

    {isOpen && (
      <div
        ref={popupRef}
        className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50 p-4 max-h-96 overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg font-semibold text-gray-800">Notifications</p>
          <button
            onClick={markAllAsRead}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Mark All as Read
          </button>
        </div>
        {loading ? (
          <p className="text-gray-700">Loading notifications...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : combinedNotifications.length === 0 ? (
          <p className="text-sm text-gray-600">No new notifications.</p>
        ) : (
          combinedNotifications.map((notif) => {
            let displayMessage = "";
            if (notif.notifType === "enquiry") {
              displayMessage = `Enquiry from ${notif.first_name} ${notif.last_name}: ${notif.subject}`;
            } else if (notif.notifType === "booking") {
              displayMessage = `Booking for ${notif.title} - Checkin: ${notif.check_in_date}`;
            } else if (notif.notifType === "editRequest") {
              displayMessage = `Edit Request for ${notif.propertyName || "Property"}: ${notif.message}`;
            } else if (notif.notifType === "editConversation") {
              displayMessage = `Edit Request for ${notif.property_name}: ${formatMessage(
                notif.message
              )}`;
            }
            return (
              <div
                key={notif.id}
                className={`cursor-pointer p-3 rounded mb-2 flex justify-between items-center shadow ${
                  notif.read
                    ? "bg-gray-100"
                    : "bg-indigo-50 hover:bg-indigo-100"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {displayMessage}
                  </p>
                  {notif.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNotificationState(notif, !notif.read);
                    }}
                    className="text-xs px-2 py-1 bg-secondary-color text-white rounded hover:bg-green-600"
                  >
                    {notif.read ? "Mark as Unread" : "Mark as Read"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    )}
  </div>
);
};

export default Notification;