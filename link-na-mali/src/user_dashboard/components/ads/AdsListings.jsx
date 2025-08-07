import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../cards';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { ToastContainer } from 'react-toastify';
import { Home, Image, ArrowRightCircle } from 'lucide-react';

const AdsListings = ({ onSelectProperty }) => {
  const { userData } = useAppContext();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData?.user_id) {
      fetchProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(
        `https://api.linknamali.ke/property/getpropertybyuserid?user_id=${userData.user_id}`
      );
      setProperties(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load listings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <ToastContainer position="top-center" hideProgressBar />
      <div className="flex items-center justify-center mb-8">
        <Home size={28} className="text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Your Property Listings</h2>
      </div>

      {loading && (
        <p className="text-center text-gray-600">Loading properties...</p>
      )}
      {error && (
        <p className="text-center text-red-500">{error}</p>
      )}
      {!loading && properties.length === 0 && (
        <p className="text-center text-gray-700">
          You have no listings yet. Add a property to start creating ads.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {properties.map((prop) => (
          <Card key={prop.id} className="flex flex-col">
            <CardHeader className="px-4 pt-4">
              <CardTitle className="flex items-center text-lg">
                <Image size={20} className="mr-2 text-blue-500" />
                {prop.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-4 pb-4">
              <div className="h-36 mb-4 overflow-hidden rounded-lg">
                {Array.isArray(prop.images) && prop.images.length > 0 ? (
                  <Carousel
                    showThumbs={false}
                    infiniteLoop
                    showStatus={false}
                    emulateTouch
                    autoPlay={false}
                  >
                    {prop.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${prop.title} ${idx + 1}`}
                        className="w-full h-36 object-cover"
                        onError={(e) => (e.target.src = '/default-placeholder.jpg')}
                      />
                    ))}
                  </Carousel>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => onSelectProperty({
                  ...prop,
                  images: Array.isArray(prop.images) && prop.images.length > 0
                    ? prop.images
                    : ['/default-placeholder.jpg'],
                })}
                className="mt-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                <ArrowRightCircle size={18} className="mr-2" />
                Use This Property
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdsListings;
