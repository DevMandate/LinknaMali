import './App.css';
import { useState, useEffect } from 'react';
import AppRoutes from './routes';

function App() {
  const [properties, setProperties] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("https://api.linknamali.ke/auth/cookie", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const data = await response.json();
        if (data.role !== 'general_user') {
          console.log("User is authenticated",data);
          setIsAuthenticated(true);
        }else{
          setIsAuthenticated(false);
          window.location.href = "https://linknamali.ke";
        }
      } catch (error) {
        setIsAuthenticated(false);
        window.location.href = "https://linknamali.ke";
      }
    };

    checkAuthStatus();
  }, []);

  const deleteProperty = (id) => {
    setProperties(properties.filter((property) => property.id !== id));
  };

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppRoutes properties={properties} deleteProperty={deleteProperty} />
    </div>
  );
}

export default App;