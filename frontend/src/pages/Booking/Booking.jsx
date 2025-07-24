import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import "./Booking.css";
import { useTranslation } from "react-i18next";
import axios from "axios";

const Booking = ({
  teachers,
  bookings,
  setBookings,
  updateTeacherRating,
  scheduleRatingPopup,
}) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const teacher = teachers.find((t) => t.id === parseInt(id));
  const { selectedDate, selectedTime, place } = location.state || {};

  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teacher) return;

    const currentBooking = bookings.find(
      (b) =>
        b.teacher?.id === teacher.id &&
        b.date === selectedDate &&
        b.time === selectedTime &&
        b.place === place
    );
    if (currentBooking) {
      setPaymentCompleted(true);
    }
  }, [bookings, teacher, selectedDate, selectedTime, place]);

  if (!teacher) {
    return <p className="text-center mt-5">{t("booking.teacherNotFound")}</p>;
  }

  if (!selectedDate || !selectedTime || !place) {
    return (
      <div className="booking-container">
        <div className="booking-card">
          <h2 className="booking-title">
            {t("booking.title")} {teacher.name || t("booking.unknownTeacher")}
          </h2>
          <p className="booking-message">
            {t("booking.missingDetailsMessage")}
          </p>
          <Link
            to={`/teacher/${teacher.id}`}
            className="btn-gradient-primary"
            aria-label={t("booking.goBack", {
              name: teacher.name || t("booking.unknownTeacher"),
            })}
          >
            {t("booking.goBackButton")}
          </Link>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsLoading(true);
    setError("");

    if (!teacher.id) {
      setError(t("booking.invalidTeacher"));
      setIsLoading(false);
      return;
    }

    const bookingData = {
      teacher_id: teacher.id,
      subject: teacher.subject,
      date: selectedDate,
      time: selectedTime,
      place: place,
    };

    try {
      const response = await axios.post(`/api/bookings/`, bookingData, {
        withCredentials: true,
      });

      const newBooking = {
        id: response.data.id,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          subject: teacher.subject,
        },
        subject: teacher.subject,
        date: selectedDate,
        time: selectedTime,
        place: place,
        status: response.data.status,
      };
      setBookings([...bookings, newBooking]);
      setPaymentCompleted(true);
      scheduleRatingPopup(
        teacher.id,
        new Date(selectedDate).getTime(),
        response.data.id,
        teacher.name
      );
      setIsLoading(false);
    } catch (err) {
      const errorMessage =
        err.message ||
        err.response?.data?.teacher_id?.[0] ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).join(", ") ||
        t("booking.paymentError");
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h2 className="booking-title">
          {t("booking.title")} {teacher.name || t("booking.unknownTeacher")}
        </h2>
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
        {!paymentCompleted ? (
          <div className="booking-details">
            <p className="booking-detail">
              <strong>{t("booking.date")}</strong> {selectedDate}
            </p>
            <p className="booking-detail">
              <strong>{t("booking.time")}</strong> {selectedTime}
            </p>
            <p className="booking-detail">
              <strong>{t("booking.place")}</strong> {place}
            </p>
            <p className="booking-detail">
              <strong>{t("booking.price")}</strong>{" "}
              {teacher.price_per_session
                ? `${teacher.price_per_session} ${t("booking.currency")}`
                : t("booking.na")}
            </p>
            <button
              onClick={handlePayment}
              className="btn-gradient-success"
              disabled={isLoading}
              aria-label={t("booking.payNow", {
                name: teacher.name || t("booking.unknownTeacher"),
              })}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span className="ms-2">{t("booking.processing")}</span>
                </>
              ) : (
                t("booking.payNowButton")
              )}
            </button>
          </div>
        ) : (
          <div className="booking-success">
            <h3 className="booking-subtitle">{t("booking.paymentSuccess")}</h3>
            <p className="booking-message">
              {t("booking.paymentSuccessMessage")}
            </p>
            <div className="booking-details">
              <p className="booking-detail">
                <strong>{t("booking.date")}</strong> {selectedDate}
              </p>
              <p className="booking-detail">
                <strong>{t("booking.time")}</strong> {selectedTime}
              </p>
              <p className="booking-detail">
                <strong>{t("booking.place")}</strong> {place}
              </p>
            </div>
            <Link to="/bookings" className="btn-gradient-primary">
              {t("booking.viewBookings")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
