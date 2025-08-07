import { Navigate } from "react-router-dom";
import { isTokenExpired, logoutUser } from "../utils/authHelpers";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token || isTokenExpired(token)) {
    logoutUser();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
