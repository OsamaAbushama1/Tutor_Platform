import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import "../pages/Notifications/Notifications.css";

const DashboardPage = ({ apiUrl = "/api/" }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalUsers: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalNotifications: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    title: "",
    message: "",
    send_to_all: false,
  });
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [teachersRes, usersRes, bookingsRes, notificationsRes] =
        await Promise.all([
          axios.get(`${apiUrl}teachers/`, { withCredentials: true }),
          axios.get(`${apiUrl}users/all/`, { withCredentials: true }),
          axios.get(`${apiUrl}bookings/all/`, { withCredentials: true }),
          axios.get(`${apiUrl}notifications/`, { withCredentials: true }),
        ]);
      setStats({
        totalTeachers: teachersRes.data.length,
        totalUsers: usersRes.data.length,
        totalBookings: bookingsRes.data.length,
        pendingBookings: bookingsRes.data.filter((b) => b.status === "pending")
          .length,
        totalNotifications: notificationsRes.data.length,
      });
      setRecentBookings(bookingsRes.data.slice(0, 5));
    } catch (error) {
      setError(t("dashboard.error_fetching"));
      console.error("Error fetching stats:", error);
    }
  }, [apiUrl, t]);

  useEffect(() => {
    if (
      !isAuthLoading &&
      (!isAuthenticated || !user || (!user.is_staff && !user.is_superuser))
    ) {
      navigate("/login");
    } else {
      setLoading(false);
      if (user && (user.is_superuser || user.is_staff)) {
        fetchStats();
      }
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, fetchStats]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchStats();
    };
    window.addEventListener("notificationsUpdated", handleNotificationsUpdated);
    return () => {
      window.removeEventListener(
        "notificationsUpdated",
        handleNotificationsUpdated
      );
    };
  }, [fetchStats]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError(t("notAdmin.title_required") || "Title is required");
      return;
    }
    if (!formData.message.trim()) {
      setFormError(t("notAdmin.message_required") || "Message is required");
      return;
    }
    if (
      !formData.send_to_all &&
      (!formData.user_id || isNaN(formData.user_id) || formData.user_id <= 0)
    ) {
      setFormError(
        t("notAdmin.invalid_user_id") || "Valid user ID is required"
      );
      return;
    }

    try {
      await axios.post(`${apiUrl}notifications/create/`, formData, {
        withCredentials: true,
      });
      setFormData({ user_id: "", title: "", message: "", send_to_all: false });
      setShowForm(false);
      setShowSuccessModal(true);
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        t("notAdmin.error_sending") ||
        "Failed to send notification";
      setFormError(errorMsg);
      console.error("Notification error:", err.response?.data);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  if (isAuthLoading || loading) {
    return <div className="notifications-loading">{t("notAdmin.loading")}</div>;
  }

  if (error) return <div className="p-20 c-red">{error}</div>;

  return (
    <div>
      <h1 className="p-relative">{t("dashboard.title")}</h1>
      <div className="wrapper d-grid gap-20">
        <div className="stats p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">
            {t("dashboard.platform_stats")}
          </h2>
          <div className="d-flex txt-c gap-20 f-wrap">
            <div className="box p-20 rad-10 fs-13 c-grey">
              <i className="fa-solid fa-chalkboard-teacher fa-2x mb-10 c-blue"></i>
              <span className="d-block  fw-bold fs-25 mb-5">
                {stats.totalTeachers}
              </span>
              {t("dashboard.total_teachers")}
            </div>
            <div className="box p-20 rad-10 fs-13 c-grey">
              <i className="fa-solid fa-user fa-2x mb-10 c-orange"></i>
              <span className="d-block  fw-bold fs-25 mb-5">
                {stats.totalUsers}
              </span>
              {t("dashboard.total_users")}
            </div>
            <div className="box p-20 rad-10 fs-13 c-grey">
              <i className="fa-regular fa-calendar-check fa-2x mb-10 c-green"></i>
              <span className="d-block  fw-bold fs-25 mb-5">
                {stats.totalBookings}
              </span>
              {t("dashboard.total_bookings")}
            </div>
            <div className="box p-20 rad-10 fs-13 c-grey">
              <i className="fa-regular fa-clock fa-2x mb-10 c-red"></i>
              <span className="d-block  fw-bold fs-25 mb-5">
                {stats.pendingBookings}
              </span>
              {t("dashboard.pending_bookings")}
            </div>
            <div className="box p-20 rad-10 fs-13 c-grey">
              <i className="fa-regular fa-bell fa-2x mb-10 c-blue"></i>
              <span className="d-block  fw-bold fs-25 mb-5">
                {stats.totalNotifications}
              </span>
              {t("dashboard.total_notifications")}
            </div>
          </div>
        </div>

        <div className="notifications p-20  rad-10">
          <h2 className="mt-0 mb-10 text-light">{t("notAdmin.title")}</h2>
          <div className="mb-3">
            <button
              className="btn notifications-btn-primary ml-10"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? t("notAdmin.cancel") : t("notAdmin.send_message")}
            </button>
          </div>
          {showForm && (
            <div className="notifications-form-card card p-4 mb-4">
              <h4 className="notifications-form-title">
                {t("notAdmin.form_title")}
              </h4>
              {formError && (
                <div className="notifications-alert-error alert alert-danger">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="send_to_all"
                    name="send_to_all"
                    checked={formData.send_to_all}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="send_to_all" className="form-check-label">
                    {t("notAdmin.send_to_all")}
                  </label>
                </div>
                {!formData.send_to_all && (
                  <div className="mb-3">
                    <label htmlFor="user_id" className="form-label">
                      {t("notAdmin.user_id")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="user_id"
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleInputChange}
                      required={!formData.send_to_all}
                    />
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    {t("notAdmin.title_input")}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    {t("notAdmin.message")}
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button type="submit" className="btn notifications-btn-success">
                  {t("notAdmin.send")}
                </button>
              </form>
            </div>
          )}
          {showSuccessModal && (
            <div
              className="modal fade show notifications-modal"
              tabIndex="-1"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.5)",
                height: "100vh",
              }}
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content admin">
                  <div className="modal-header">
                    <h5 className="modal-title">{t("notAdmin.form_title")}</h5>
                  </div>
                  <div className="modal-body text-center">
                    <p>{t("notAdmin.success_sending")}</p>
                  </div>
                  <div className="modal-footer justify-content-center">
                    <button
                      type="button"
                      className="btn notifications-btn-primary"
                      onClick={handleCloseModal}
                    >
                      {t("notAdmin.close")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="recent-bookings p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">
            {t("dashboard.recent_bookings")}
          </h2>
          <div className="table-responsive">
            <table className="w-full">
              <thead>
                <tr>
                  <th>{t("dashboard.user")}</th>
                  <th>{t("dashboard.teacher")}</th>
                  <th>{t("dashboard.date")}</th>
                  <th>{t("dashboard.time")}</th>
                  <th>{t("dashboard.status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.user?.first_name || "N/A"}</td>
                    <td>{booking.teacher?.name || "N/A"}</td>
                    <td>{booking.date}</td>
                    <td>{booking.time}</td>
                    <td>{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="quick-actions p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">
            {t("dashboard.quick_actions")}
          </h2>
          <div className="d-flex gap-20 f-wrap">
            <Link
              to="/admin/teachers"
              className="btn-shape bg-blue c-white fs-14 p-10"
            >
              {t("dashboard.manage_teachers")}
            </Link>
            <Link
              to="/admin/bookings"
              className="btn-shape bg-green c-white fs-14 p-10"
            >
              {t("dashboard.manage_bookings")}
            </Link>
            <Link
              to="/admin/users"
              className="btn-shape bg-orange c-white fs-14 p-10"
            >
              {t("dashboard.manage_users")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
