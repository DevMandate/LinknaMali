import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const API_BASE = 'https://api.linknamali.ke';

const Notifications = ({
  forceOpen = false,
  onClose = () => {},
  onCountChange = () => {}
}) => {
  const navigate = useNavigate();
  const popupRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(
    () => JSON.parse(localStorage.getItem('readNotificationIds')) || []
  );
  const [deletedIds, setDeletedIds] = useState(
    () => JSON.parse(localStorage.getItem('deletedNotificationIds')) || []
  );

  // Persist helper
  const persist = (key, arr, setter) => {
    localStorage.setItem(key, JSON.stringify(arr));
    setter(arr);
  };

  const generateId = (type, id, ts) => `${type}-${id}-${ts}`;

  // Compute unread count and notify parent
  const updateCount = useCallback(
    (notifs, reads, dels) => {
      const unread = notifs.filter(
        n => !reads.includes(n.id) && !dels.includes(n.id)
      ).length;
      onCountChange(unread);
    },
    [onCountChange]
  );

  // Fetch & aggregate notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const result = [];

      // -- New property notifications
      const propRes = await fetch(
        `${API_BASE}/property/getallunapprovedproperty`
      );
      const { data: props = [] } = await propRes.json();
      props.forEach(p => {
        if (p.created_at) {
          const id = generateId('property', p.id, p.created_at);
          const time = new Date(p.created_at).getTime();
          result.push({
            id,
            message: `New property: ${p.title}`,
            target: `/admin-dashboard/AdminNewListings?highlightListing=${p.id}`,
            time
          });
        }
      });

      // -- Support tickets & conversations
      const ticRes = await fetch(`${API_BASE}/support/tickets`);
      const { tickets = [] } = await ticRes.json();
      await Promise.all(
        tickets.map(async t => {
          // ticket creation
          if (t.created_at) {
            const tid = generateId('ticket', t.ticket_id, t.created_at);
            const time = new Date(t.created_at).getTime();
            result.push({
              id: tid,
              message: `New ticket from ${t.email}`,
              target: `/admin-dashboard/AdminSupport?highlightTicket=${t.ticket_id}`,
              time
            });
          }

          // each conversation message
          const convRes = await fetch(
            `${API_BASE}/ticketconversations/${t.ticket_id}`
          );
          const convs = await convRes.json();
          const messages =
            Array.isArray(convs) ? convs : convs.conversation || [];
          messages.forEach(m => {
            if (m.sent_at) {
              const cid = generateId('conv', t.ticket_id, m.sent_at);
              const time = new Date(m.sent_at).getTime();
              result.push({
                id: cid,
                message: `Message in ticket ${t.ticket_id}`,
                target: `/admin-dashboard/AdminSupport?highlightTicket=${t.ticket_id}`,
                time
              });
            }
          });
        })
      );

      // -- Property edit conversations
      const editRes = await fetch(`${API_BASE}/edit_conversations`);
      const edits = (await editRes.json()).editConversations || [];
      edits.forEach(e => {
        if (e.updated_at) {
          const eid = generateId('edit', e.property_id, e.updated_at);
          const time = new Date(e.updated_at).getTime();
          result.push({
            id: eid,
            message: `Property updated`,
            target: `/admin-dashboard/AdminNewListings?highlightListing=${e.property_id}`,
            time
          });
        }
      });

      // Dedupe by id, then sort by time descending
      const unique = Array.from(new Map(result.map(n => [n.id, n])).values());
      unique.sort((a, b) => b.time - a.time);

      setNotifications(unique);
      updateCount(unique, readIds, deletedIds);
    } catch (err) {
      console.error('Notification fetch error', err);
    }
  }, [readIds, deletedIds, updateCount]);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Update unread count on any state change
  useEffect(() => {
    updateCount(notifications, readIds, deletedIds);
  }, [notifications, readIds, deletedIds, updateCount]);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
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

  const visible = notifications.filter(n => !deletedIds.includes(n.id));

  const markRead = id => {
    const newRead = [...readIds, id];
    persist('readNotificationIds', newRead, setReadIds);
  };
  const deleteOne = id => {
    const newDel = [...deletedIds, id];
    persist('deletedNotificationIds', newDel, setDeletedIds);
  };

  return (
    <div
      ref={popupRef}
      className="absolute top-16 right-4 bg-white border shadow-lg rounded p-4 w-64 sm:w-80 max-h-[80vh] overflow-y-auto"
    >
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold">Notifications</h3>
        <button
          onClick={onClose}
          style={{ color: '#35BEBD', background: 'none', border: 'none' }}
        >
          &times;
        </button>
      </div>

      {visible.map(n => (
        <div
          key={n.id}
          className="mb-3 p-2 border rounded cursor-pointer"
          onClick={() => navigate(n.target)}
        >
          <p className="text-sm">{n.message}</p>
          <div className="flex justify-end space-x-2 mt-1">
            <button
              onClick={e => {
                e.stopPropagation();
                markRead(n.id);
              }}
              className="text-xs"
              style={{ color: '#35BEBD', background: 'none', border: 'none' }}
            >
              Mark read
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                deleteOne(n.id);
              }}
              className="text-xs"
              style={{ color: '#35BEBD', background: 'none', border: 'none' }}
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
  onCountChange: PropTypes.func
};

export default Notifications;
