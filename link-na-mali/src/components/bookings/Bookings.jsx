import React, { useState, useEffect } from 'react';

const Bookings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulated API call with additional fields
        const mockData = [
          {
            id: 1,
            property: 'Luxury Villa',
            client: 'Sharon Sachi',
            dates: '2024-01-01 to 2024-01-10',
            status: 'Pending',
          },
          {
            id: 2,
            property: 'Cozy Apartment',
            client: 'Blue Sachi',
            dates: '2024-02-15 to 2024-02-20',
            status: 'Confirmed',
          },
          {
            id: 3,
            property: 'Beach House',
            client: 'Red Sachi',
            dates: '2024-03-05 to 2024-03-15',
            status: 'Canceled', 
          },
        ];
        setTimeout(() => setData(mockData), 1000); // Simulated delay
      } catch (err) {
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter bookings by status
  const filteredData = filter === 'All' ? data : data.filter((item) => item.status === filter);

  if (loading) {
    return <p className="text-gray-700">Loading bookings...</p>;
  }

  if (error) {
    return <p className="text-red-500 font-semibold">{error}</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6 text-black">My Bookings</h2>

      {/* Filters */}
      <div className="mb-4 text-gray-700 flex justify-end">
        <label htmlFor="filter" className="block text-gray-700 mb-2 mr-2">Filter by Status:</label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded bg-white shadow"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Canceled">Canceled</option>
        </select>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div
              key={item.id}
              className={`relative bg-white shadow-lg rounded-xl p-6 border-l-4 ${
                item.status === 'Pending'
                  ? 'border-yellow-500'
                  : item.status === 'Confirmed'
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-900">{item.property}</h3>
              <p className="text-gray-700 mt-2">Client: <span className="font-medium">{item.client}</span></p>
              <p className="text-gray-700 mt-1">Dates: {item.dates}</p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  item.status === 'Pending'
                    ? 'text-yellow-500'
                    : item.status === 'Confirmed'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                Status: {item.status}
              </p>

              {/* Action Buttons */}
              <div className="mt-4 flex justify-between">
                {item.status === 'Pending' && (
                  <>
                    <button
                      className="px-4 py-2 text-white bg-green-500 rounded-lg shadow hover:bg-green-600 focus:ring-2 focus:ring-green-400"
                      onClick={() => console.log(`Approve booking ${item.id}`)}
                    >
                      Approve
                    </button>
                    <button
                      className="px-4 py-2 text-white bg-red-500 rounded-lg shadow hover:bg-red-600 focus:ring-2 focus:ring-red-400"
                      onClick={() => console.log(`Reject booking ${item.id}`)}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  className="px-4 py-2 text-white bg-blue-500 rounded-lg shadow hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
                  onClick={() => console.log(`View details of booking ${item.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-gray-600">
            No bookings found for the selected filter.
          </p>
        )}
      </div>
    </div>
  );
};

export default Bookings;