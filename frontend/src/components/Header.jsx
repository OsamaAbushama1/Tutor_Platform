import React, { useContext, useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import api from "../api/api";
import "./Header.css";
import { FaBell } from "react-icons/fa";

const Header = () => {
  const { isAuthenticated, user, logout, isAuthLoading } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications/unread-count/", {
        withCredentials: true,
      });
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthLoading, isAuthenticated, user, fetchUnreadCount]);

  useEffect(() => {
    const handleNotificationsMarked = () => {
      if (!isAuthLoading && isAuthenticated && user) {
        setTimeout(fetchUnreadCount, 100);
      }
    };
    window.addEventListener(
      "notificationsMarkedAsRead",
      handleNotificationsMarked
    );
    return () => {
      window.removeEventListener(
        "notificationsMarkedAsRead",
        handleNotificationsMarked
      );
    };
  }, [isAuthLoading, isAuthenticated, user, fetchUnreadCount]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [
    location.pathname,
    isAuthLoading,
    isAuthenticated,
    user,
    fetchUnreadCount,
  ]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
      document.documentElement.setAttribute(
        "dir",
        savedLanguage === "ar" ? "rtl" : "ltr"
      );
    } else {
      i18n.changeLanguage("en");
      document.documentElement.setAttribute("dir", "ltr");
      localStorage.setItem("language", "en");
    }
  }, [i18n]);

  const handleLogout = async () => {
    try {
      await logout();
      setUnreadCount(0);
      navigate("/login");
    } catch (error) {}
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.setAttribute("dir", lng === "ar" ? "rtl" : "ltr");
    localStorage.setItem("language", lng);
  };

  const getDisplayName = () => {
    const isAdmin = user?.is_staff || user?.is_superuser;
    let name;
    if (isAdmin) {
      name = user.username || user.email || "Admin";
    } else {
      name = user?.first_name
        ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
        : user?.email
        ? user.email.split("@")[0]
        : "User";
    }
    return name;
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img src={logo} alt="EduBridge Logo" className="navbar-logo" />
          <span>EduBridge</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link to="/" className="nav-link active">
                {t("home")}
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/teachers" className="nav-link">
                {t("tutors")}
              </Link>
            </li>
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle"
                  id="navbarDropdown"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {t("welcome,")} {getDisplayName()}
                </button>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
                    <Link to="/bookings" className="dropdown-item">
                      {t("bookinglist")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="dropdown-item">
                      {t("Homesettings")}
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item">
                      {t("logout")}
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">
                    {t("HomeLogin")}
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/register"
                    className="nav-link btn btn-outline-primary ms-2"
                  >
                    {t("HomeRegister")}
                  </Link>
                </li>
              </>
            )}
            <li className="nav-item dropdown">
              <button
                className="nav-link dropdown-toggle"
                id="languageDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {t("language")}
              </button>
              <ul className="dropdown-menu" aria-labelledby="languageDropdown">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => changeLanguage("en")}
                  >
                    English
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => changeLanguage("ar")}
                  >
                    العربية
                  </button>
                </li>
              </ul>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <Link
                  to="/notifications"
                  className="nav-link position-relative"
                >
                  <FaBell className="notification-icon" />
                  {unreadCount > 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
