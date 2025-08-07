import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useLogin } from "../../context/AppContext";

const handleLogin = async (
  credentials,
  setError,
  handleLoginContext,
  navigate,
  isAdmin
) => {
  try {
    const endpoint = isAdmin
      ? "https://api.linknamali.ke/admin/login"
      : "https://api.linknamali.ke/user_login";

    console.log("Attempting login with:", credentials);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.response || "Login failed");
    }

    console.log("Login successful:", result);

    // Extract user details based on role
    const userInfo = isAdmin ? result.admin_info : result.user_info;
    if (!userInfo) {
      throw new Error("User information not found in response.");
    }

    // Store the token and user data
    localStorage.setItem("authToken", result.token);
    localStorage.setItem("userId", userInfo.id);
    localStorage.setItem("first_name", userInfo.first_name);

    // Update context and UI
    handleLoginContext(result);
    alert("Login successful!");

    // Redirect based on role
    if (isAdmin) {
      window.location.href = "https://portal.linknamali.ke/admin-dashboard";
    } else {
      navigate("/user-dashboard");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    setError(error.message || "An error occurred during login.");
  }
};

function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { handleLogin: handleLoginContext } = useLogin(); // Destructure context method

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    handleLogin(credentials, setError, handleLoginContext, navigate, isAdmin); // Pass necessary arguments
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCheckboxChange = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="block w-full pl-3 pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="text-gray-400"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="admin"
              name="admin"
              type="checkbox"
              checked={isAdmin}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="admin" className="ml-2 block text-sm text-gray-900">
              Login as Admin
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/user-dashboard/signup"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;