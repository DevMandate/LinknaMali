import React, { useState, useEffect } from 'react';

const Inquiries = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [openAccordion, setOpenAccordion] = useState(null); // State to track which accordion is open

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulated API call with categories
        const mockData = [
          { id: 1, title: 'Buying', description: 'I want to rent this property', type: 'Rent' },
          { id: 2, title: 'Renting', description: 'I want to buy this property', type: 'Buy' },
          { id: 3, title: 'Short-stay', description: 'I want a short-stay property', type: 'Short Stay' },
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

  // Filter inquiries by type and search term
  const filteredData = data.filter((item) => {
    return (filter === 'All' || item.type === filter) && item.title.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return <p className="text-gray-700">Loading inquiries...</p>;
  }

  if (error) {
    return <p className="text-red-500 font-semibold">{error}</p>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-6 text-black">Inquiries</h2>

      {/* Search Bar */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded bg-white shadow mr-2"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b mb-4">
        {['All', 'Rent', 'Buy', 'Short Stay'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-semibold ${
              filter === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Accordion-style Inquiries List */}
      <div className="space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white shadow rounded-lg">
              <div
                className="p-4 cursor-pointer border-b"
                onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
              >
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>

              {/* Accordion Content */}
              {openAccordion === item.id && (
                <div className="p-4 text-gray-600">
                  <p>{item.description}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">No inquiries found at this time.</p>
        )}
      </div>
    </div>
  );
};

export default Inquiries;