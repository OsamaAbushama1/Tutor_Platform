import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./BookingsList.css";
import Header from "../../components/Header";
import { getDay } from "date-fns";

const BookingsList = () => {
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [showModifiedAlert, setShowModifiedAlert] = useState(false);
  const [showCancelledAlert, setShowCancelledAlert] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/bookings/`, {
        withCredentials: true,
      });

      const now = new Date().getTime();

      const filteredBookings = response.data.filter((booking) => {
        if (!booking.date || !booking.time) {
          return true;
        }

        try {
          let timeStr = booking.time.trim();
          let hours, minutes;
          if (timeStr.includes("AM") || timeStr.includes("PM")) {
            const [time, period] = timeStr.split(" ");
            [hours, minutes] = time.split(":").map(Number);
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
          } else {
            [hours, minutes] = timeStr.split(":").map(Number);
          }

          const bookingDate = new Date(booking.date);
          bookingDate.setHours(hours, minutes, 0, 0);

          const bookingTimeMs = bookingDate.getTime();

          return bookingTimeMs >= now;
        } catch (error) {
          return true;
        }
      });

      console.log("Fetched bookings:", filteredBookings);
      setBookings(filteredBookings);

      const modifiedBookings = filteredBookings.filter(
        (booking) => booking.status === "modified"
      );
      const cancelledBookings = filteredBookings.filter(
        (booking) => booking.status === "cancelled"
      );
      const modifiedIds = modifiedBookings.map((b) => b.id);
      const cancelledIds = cancelledBookings.map((b) => b.id);

      const closedModifiedAlerts = JSON.parse(
        localStorage.getItem("closedModifiedAlerts") || "[]"
      );
      const closedCancelledAlerts = JSON.parse(
        localStorage.getItem("closedCancelledAlerts") || "[]"
      );

      const hasNewModifiedBookings = modifiedIds.some(
        (id) => !closedModifiedAlerts.includes(id)
      );
      const hasNewCancelledBookings = cancelledIds.some(
        (id) => !closedCancelledAlerts.includes(id)
      );

      setShowModifiedAlert(
        modifiedBookings.length > 0 && hasNewModifiedBookings
      );
      setShowCancelledAlert(
        cancelledBookings.length > 0 && hasNewCancelledBookings
      );
    } catch (err) {
      setError(t("bookings.fetchError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await axios.get(`/api/profile/`, {
          withCredentials: true,
        });
        setAuthChecked(true);
      } catch (err) {
        setAuthChecked(true);
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(t("bookings.authError"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!user) {
      verifyAuth();
    } else {
      setAuthChecked(true);
      setIsLoading(false);
    }
  }, [user, navigate, t]);

  useEffect(() => {
    if (authChecked && user) {
      fetchBookings();
    }
  }, [authChecked, user]);

  const formatBookingDetails = (booking) => {
    let day = "";
    let formattedDate = booking.date || "";
    const time = booking.time || "";
    const place = booking.place || t("bookings.unknownPlace");
    const status = t(`bookings.status.${booking.status}`) || booking.status;
    const subject = t(`subjects.${booking.subject}`);

    if (booking.date) {
      const dateObj = new Date(booking.date);
      formattedDate = dateObj.toLocaleDateString(
        i18n.language === "ar" ? "ar-EG" : "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      const dayIndex = getDay(dateObj);
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      day = t(`teachersList.days.${daysOfWeek[dayIndex]}`);
    }

    return { day, time, place, status, date: formattedDate, subject };
  };

  const closeModifiedAlert = () => {
    setShowModifiedAlert(false);
    const modifiedIds = bookings
      .filter((booking) => booking.status === "modified")
      .map((booking) => booking.id);
    localStorage.setItem("closedModifiedAlerts", JSON.stringify(modifiedIds));
  };

  const closeCancelledAlert = () => {
    setShowCancelledAlert(false);
    const cancelledIds = bookings
      .filter((booking) => booking.status === "cancelled")
      .map((booking) => booking.id);
    localStorage.setItem("closedCancelledAlerts", JSON.stringify(cancelledIds));
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setIsLoading(true);
      const response = await axios.patch(
        `/api/bookings/${bookingId}/`,
        { action: "cancel" },
        { withCredentials: true }
      );
      console.log("Cancel response:", response.data);
      await fetchBookings();
      setShowCancelConfirm(null);
      setShowCancelledAlert(true);
    } catch (err) {
      console.error("Cancel error:", err.response?.data);
      setError(
        err.response?.data?.detail ||
          (err.response?.status === 400 &&
          err.response?.data?.errors?.non_field_errors
            ? err.response.data.errors.non_field_errors[0]
            : err.response?.status === 500
            ? t("bookings.serverError")
            : t("bookings.cancelError"))
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="bookings-page">
        <div className="container mt-5 text-center">
          <span
            className="spinner-border spinner-border-lg"
            role="status"
            aria-hidden="true"
          ></span>
          <span className="ms-2">{t("bookings.loading")}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bookings-page" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <Header />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg bookings-card">
              <div className="card-body">
                <h2 className="card-title mb-4">{t("bookings.title")}</h2>
                {error && (
                  <div
                    className="alert alert-danger alert-dismissible fade show"
                    role="alert"
                  >
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}
                {showModifiedAlert && (
                  <div
                    className="alert alert-warning alert-dismissible fade show"
                    role="alert"
                  >
                    {t("bookings.modifiedWarning")}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeModifiedAlert}
                      aria-label={t("bookings.closeAlert")}
                    ></button>
                  </div>
                )}
                {showCancelledAlert && (
                  <div
                    className="alert alert-danger alert-dismissible fade show"
                    role="alert"
                  >
                    {t("bookings.cancelledWarning")}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeCancelledAlert}
                      aria-label={t("bookings.closeAlert")}
                    ></button>
                  </div>
                )}
                {isLoading ? (
                  <div className="text-center">
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span className="ms-2">{t("bookings.loading")}</span>
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text">{t("bookings.noBookings")}</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t("bookings.teacher")}</th>
                          <th>{t("bookings.subject")}</th>
                          <th>{t("bookings.date")}</th>
                          <th>{t("bookings.day")}</th>
                          <th>{t("bookings.time")}</th>
                          <th>{t("bookings.place")}</th>
                          <th>{t("bookings.statu")}</th>
                          <th>{t("bookings.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => {
                          const { day, time, place, status, date, subject } =
                            formatBookingDetails(booking);
                          const rowClass =
                            booking.status === "modified"
                              ? "table-warning"
                              : booking.status === "cancelled"
                              ? "table-danger"
                              : booking.status === "pending"
                              ? "table-info"
                              : "";
                          return (
                            <tr key={booking.id} className={rowClass}>
                              <td>
                                {booking.teacher?.name ||
                                  t("bookings.unknownTeacher")}
                              </td>
                              <td>{subject}</td>
                              <td>{date}</td>
                              <td>{day}</td>
                              <td>{time}</td>
                              <td>{place}</td>
                              <td>{status}</td>
                              <td>
                                {["confirmed", "modified"].includes(
                                  booking.status
                                ) ? (
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      setShowCancelConfirm(booking.id)
                                    }
                                    disabled={isLoading}
                                    aria-label={t("bookings.cancelButton")}
                                  >
                                    {t("bookings.cancelButton")}
                                  </button>
                                ) : booking.status === "cancelled" ? (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    disabled
                                    aria-label={t("bookings.cancelledButton")}
                                  >
                                    {t("bookings.cancelledButton")}
                                  </button>
                                ) : booking.status === "pending" ? (
                                  <button
                                    className="btn btn-info btn-sm"
                                    disabled
                                    aria-label={t("bookings.pendingButton")}
                                  >
                                    {t("bookings.pendingButton")}
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("bookings.confirmCancel")}</h5>
              </div>
              <div className="modal-body">
                <p>{t("bookings.confirmCancelMessage")}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCancelConfirm(null)}
                >
                  {t("bookings.closeAlert")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleCancelBooking(showCancelConfirm)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span className="ms-2">{t("bookings.processing")}</span>
                    </>
                  ) : (
                    t("bookings.cancelButton")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCancelConfirm && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default BookingsList;
