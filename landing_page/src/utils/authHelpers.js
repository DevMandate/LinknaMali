import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (error) {
    return true; // Invalid token = treat as expired
  }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};
