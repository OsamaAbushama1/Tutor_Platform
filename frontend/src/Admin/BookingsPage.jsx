import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const BookingsPage = ({ apiUrl }) => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !isAuthLoading &&
      (!isAuthenticated || !user || (!user.is_staff && !user.is_superuser))
    ) {
      navigate("/login");
    } else {
      setLoading(false);
      fetchBookings();
    }
  }, [isAuthLoading, isAuthenticated, user, navigate, t]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${apiUrl}bookings/all/`, {
        withCredentials: true,
      });
      setBookings(response.data);
    } catch (error) {
      setError(t("bookingPage.failed_to_fetch_bookings"));
      console.error("Error fetching bookings:", error.response?.data);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      (booking.user?.first_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (booking.teacher?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  if (isAuthLoading || loading) {
    return (
      <div className="notifications-loading">{t("bookingPage.loading")}</div>
    );
  }

  if (error) return <div className="p-20 c-red">{error}</div>;

  return (
    <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <h1 className="p-relative">{t("bookingPage.bookings_management")}</h1>
      <div className="wrapper d-grid gap-20">
        <div className="search-filter p-20 rad-10">
          <div className="d-flex gap-20">
            <input
              className="p-10 w-full rad-6"
              type="text"
              placeholder={t("bookingPage.search_placeholder")}
              value={search}
              onChange={handleSearchChange}
            />
            <select
              className="p-10 rad-6"
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="all">{t("bookingPage.all")}</option>
              <option value="pending">{t("bookingPage.pending")}</option>
              <option value="confirmed">{t("bookingPage.confirmed")}</option>
              <option value="completed">{t("bookingPage.completed")}</option>
              <option value="cancelled">{t("bookingPage.cancelled")}</option>
            </select>
          </div>
        </div>

        <div className="bookings-list p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">{t("bookingPage.bookings")}</h2>
          <div className="table-responsive">
            <table className="w-full">
              <thead>
                <tr>
                  <th>{t("bookingPage.user")}</th>
                  <th>{t("bookingPage.teacher")}</th>
                  <th>{t("bookingPage.date")}</th>
                  <th>{t("bookingPage.time")}</th>
                  <th>{t("bookingPage.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.user?.first_name || "N/A"}</td>
                    <td>{booking.teacher?.name || "N/A"}</td>
                    <td>{booking.date}</td>
                    <td>{booking.time}</td>
                    <td>{t(`bookingPage.${booking.status}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
