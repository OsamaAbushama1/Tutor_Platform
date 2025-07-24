import React, { useContext, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./Notifications.css";
import Header from "../../components/Header";

const Notifications = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

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
      }
      setLoading(false);
    } catch (err) {
      setError(t("notifications.error_fetching"));
      setLoading(false);
    }
  }, [t, user, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchNotifications();
    }
  }, [isAuthenticated, isAuthLoading, fetchNotifications]);

  const handleDelete = async (notificationId) => {
    try {
      await api.delete(`/notifications/delete/${notificationId}/`, {
        withCredentials: true,
      });
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      window.dispatchEvent(new Event("notificationsMarkedAsRead"));
    } catch (err) {
      setError(err.response?.data?.error || t("notifications.error_deleting"));
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="notifications-loading">{t("notifications.loading")}</div>
    );
  }

  if (error) {
    return <div className="notifications-error text-danger">{error}</div>;
  }

  return (
    <>
      <Header />
      <div className="notifications-container container">
        <h2 className="notifications-title">{t("notifications.title")}</h2>
        <div className="mb-3"></div>
        {notifications.length === 0 ? (
          <p>{t("notifications.no_notifications")}</p>
        ) : (
          <div
            className={`notifications-scroll-container ${
              notifications.length > 3 ? "scrollable" : ""
            }`}
          >
            <ul className="list-group">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="notifications-list-item list-group-item d-flex justify-content-between align-items-center"
                >
                  <div>
                    <h5>{notification.title}</h5>
                    <p>{notification.message}</p>
                    <small>
                      {t("notifications.posted_on")}{" "}
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(notification.id)}
                  >
                    {t("notifications.delete")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;
