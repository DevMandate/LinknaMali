import React, { useState, useEffect } from "react";
// import PropertyCard from "./PropertyCard";
// import Filters from "./Filters";

const PropertyListing = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
    minPrice: 0,
    maxPrice: 1000000,
    location: "",
  });

  useEffect(() => {
    // Fetch apartments from the API
    const fetchProperties = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/getapartment");
        const data = await response.json();
        setProperties(data.data); // Assuming the response structure is { message: "Success", data: [...] }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleFilterChange = (updatedFilters) => {
    setFilters(updatedFilters);
    // Optionally apply filtering logic here or on the backend
  };

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold">Apartment Listings</h1>
      </header>
      <Filters filters={filters} onFilterChange={handleFilterChange} />
      <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading properties...</p>
        ) : (
          properties.map((property) => (
            <PropertyCard key={property.apartment_id} property={property} />
          ))
        )}
      </main>
    </div>
  );
};

export default PropertyListing;