import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';

const API_BASE = 'https://api.linknamali.ke';

/**
 * ReviewsModal Component
 * Props:
 *  - open: boolean
 *  - onClose: function
 *  - title: string
 *  - loading: boolean
 *  - error: string|null
 *  - reviews: Array<{ review: { id, created_at, comment, is_visible }, reviewer: { first_name, last_name } }>
 */
export default function ReviewsModal({ open, onClose, title, loading, error, reviews = [] }) {
  const [localReviews, setLocalReviews] = useState([]);

  useEffect(() => {
    // initialize local copy whenever reviews prop changes
    setLocalReviews(reviews.map(r => ({ review: { ...r.review }, reviewer: { ...r.reviewer } })));
  }, [reviews]);

  const toggleVisibility = async (reviewId, currentState) => {
    const newState = currentState ? 0 : 1;
    try {
      await axios.put(`${API_BASE}/displayreview/${reviewId}`, { is_visible: newState });
      // update local state for immediate UI feedback
      setLocalReviews(prev => prev.map(r => (
        r.review.id === reviewId
          ? { review: { ...r.review, is_visible: newState }, reviewer: r.reviewer }
          : r
      )));
    } catch (e) {
      console.error('Visibility toggle failed', e);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FaTimes size={20} />
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Reviews for “{title}”
        </h2>

        {loading && <p className="text-center text-gray-600">Loading reviews…</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && localReviews.length === 0 && (
          <p className="text-center text-gray-600 italic">No reviews found.</p>
        )}

        {!loading && !error && localReviews.length > 0 && (
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2">
            {localReviews.map(({ review, reviewer }) => (
              <div
                key={review.id}
                className="bg-gray-50 p-4 rounded-lg shadow flex space-x-4 items-start"
              >
                <FaUserCircle className="w-12 h-12 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium text-gray-800">
                        {reviewer.first_name} {reviewer.last_name}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleVisibility(review.id, review.is_visible)}
                      className={`px-3 py-1 text-sm rounded-full focus:outline-none focus:ring transition-colors duration-200 ${
                        review.is_visible
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {review.is_visible ? 'Deny' : 'Allow'}
                    </button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
