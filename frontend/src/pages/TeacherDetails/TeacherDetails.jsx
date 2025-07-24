import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Header from "../../components/Header";
import axios from "axios";
import "./TeacherDetails.css";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import defaultImage from "../../assets/alt.png";

const TeacherDetails = ({ apiUrl }) => {
  const { t, i18n, ready } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [teacher, setTeacher] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [slotStatuses, setSlotStatuses] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setError("");
        const response = await axios.get(`${apiUrl}teachers/${id}/`, {
          withCredentials: true,
        });
        setTeacher(response.data);

        const schedule = response.data.schedule || {};
        const statusPromises = Object.entries(schedule).flatMap(
          ([date, times]) =>
            Object.entries(times).map(async ([time, place]) => {
              try {
                const bookingResponse = await axios.get(
                  `${apiUrl}teachers/${id}/bookings-by-slot/`,
                  {
                    params: { date, time, place },
                    withCredentials: true,
                  }
                );
                const bookingCount = bookingResponse.data.filter(
                  (booking) => booking.status !== "cancelled"
                ).length;
                return {
                  slotKey: `${date}-${time}-${place}`,
                  bookingCount,
                  isFull: bookingCount >= response.data.max_students_per_group,
                };
              } catch (err) {
                return {
                  slotKey: `${date}-${time}-${place}`,
                  bookingCount: 0,
                  isFull: false,
                  error: t("teacherDetails.fetchBookingsError"),
                };
              }
            })
        );
        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, status) => {
          acc[status.slotKey] = status;
          return acc;
        }, {});
        setSlotStatuses(statusMap);
      } catch (error) {
        setError(t("teacherDetails.fetchTeacherError"));
      }
    };
    fetchTeacher();
  }, [id, apiUrl, t]);

  if (!teacher) {
    return (
      <p className="text-center mt-5 loading-text">
        {ready ? t("teacherDetails.loading") : "Loading..."}
      </p>
    );
  }

  const availableDates =
    teacher.schedule && Object.keys(teacher.schedule).length
      ? Object.keys(teacher.schedule)
          .filter((dateStr) => new Date(dateStr) >= new Date())
          .map((dateStr) => new Date(dateStr))
      : [];

  const availableTimes =
    selectedDate && format(selectedDate, "yyyy-MM-dd") in teacher.schedule
      ? Object.keys(teacher.schedule[format(selectedDate, "yyyy-MM-dd")])
      : [];

  const getPlace = (time) => {
    return selectedDate &&
      format(selectedDate, "yyyy-MM-dd") in teacher.schedule &&
      teacher.schedule[format(selectedDate, "yyyy-MM-dd")][time]
      ? teacher.schedule[format(selectedDate, "yyyy-MM-dd")][time]
      : t("teacherDetails.na");
  };
  const selectedPlace = selectedTime ? getPlace(selectedTime) : "";

  const getSlotStatus = (date, time, place) => {
    const slotKey = `${date}-${time}-${place}`;
    return slotStatuses[slotKey] || { bookingCount: 0, isFull: false };
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const slotStatus = getSlotStatus(
        formattedDate,
        selectedTime,
        selectedPlace
      );
      navigate(`/booking/${teacher.id}`, {
        state: {
          selectedDate: formattedDate,
          selectedTime,
          place: selectedPlace,
          isPending: slotStatus.isFull,
        },
      });
    }
  };

  return (
    <div
      className="teacher-details-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      <Header />
      <main className="container teacher-details-container mt-5 mb-5">
        <section className="teacher-details-hero">
          <div className="teacher-details-card shadow-xl">
            <div className="row g-0">
              <div className="col-lg-5 teacher-image-section">
                <div className="teacher-image-wrapper">
                  <img
                    src={
                      teacher.image ? `${apiUrl}${teacher.image}` : defaultImage
                    }
                    alt={t("teacherDetails.teacherImageAlt", {
                      name: teacher.name,
                    })}
                    className="teacher-image img-fluid"
                  />
                  {teacher.is_top_rated && (
                    <span className="top-rated-badge-default">
                      {t("teacherDetails.topRatedBadge")}
                    </span>
                  )}
                </div>
              </div>
              <div className="col-lg-7 teacher-info-section">
                <div className="card-body p-5">
                  <h1 className="teacher-name">{teacher.name}</h1>
                  <p className="teacher-subtitle">
                    {ready
                      ? t("teacherDetails.subtitle")
                      : "Please select a date, time, and place to proceed with the booking."}
                  </p>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <hr className="divider" />
                  {availableDates.length === 0 && (
                    <p className="text-muted">
                      {t("teacherDetails.noAvailableDates")}
                    </p>
                  )}
                  <div className="teacher-details-grid">
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.subject")}</strong>{" "}
                      <span>{t(`subjects.${teacher.subject}`)}</span>
                    </p>
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.governorate")}</strong>{" "}
                      <span>{t(`governorates.${teacher.governorate}`)}</span>
                    </p>
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.grades")}</strong>{" "}
                      <span>
                        {teacher.grade && teacher.grade.length > 0
                          ? teacher.grade
                              .map((g) => t(`grades.${g}`))
                              .join(", ")
                          : t("teacherDetails.noGrades")}
                      </span>
                    </p>
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.rating")}</strong>
                      <span className="rating-stars">★★★★★</span>{" "}
                      {(teacher.rating || 0).toFixed(1)}
                    </p>
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.price")}</strong>{" "}
                      <span>
                        {teacher.price_per_session
                          ? `${teacher.price_per_session} ${t(
                              "teacherDetails.currency"
                            )}`
                          : t("teacherDetails.na")}
                      </span>
                    </p>
                    <p className="teacher-detail">
                      <strong>{t("teacherDetails.maxStudents")}</strong>{" "}
                      <span>
                        {teacher.max_students_per_group ||
                          t("teacherDetails.na")}
                      </span>
                    </p>
                    <div className="teacher-detail">
                      <strong>{t("teacherDetails.date")}</strong>{" "}
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date);
                          setSelectedTime("");
                          setError("");
                        }}
                        includeDates={availableDates}
                        minDate={new Date()}
                        dateFormat="yyyy-MM-dd"
                        placeholderText={t("teacherDetails.selectDateOption")}
                        className="form-control det"
                        style={{ background: "#2c2c2c", color: "#fff" }}
                        aria-label={t("teacherDetails.selectDate")}
                      />
                    </div>
                    {selectedDate && (
                      <p className="teacher-detail">
                        <strong>{t("teacherDetails.time")}</strong>{" "}
                        {availableTimes.length > 0 ? (
                          <select
                            value={selectedTime}
                            onChange={(e) => {
                              setSelectedTime(e.target.value);
                              setError("");
                            }}
                            className="form-select time"
                            style={{ background: "#2c2c2c", color: "#fff" }}
                            aria-label={t("teacherDetails.selectTime")}
                          >
                            <option value="">
                              {t("teacherDetails.selectTimeOption")}
                            </option>
                            {availableTimes.map((time) => {
                              const place = getPlace(time);
                              const slotKey = `${format(
                                selectedDate,
                                "yyyy-MM-dd"
                              )}-${time}-${place}`;
                              const status = slotStatuses[slotKey] || {
                                bookingCount: 0,
                                isFull: false,
                              };
                              return (
                                <option
                                  key={time}
                                  value={time}
                                  disabled={false}
                                >
                                  {time}{" "}
                                  {status.isFull
                                    ? `(${t("teacherDetails.slotFull")})`
                                    : `(${status.bookingCount}/${
                                        teacher.max_students_per_group
                                      } ${t("teacherDetails.booked")})`}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span>{t("teacherDetails.noAvailableTimes")}</span>
                        )}
                      </p>
                    )}
                    {selectedTime && (
                      <p className="teacher-detail">
                        <strong>{t("teacherDetails.place")}</strong>{" "}
                        <span>{selectedPlace}</span>
                      </p>
                    )}
                  </div>
                  <div className="teacher-actions mt-4">
                    {teacher.promotional_videos && (
                      <a
                        href={teacher.promotional_videos}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-gradient-primary teacher-btn"
                        aria-label={t("teacherDetails.watchVideo", {
                          name: teacher.name,
                        })}
                      >
                        {t("teacherDetails.watchVideoButton")}
                      </a>
                    )}
                    <button
                      className="btn btn-gradient-success teacher-btn"
                      onClick={handleBookNow}
                      disabled={!selectedDate || !selectedTime}
                      aria-label={t("teacherDetails.bookNow", {
                        name: teacher.name,
                      })}
                    >
                      {selectedDate &&
                      selectedTime &&
                      getSlotStatus(
                        format(selectedDate, "yyyy-MM-dd"),
                        selectedTime,
                        selectedPlace
                      ).isFull
                        ? t("teacherDetails.joinWaitingList")
                        : t("teacherDetails.bookNowButton")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherDetails;
