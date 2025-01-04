import React, { useState, useEffect } from 'react';

const VacantListings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://api.example.com/vacant-listings');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-gray-700">Loading vacant listings...</p>;
  }

  if (error) {
    return <p className="text-red-500 font-semibold">{error}</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6 text-black">Vacant Listings</h2>
      {data.length > 0 ? (
        <ul className="space-y-4">
          {data.map((item) => (
            <li key={item.id} className="bg-white shadow-md rounded-lg p-4">
              <h3 className="text-lg font-semibold text-black">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-1 text-black">{item.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-600">No vacant listings available at the moment.</p>
      )}
    </div>
  );
};

export default VacantListings;