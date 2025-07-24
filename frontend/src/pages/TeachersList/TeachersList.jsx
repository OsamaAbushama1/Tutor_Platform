import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./TeachersList.css";
import defaultImage from "../../assets/alt.png";
import axios from "axios";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const generateTimes = () => {
  const times = [];
  for (let hour = 7; hour <= 23; hour++) {
    const amPm = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    times.push(`${displayHour}:00 ${amPm}`);
    if (hour < 23) {
      times.push(`${displayHour}:30 ${amPm}`);
    }
  }
  times.push("12:00 AM");
  return times;
};

const TeachersList = ({
  teachers: initialTeachers,
  user,
  setTeachers,
  apiUrl = "/api/",
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    subject: "",
    governorate: "",
    grade: "",
  });
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [canceledBookings, setCanceledBookings] = useState([]);

  const staticSubjects = [
    "Math",
    "Science",
    "English",
    "Arabic",
    "Physics",
    "Chemistry",
    "History",
    "Geography",
    "Biology",
    "Philosophy",
    "Psychology",
    "Economics",
    "Sociology",
    "French",
    "German",
    "Italian",
    "Spanish",
    "Religion",
    "Civics",
    "Advanced Mathematics",
  ];

  const staticGovernorates = [
    "Cairo",
    "Alexandria",
    "Giza",
    "Luxor",
    "Aswan",
    "Minya",
    "Sohag",
    "Port Said",
    "Ismailia",
    "Suez",
    "Damanhur",
    "Tanta",
    "Banha",
    "Shibin El-Kom",
    "Zagazig",
    "Fayoum",
    "Beni Suef",
    "Qena",
    "Asyut",
    "Damietta",
    "Kafr El Sheikh",
    "Mansoura",
    "Monufia",
    "Helwan",
    "Matrouh",
    "North Sinai",
    "South Sinai",
    "New Valley",
    "Red Sea",
    "Sharkia",
    "Gharbia",
    "Beheira",
  ];

  const staticGrades = ["First", "Second", "Third"];
  const staticTimes = generateTimes();

  useEffect(() => {
    if (!initialTeachers || initialTeachers.length === 0) {
      fetchTeachers();
    }
    if (selectedTeacher?.id && selectedTeacher?.schedule) {
      const entries = [];
      Object.entries(selectedTeacher.schedule).forEach(([date, times]) => {
        Object.entries(times).forEach(([time, place]) => {
          entries.push({
            id: Date.now() + Math.random(),
            date: new Date(date),
            time,
            place,
          });
        });
      });
      setScheduleEntries(entries);
    }
  }, [initialTeachers, selectedTeacher]);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${apiUrl}teachers/`, {
        withCredentials: true,
      });
      setTeachers(response.data);
    } catch (error) {
      setErrorMessage(t("teachersList.errors.fetchError"));
    }
  };

  const handleCancelLesson = async (entry) => {
    try {
      const formattedDate = format(entry.date, "yyyy-MM-dd");
      const bookings = await axios.get(
        `${apiUrl}teachers/${selectedTeacher.id}/bookings-by-slot/`,
        {
          params: { date: formattedDate, time: entry.time, place: entry.place },
          withCredentials: true,
        }
      );
      const affectedBookings = bookings.data.filter(
        (booking) => booking.status !== "cancelled"
      );

      if (affectedBookings.length > 0) {
        setCanceledBookings((prev) => [
          ...prev,
          ...affectedBookings.map((booking) => ({
            ...booking,
            canceledDate: formattedDate,
            canceledTime: entry.time,
            canceledPlace: entry.place,
          })),
        ]);
      }

      const updatedEntries = scheduleEntries.filter(
        (e) => e.id !== entry.id && e !== entry
      );
      setScheduleEntries(updatedEntries);
      setErrorMessage(
        affectedBookings.length > 0
          ? t("teachersList.lessonMarkedForCancellation", {
              count: affectedBookings.length,
            })
          : t("teachersList.noBookingsToCancel")
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail || t("teachersList.errors.cancelError")
      );
    }
  };

  const teachers = initialTeachers || [];
  const governorates = [
    ...new Set([
      ...staticGovernorates,
      ...(teachers.length ? teachers.map((t) => t.governorate) : []),
    ]),
  ];
  const subjects = [
    ...new Set([
      ...staticSubjects,
      ...(teachers.length ? teachers.map((t) => t.subject) : []),
    ]),
  ];
  const grades = [
    ...new Set([
      ...staticGrades,
      ...(teachers.length ? teachers.flatMap((t) => t.grade) : []),
    ]),
  ];

  const filteredTeachers = teachers.filter(
    (teacher) =>
      (filters.subject === "" || teacher.subject.includes(filters.subject)) &&
      (filters.governorate === "" ||
        teacher.governorate.includes(filters.governorate)) &&
      (filters.grade === "" || teacher.grade.includes(filters.grade)) &&
      (teacher.status || "active") !== "suspended"
  );

  const sliderSettings = {
    dots: false,
    infinite: filteredTeachers.length > 3,
    speed: 500,
    slidesToShow: Math.min(filteredTeachers.length, 3),
    slidesToScroll: 1,
    autoplaySpeed: 3000,
    arrows: filteredTeachers.length > 3,
    centerMode: false,
    centerPadding: "0px",
    responsive: [
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: Math.min(filteredTeachers.length, 2),
          centerMode: false,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: Math.min(filteredTeachers.length, 1),
          centerMode: false,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: Math.min(filteredTeachers.length, 1),
          centerMode: true,
          centerPadding: "0px",
        },
      },
    ],
  };

  const toggleInfo = (teacherId) => {
    setActiveTeacher(activeTeacher === teacherId ? null : teacherId);
  };

  const handleCardClick = (teacherId, e) => {
    if (activeTeacher === teacherId) {
      setActiveTeacher(null);
    }
  };

  const openModal = (teacher) => {
    setSelectedTeacher(teacher);
    setModalOpen(true);
    setErrorMessage("");
    setCanceledBookings([]);
    if (teacher?.schedule) {
      const entries = [];
      Object.entries(teacher.schedule).forEach(([date, times]) => {
        Object.entries(times).forEach(([time, place]) => {
          entries.push({
            id: Date.now() + Math.random(),
            date: new Date(date),
            time,
            place,
          });
        });
      });
      setScheduleEntries(entries);
    } else {
      const newEntries = [
        {
          id: Date.now(),
          date: new Date(),
          time: staticTimes[0],
          place: "",
        },
      ];
      setScheduleEntries(newEntries);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTeacher(null);
    setErrorMessage("");
    setScheduleEntries([]);
    setCanceledBookings([]);
  };

  const addScheduleEntry = () => {
    const newEntries = [
      ...scheduleEntries,
      {
        id: Date.now(),
        date: new Date(),
        time: staticTimes[0],
        place: "",
      },
    ];
    setScheduleEntries(newEntries);
  };

  const updateScheduleEntry = (identifier, field, value) => {
    const updatedEntries = scheduleEntries.map((entry, i) =>
      (entry.id && entry.id === identifier) || i === identifier
        ? { ...entry, [field]: value }
        : entry
    );
    setScheduleEntries(updatedEntries);
  };

  const removeScheduleEntry = (identifier) => {
    const updatedEntries = scheduleEntries.filter((entry, i) =>
      entry.id ? entry.id !== identifier : i !== identifier
    );
    setScheduleEntries(updatedEntries);
  };

  const handleSave = async (updatedTeacher) => {
    try {
      const schedule = {};
      scheduleEntries.forEach((entry) => {
        if (entry.date && entry.time && entry.place) {
          const formattedDate = format(entry.date, "yyyy-MM-dd");
          if (!schedule[formattedDate]) {
            schedule[formattedDate] = {};
          }
          schedule[formattedDate][entry.time] = entry.place;
        }
      });

      if (canceledBookings.length > 0) {
        await axios.post(
          `${apiUrl}teachers/${selectedTeacher.id}/notify-students/`,
          {
            message: t("teachersList.defaultCancelMessage"),
            booking_ids: canceledBookings.map((booking) => booking.id),
            action: "cancel",
          },
          { withCredentials: true }
        );
      }

      const formData = new FormData();
      formData.append("name", updatedTeacher.name);
      formData.append("subject", updatedTeacher.subject);
      formData.append("governorate", updatedTeacher.governorate);
      formData.append("grade", JSON.stringify(updatedTeacher.grade));
      formData.append("price_per_session", updatedTeacher.price_per_session);
      formData.append(
        "promotional_videos",
        updatedTeacher.promotional_videos || ""
      );
      const maxStudents = parseInt(updatedTeacher.max_students_per_group) || 1;
      formData.append("max_students_per_group", maxStudents);
      if (updatedTeacher.image) {
        formData.append("image", updatedTeacher.image);
      }
      formData.append("is_top_rated", updatedTeacher.is_top_rated);
      formData.append("manually_set_top_rated", updatedTeacher.is_top_rated);
      formData.append("schedule", JSON.stringify(schedule));
      if (updatedTeacher.status) {
        formData.append("status", updatedTeacher.status);
      }

      let updatedTeacherData;
      if (updatedTeacher.id) {
        const response = await axios.patch(
          `${apiUrl}teachers/${updatedTeacher.id}/`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        updatedTeacherData = response.data;
      } else {
        const teacherExists = teachers.some(
          (teacher) => teacher.name === updatedTeacher.name
        );
        if (teacherExists) {
          setErrorMessage(t("teachersList.errors.teacherExists"));
          return;
        }
        const response = await axios.post(`${apiUrl}teachers/`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          data: { ...formData, status: "active" },
        });
        updatedTeacherData = response.data;
      }

      setTeachers((prevTeachers) => {
        if (updatedTeacher.id) {
          return prevTeachers.map((teacher) =>
            teacher.id === updatedTeacher.id ? updatedTeacherData : teacher
          );
        } else {
          return [...prevTeachers, updatedTeacherData];
        }
      });

      setErrorMessage(
        t("teachersList.saveSuccessWithNotifications", {
          cancelCount: canceledBookings.length,
        })
      );
      closeModal();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail || t("teachersList.errors.saveError")
      );
    }
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm(t("teachersList.deleteConfirm"))) {
      try {
        await axios.delete(`${apiUrl}teachers/${teacherId}/`, {
          withCredentials: true,
        });
        const teacherResponse = await axios.get(`${apiUrl}teachers/`);
        setTeachers(teacherResponse.data);
      } catch (error) {
        setErrorMessage(t("teachersList.errors.deleteError"));
      }
    }
  };

  const isStudentView = !user?.is_superuser && !user?.is_staff;

  const renderTeacherCard = (teacher) => {
    return (
      <div key={teacher.id}>
        <div
          className="teachers-card"
          onClick={(e) => handleCardClick(teacher.id, e)}
        >
          <div className="teacher-image-wrapper">
            <img
              src={teacher.image ? `${apiUrl}${teacher.image}` : defaultImage}
              alt={t("teachersList.teacherImageAlt", { name: teacher.name })}
              className="teachers-card-image"
            />
            {teacher.is_top_rated && (
              <span className="top-rated-badge">
                {t("teachersList.topRatedBadge")}
              </span>
            )}
          </div>
          <div className="teachers-card-body">
            <div
              className="teachers-exclamation"
              onClick={(e) => {
                e.stopPropagation();
                toggleInfo(teacher.id);
              }}
              aria-label={t("teachersList.toggleInfo")}
            >
              <span>!</span>
            </div>
            <h5 className="teachers-card-title">{teacher.name}</h5>
            <div
              className={`teachers-card-info ${
                activeTeacher === teacher.id ? "active" : ""
              } ${isStudentView ? "student-view" : ""}`}
            >
              <p>
                {t("teachersList.subject")}: {t(`subjects.${teacher.subject}`)}
              </p>
              <p>
                {t("teachersList.governorate")}:{" "}
                {t(`governorates.${teacher.governorate}`)}
              </p>
              <p>
                {t("teachersList.grades")}:{" "}
                {teacher.grade.length > 0
                  ? teacher.grade.map((g) => t(`grades.${g}`)).join(", ")
                  : t("teachersList.noGrades")}
              </p>
              <p>
                {t("teachersList.rating")}:{" "}
                {(parseFloat(teacher.rating) || 0).toFixed(1)}
                {teacher.rating_count > 0 && ` (${teacher.rating_count})`}
              </p>
              <p>
                {t("teachersList.pricePerSession")}:{" "}
                {teacher.price_per_session
                  ? `${teacher.price_per_session} ${t("teachersList.currency")}`
                  : t("teachersList.priceNotAvailable")}
              </p>
              <a
                href={`/teacher/${teacher.id}`}
                className="teachers-btn-primary"
                onClick={(e) => e.stopPropagation()}
                aria-label={t("teachersList.viewDetails", {
                  name: teacher.name,
                })}
              >
                {t("teachersList.viewDetailsButton")}
              </a>
              {(user?.is_superuser || user?.is_staff) && (
                <div style={{ marginTop: "10px" }}>
                  <button
                    className="teachers-btn-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(teacher);
                    }}
                    aria-label={t("teachersList.editTeacher", {
                      name: teacher.name,
                    })}
                  >
                    {t("teachersList.editButton")}
                  </button>
                  <button
                    className="teachers-btn-delete "
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(teacher.id);
                    }}
                    aria-label={t("teachersList.deleteTeacher", {
                      name: teacher.name,
                    })}
                  >
                    {t("teachersList.deleteButton")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="teachers-page">
      <Header />
      <main className="container">
        <div className="teachers-container">
          <h1 className="teachers-title">{t("teachersList.title")}</h1>
          <p className="teachers-lead">{t("teachersList.lead")}</p>
          {(user?.is_superuser || user?.is_staff) && (
            <button
              className="teachers-btn-add"
              onClick={() => openModal({})}
              aria-label={t("teachersList.addTeacher")}
            >
              {t("teachersList.addTeacherButton")}
            </button>
          )}
          <form className="mb-4">
            <div className="row">
              <div className="col-md-4">
                <select
                  className="form-select teachers-form-select mb-2"
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters({ ...filters, subject: e.target.value })
                  }
                  aria-label={t("teachersList.selectSubject")}
                >
                  <option value="">
                    {t("teachersList.selectSubjectOption")}
                  </option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {t(`subjects.${subject}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select teachers-form-select mb-2"
                  value={filters.governorate}
                  onChange={(e) =>
                    setFilters({ ...filters, governorate: e.target.value })
                  }
                  aria-label={t("teachersList.selectGovernorate")}
                >
                  <option value="">
                    {t("teachersList.selectGovernorateOption")}
                  </option>
                  {governorates.map((gov, index) => (
                    <option key={index} value={gov}>
                      {t(`governorates.${gov}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select teachers-form-select mb-2"
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters({ ...filters, grade: e.target.value })
                  }
                  aria-label={t("teachersList.selectGrade")}
                >
                  <option value="">
                    {t("teachersList.selectGradeOption")}
                  </option>
                  {grades.map((grade, index) => (
                    <option key={index} value={grade}>
                      {t(`grades.${grade}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
          {filteredTeachers.length > 0 ? (
            <Slider
              {...sliderSettings}
              className="teachers-slider"
              aria-label={t("teachersList.sliderLabel")}
            >
              {filteredTeachers.map((teacher) => renderTeacherCard(teacher))}
            </Slider>
          ) : (
            <p className="text-center">{t("teachersList.noTeachersFound")}</p>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content teacherlist">
            <h2>
              {selectedTeacher?.id
                ? t("teachersList.editTeacherTitle")
                : t("teachersList.addTeacherTitle")}
            </h2>
            {errorMessage && (
              <p
                style={{
                  color: "red",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
                aria-live="polite"
              >
                {errorMessage}
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedGrades = Array.from(
                  e.target.querySelectorAll('input[name="grade"]:checked')
                ).map((input) => input.value);
                const updatedTeacher = {
                  id: selectedTeacher?.id || null,
                  name: e.target.name.value,
                  subject: e.target.subject.value,
                  governorate: e.target.governorate.value,
                  grade: selectedGrades,
                  price_per_session:
                    parseFloat(e.target.price_per_session.value) || 0,
                  max_students_per_group:
                    parseInt(e.target.max_students_per_group.value) || 1,
                  promotional_videos: e.target.promotional_videos.value || "",
                  image: e.target.image.files[0] || null,
                  is_top_rated: e.target.is_top_rated.checked,
                  status: selectedTeacher?.status || "active",
                };
                handleSave(updatedTeacher);
              }}
              encType="multipart/form-data"
            >
              <div className="modal-form-group">
                <label htmlFor="name">{t("teachersList.form.name")}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={selectedTeacher?.name || ""}
                  placeholder={t("teachersList.form.namePlaceholder")}
                  required
                  aria-required="true"
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="subject">
                  {t("teachersList.form.subject")}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={selectedTeacher?.subject || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      subject: e.target.value,
                    })
                  }
                  required
                  aria-required="true"
                >
                  <option value="">
                    {t("teachersList.form.selectSubject")}
                  </option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {t(`subjects.${subject}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="governorate">
                  {t("teachersList.form.governorate")}
                </label>
                <select
                  id="governorate"
                  name="governorate"
                  value={selectedTeacher?.governorate || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      governorate: e.target.value,
                    })
                  }
                  required
                  aria-required="true"
                >
                  <option value="">
                    {t("teachersList.form.selectGovernorate")}
                  </option>
                  {governorates.map((gov, index) => (
                    <option key={index} value={gov}>
                      {t(`governorates.${gov}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>{t("teachersList.form.grades")}</label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {staticGrades.map((grade, index) => (
                    <label
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="grade"
                        value={grade}
                        checked={
                          selectedTeacher?.grade?.includes(grade) || false
                        }
                        onChange={(e) => {
                          const newGrades = e.target.checked
                            ? [...(selectedTeacher?.grade || []), grade]
                            : selectedTeacher?.grade?.filter(
                                (g) => g !== grade
                              ) || [];
                          setSelectedTeacher({
                            ...selectedTeacher,
                            grade: newGrades,
                          });
                        }}
                        aria-label={t(`grades.${grade}`)}
                      />
                      {t(`grades.${grade}`)}
                    </label>
                  ))}
                </div>
                <small className="form-text text-muted">
                  {t("teachersList.form.gradesHelp")}
                </small>
              </div>

              <div className="modal-form-group">
                <label htmlFor="price_per_session">
                  {t("teachersList.form.pricePerSession")} (
                  {t("teachersList.currency")})
                </label>
                <input
                  type="number"
                  id="price_per_session"
                  name="price_per_session"
                  step="0.1"
                  min="0"
                  defaultValue={selectedTeacher?.price_per_session || 0}
                  required
                  aria-required="true"
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="max_students_per_group">
                  {t("teachersList.form.maxStudentsPerGroup")}
                </label>
                <input
                  type="number"
                  id="max_students_per_group"
                  name="max_students_per_group"
                  min="1"
                  defaultValue={selectedTeacher?.max_students_per_group || 0}
                  required
                  aria-required="true"
                />
              </div>

              <div className="modal-form-group">
                <label htmlFor="promotional_videos">
                  {t("teachersList.form.promotionalVideos")}
                </label>
                <input
                  type="url"
                  id="promotional_videos"
                  name="promotional_videos"
                  defaultValue={selectedTeacher?.promotional_videos || ""}
                  placeholder={t(
                    "teachersList.form.promotionalVideosPlaceholder"
                  )}
                />
                <small
                  id="promotionalVideosHelp"
                  className="form-text text-muted"
                >
                  {t("teachersList.form.promotionalVideosHelp")}{" "}
                </small>
              </div>

              <div className="modal-form-group">
                <label htmlFor="image">{t("teachersList.form.image")}</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  aria-describedby="imageHelp"
                />
                {selectedTeacher?.image && (
                  <p>
                    {t("teachersList.form.currentImage")}{" "}
                    <a
                      href={`${apiUrl}${selectedTeacher.image}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("teachersList.form.viewImage")}
                    </a>
                  </p>
                )}
                <small id="imageHelp" className="form-text text-muted">
                  {t("teachersList.form.imageHelp")}
                </small>
              </div>

              <div className="modal-form-group">
                <label>{t("teachersList.form.schedule")}</label>
                {scheduleEntries.map((entry, index) => (
                  <div className="DateTimePlace" key={entry.id || index}>
                    <DatePicker
                      selected={entry.date}
                      onChange={(date) =>
                        updateScheduleEntry(entry.id || index, "date", date)
                      }
                      dateFormat="yyyy-MM-dd"
                      placeholderText={t("teachersList.form.selectDate")}
                      required
                      aria-label={t("teachersList.form.selectDate")}
                      className="form-control"
                      minDate={new Date()}
                    />
                    <select
                      value={entry.time}
                      onChange={(e) =>
                        updateScheduleEntry(
                          entry.id || index,
                          "time",
                          e.target.value
                        )
                      }
                      required
                      aria-label={t("teachersList.form.selectTime")}
                    >
                      <option value="">
                        {t("teachersList.form.selectTimeOption")}
                      </option>
                      {staticTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder={t("teachersList.form.placePlaceholder")}
                      value={entry.place}
                      onChange={(e) =>
                        updateScheduleEntry(
                          entry.id || index,
                          "place",
                          e.target.value
                        )
                      }
                      required
                      aria-required="true"
                    />
                    <button
                      className="btn-shape bg-red c-white fs-13"
                      type="button"
                      onClick={() => removeScheduleEntry(entry.id || index)}
                      aria-label={t("teachersList.form.removeSchedule")}
                    >
                      {t("teachersList.form.removeButton")}
                    </button>
                    {selectedTeacher?.id && (
                      <button
                        className="btn-shape bg-orange c-white fs-13"
                        type="button"
                        onClick={() => handleCancelLesson(entry)}
                        aria-label={t("teachersList.form.cancelLesson")}
                      >
                        {t("teachersList.form.cancelLessonButton")}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addScheduleEntry}
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#007bff",
                    color: "white",
                    padding: "5px 10px",
                  }}
                  aria-label={t("teachersList.form.addSchedule")}
                >
                  {t("teachersList.form.addScheduleButton")}
                </button>
              </div>

              <div className="modal-form-group">
                <div className="checkbox-container">
                  <label htmlFor="is_top_rated">
                    {t("teachersList.form.topRated")}
                  </label>
                  <input
                    type="checkbox"
                    id="is_top_rated"
                    name="is_top_rated"
                    defaultChecked={selectedTeacher?.is_top_rated || false}
                  />
                </div>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-close"
                  onClick={closeModal}
                  aria-label={t("teachersList.form.close")}
                >
                  {t("teachersList.form.closeButton")}
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-save"
                  aria-label={t("teachersList.form.save")}
                >
                  {t("teachersList.form.saveButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList;
