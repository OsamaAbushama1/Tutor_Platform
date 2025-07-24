import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const API_BASE_URL = "/api/";
  const inactivityTimer = useRef(null);

  const formatDate = (date) => {
    if (!date || date === "null" || date === "") {
      return "Not available";
    }
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate)
      ? parsedDate.toLocaleString("en-EG", {
          timeZone: "Africa/Cairo",
          hour12: false,
        })
      : "Invalid Date";
  };

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${API_BASE_URL}auth/logout/`,
        {},
        { withCredentials: true }
      );
      setIsAuthenticated(false);
      setUser(null);
      clearTimeout(inactivityTimer.current);
    } catch (error) {}
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      const response = await axios.get(`${API_BASE_URL}auth/check/`, {
        withCredentials: true,
      });

      if (response.data.user) {
        const userWithEgyptTime = {
          ...response.data.user,
          last_activity: formatDate(response.data.user.last_activity),
        };
        setIsAuthenticated(true);
        setUser(userWithEgyptTime);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}login/`,
        { email, password },
        { withCredentials: true }
      );

      const userWithEgyptTime = {
        ...response.data.user,
        last_activity: formatDate(response.data.user.last_activity),
      };
      setIsAuthenticated(true);
      setUser(userWithEgyptTime);
      setIsAuthLoading(false);
    } catch (error) {
      setIsAuthLoading(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => checkAuthStatus();
    window.addEventListener("focus", handleFocus);
    checkAuthStatus();
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearTimeout(inactivityTimer.current);
    };
  }, [checkAuthStatus]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        checkAuthStatus,
        isAuthLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
