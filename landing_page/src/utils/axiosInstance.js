import axios from "axios";
import { logoutUser } from "./authHelpers";

const axiosInstance = axios.create({
  baseURL: "https://api.linknamali.ke",
  headers: {
    "Content-Type": "application/json",
  },
});

// Catch 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logoutUser();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
