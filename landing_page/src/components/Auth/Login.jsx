import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePriorityDisplay } from '../../context/PriorityDisplay';
import { useLogin } from '../../context/IsLoggedIn';
import { useSearchEngine } from '../../context/SearchEngine';
import CustomTextField from '../Common/MUI_Text_Custom/customTextField';
import CustomPasswordField from '../Common/MUI_Text_Custom/customPasswordField';
import StandardButton from "../Common/MUI_Button_Custom/standard";
import { scrollIntoView } from '../../utils/scrollIntoView';
import GoogleHandler from './Google/GoogleHandler';

function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loginResult, setLoginResult] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthSuccess } = useLogin();
  const { searchEngine, setSearchEngine } = useSearchEngine();
  const { priorityDisplay, setPriorityDisplay } = usePriorityDisplay();

  useEffect(() => {
    if (location.pathname === "/login") {
      setPriorityDisplay('login');
      scrollIntoView('login');
    }
  }, [location.pathname]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((c) => ({ ...c, [name]: value }));
  };

  const handleLogin = async () => {
    try {
      setSearchEngine(true);
      const response = await fetch('https://api.linknamali.ke/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = { response: "Please check internet connection or try again later." };
      }

      console.group('Login Response Debug');
      console.log(result);
      console.groupEnd();

      setLoginResult(result);

      if (response.ok) {
        setPriorityDisplay(null);
        setAuthSuccess(true);

        const redirectOwnerId = result?.redirect_owner_id;

        if (redirectOwnerId) {
          navigate(`/user-dashboard/${redirectOwnerId}`);
        } else {
          navigate('/user-dashboard');
        }

      } else {
        if (result.error_code === 'USER_NOT_VERIFIED') {
          // Optionally redirect to verification
          // navigate('/signup', { state: [{ verify: true, email: credentials.email }] });
        } else if (result.error_code === 'ACCOUNT_FROZEN') {
          setError("Your account has been frozen due to a policy violation. Please contact support.");
        } else {
          setError(result.response || 'Login failed. Please try again.');
        }
      }

    } catch {
      setError('Server Error. Please try again later.');
    } finally {
      setSearchEngine(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    handleLogin();
  };

  const handleSignup = () => navigate('/signup');
  const handleForgotPassword = () =>
    navigate('/signup', { state: [{ sendemailreset: true }] });

  return (
    <div
      id="login"
      style={{ display: priorityDisplay === 'login' ? 'flex' : 'none' }}
      className="items-center justify-center"
    >
      <div className="max-w-md w-full p-8 rounded-lg m-3 bg-[var(--hamburger)] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]">
        <h2 className="text-3xl text-center mb-6">Login</h2>

        {error && (
          <div className="mb-4 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            {(error.toLowerCase().includes("locked") ||
              error.toLowerCase().includes("frozen")) && (
              <button
                className="bg-[var(--merime-theme)] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => window.open("mailto:support@linknamali.ke")}
              >
                Contact Support
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-[var(--text)]">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <CustomTextField
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <CustomPasswordField
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <StandardButton isloading={searchEngine} text="Log in" />
        </form>

        <GoogleHandler text="Sign in with Google" />

        <div
          className="mt-[30px] text-left"
          style={{ cursor: 'pointer' }}
          onClick={handleForgotPassword}
        >
          <p className="text-sm text-[var(--merime-theme)]">Forgot Password?</p>
        </div>
        <div
          className="mt-4 text-center"
          style={{ cursor: 'pointer' }}
          onClick={handleSignup}
        >
          <p className="text-sm text-[var(--text)]">Don't have an account? Sign Up</p>
        </div>

        {loginResult && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-medium mb-2">Debug: Login Result</h3>
            <pre className="text-xs overflow-auto" style={{ maxHeight: '200px' }}>
              {JSON.stringify(loginResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
