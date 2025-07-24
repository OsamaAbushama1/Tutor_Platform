import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import axios from "axios";
import DashboardPage from "./DashboardPage";
import "./AdminDashboard.css";
import TeachersPage from "./TeachersPage";
import BookingsPage from "./BookingsPage";
import UsersPage from "./UsersPage";
import defultimage from "../../src/assets/alt.png";
import "../pages/Notifications/Notifications.css";

const api = axios.create({
  baseURL: "/api/",
  withCredentials: true,
});

const AdminDashboard = ({ apiUrl = "/api/" }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAuthLoading, logout } =
    useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      if (user && isAuthenticated) {
        await api.post(
          "/notifications/mark-read/",
          {},
          { withCredentials: true }
        );
        const response = await api.get("/notifications/", {
          withCredentials: true,
        });
        setNotifications(response.data);
        window.dispatchEvent(new Event("notificationsMarkedAsRead"));
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/delete/${notificationId}/`, {
        withCredentials: true,
      });
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    if (
      !isAuthLoading &&
      (!isAuthenticated || !user || !(user.is_superuser || user.is_staff))
    ) {
      navigate("/login");
    }
  }, [isAuthenticated, user, isAuthLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getProfilePicture = () => {
    if (user && user.profile_picture) {
      return user.profile_picture;
    }
    return defultimage;
  };

  if (isAuthLoading) return <div>{t("adminDashboard.loading")}</div>;
  if (!isAuthenticated || !user || !(user.is_superuser || user.is_staff))
    return null;

  return (
    <div className="page d-flex" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className={`sidebar p-20 p-relative `}>
        <h3 className="p-relative txt-c mt-0">EduBridge</h3>
        <ul>
          <li>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `d-flex align-center fs-14 c-black rad-6 p-10 ${
                  isActive ? "active" : ""
                }`
              }
            >
              <i className="fa-regular fa-chart-bar fa-fw"></i>
              <span>{t("adminDashboard.dashboard")}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/teachers"
              className={({ isActive }) =>
                `d-flex align-center fs-14 c-black rad-6 p-10 ${
                  isActive ? "active" : ""
                }`
              }
            >
              <i className="fa-solid fa-chalkboard-teacher fa-fw"></i>
              <span>{t("adminDashboard.teachers")}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/bookings"
              className={({ isActive }) =>
                `d-flex align-center fs-14 c-black rad-6 p-10 ${
                  isActive ? "active" : ""
                }`
              }
            >
              <i className="fa-regular fa-calendar-check fa-fw"></i>
              <span>{t("adminDashboard.bookings")}</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `d-flex align-center fs-14 c-black rad-6 p-10 ${
                  isActive ? "active" : ""
                }`
              }
            >
              <i className="fa-regular fa-user fa-fw"></i>
              <span>{t("adminDashboard.users")}</span>
            </NavLink>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="d-flex align-center text-light fs-14 rad-6 p-10 w-full"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <i className="fa-solid fa-sign-out-alt fa-fw"></i>
              <span>{t("adminDashboard.logout")}</span>
            </button>
          </li>
        </ul>
      </div>

      <div className="content w-full">
        <div className="head p-15 justify-content-end">
          <div className="icons d-flex align-center justify-content-end">
            <span className="notification span">
              <i
                className="fa-regular fa-bell fa-lg"
                onClick={() => setShowNotifications(!showNotifications)}
              ></i>
              {showNotifications && (
                <div ref={dropdownRef} className="notifications-dropdown">
                  {notifications.length === 0 ? (
                    <div className="p-10 txt-c">
                      {t("adminDashboard.no_notifications")}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="notification-item p-10"
                      >
                        <div>
                          <strong>{notification.title}</strong>
                          <p className="fs-13 c-grey">{notification.message}</p>
                        </div>
                        <button
                          className="btn notifications-btn-danger"
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                        >
                          {t("adminDashboard.delete")}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </span>
            <img
              decoding="async"
              src={getProfilePicture()}
              alt={t("adminDashboard.user_avatar")}
            />
          </div>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage apiUrl={apiUrl} />} />
          <Route path="/teachers" element={<TeachersPage apiUrl={apiUrl} />} />
          <Route path="/bookings" element={<BookingsPage apiUrl={apiUrl} />} />
          <Route path="/users" element={<UsersPage apiUrl={apiUrl} />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
