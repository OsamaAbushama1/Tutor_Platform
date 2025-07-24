import React, { useState, useEffect, useContext } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import { addHours, parse } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import RatingPopup from "./pages/Rating/RatingPopup";
import Home from "./pages/Home/Home";
import TeacherDetails from "./pages/TeacherDetails/TeacherDetails";
import Login from "./pages/Login_Reg/Login";
import Register from "./pages/Login_Reg/Register";
import Booking from "./pages/Booking/Booking";
import BookingsList from "./pages/BookingList/BookingsList";
import TeachersList from "./pages/TeachersList/TeachersList";
import { AuthContext } from "./context/AuthContext";
import ForgotPassword from "./pages/Login_Reg/ForgotPassword";
import ResetPassword from "./pages/Login_Reg/ResetPassword";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";
import AdminDashboard from "./Admin/AdminDashboard";

const API_URL = "/api/";
const TIMEZONE = "Africa/Cairo";

const App = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [pendingRating, setPendingRating] = useState(null);
  const [ratedTeachers, setRatedTeachers] = useState(new Set());
  const [shownPopups, setShownPopups] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = async () => {
    try {
      await axios.post(
        `${API_URL}auth/refresh/`,
        {},
        { withCredentials: true }
      );
      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchRatedTeachers = async () => {
        try {
          const response = await axios.get(`${API_URL}rated-teachers/`, {
            withCredentials: true,
          });
          const teacherIds = response.data.map((rated) => rated.teacher.id);
          setRatedTeachers(new Set(teacherIds));
        } catch (error) {
          console.error("Error fetching rated teachers:", error);
          if (error.response?.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
              try {
                const retryResponse = await axios.get(
                  `${API_URL}rated-teachers/`,
                  {
                    withCredentials: true,
                  }
                );
                const teacherIds = retryResponse.data.map(
                  (rated) => rated.teacher.id
                );
                setRatedTeachers(new Set(teacherIds));
              } catch (retryError) {
                console.error("Retry failed:", retryError);
              }
            }
          }
        }
      };
      fetchRatedTeachers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}teachers/`, {
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        setTeachers(response.data);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const updateTeacherRating = async (teacherId, rating) => {
    try {
      const ratingData = {
        teacher: teacherId,
        rating: rating,
      };
      const response = await axios.post(`${API_URL}ratings/`, ratingData, {
        withCredentials: true,
      });
      setRatings((prevRatings) => [...prevRatings, response.data]);

      const teacherResponse = await axios.get(
        `${API_URL}teachers/${teacherId}/`,
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        }
      );
      const updatedTeacher = teacherResponse.data;
      setTeachers((prevTeachers) =>
        prevTeachers.map((teacher) =>
          teacher.id === teacherId ? updatedTeacher : teacher
        )
      );

      return response.data;
    } catch (error) {
      console.error("Error updating teacher rating:", error);
      throw error;
    }
  };

  const markBookingRated = async (bookingId) => {
    try {
      await axios.patch(
        `${API_URL}bookings/${bookingId}/`,
        { action: "mark_rated" },
        { withCredentials: true }
      );
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, rated: true } : booking
        )
      );
    } catch (error) {
      console.error("Error marking booking as rated:", error);
    }
  };

  const closeBookingPopup = async (bookingId) => {
    try {
      await axios.patch(
        `${API_URL}bookings/${bookingId}/`,
        { action: "close_popup" },
        { withCredentials: true }
      );
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, closed_time: new Date().toISOString() }
            : booking
        )
      );
    } catch (error) {
      console.error(
        `Error closing booking popup for booking ${bookingId}:`,
        error
      );
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  };

  const addRatedTeacher = async (teacherId) => {
    try {
      await axios.post(
        `${API_URL}rated-teachers/`,
        { teacher: teacherId },
        { withCredentials: true }
      );
      setRatedTeachers((prev) => new Set(prev).add(teacherId));
    } catch (error) {
      console.error(
        `Error adding teacher ${teacherId} to ratedTeachers:`,
        error
      );
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  };

  const fetchAuthenticatedData = () => {
    const fetchData = async () => {
      try {
        const bookingsResponse = await axios.get(`${API_URL}bookings/`, {
          withCredentials: true,
        });

        const ratingsResponse = await axios.get(`${API_URL}ratings/`, {
          withCredentials: true,
        });

        const fetchedBookings = bookingsResponse.data;
        setBookings(fetchedBookings);
        setRatings(ratingsResponse.data);

        return fetchedBookings;
      } catch (error) {
        console.error("Error fetching authenticated data:", error);
        return [];
      }
    };

    const checkBookings = (fetchedBookings) => {
      if (showRatingPopup) {
        return;
      }

      const now = new Date();
      const nowEet = toZonedTime(now, TIMEZONE);
      fetchedBookings.forEach((booking) => {
        if (
          !booking.rated &&
          !booking.closed_time &&
          !ratedTeachers.has(booking.teacher.id) &&
          !shownPopups.has(booking.id)
        ) {
          const dateTimeStr = `${booking.date} ${booking.time}`;
          const sessionTimeEet = parse(
            dateTimeStr,
            "yyyy-MM-dd h:mm a",
            new Date()
          );
          const sessionTimeUtc = fromZonedTime(sessionTimeEet, TIMEZONE);
          const sessionTimeEetConfirmed = toZonedTime(sessionTimeUtc, TIMEZONE);
          const popupTimeEet = addHours(sessionTimeEetConfirmed, 2);
          const popupTimeMs = popupTimeEet.getTime();

          if (nowEet.getTime() >= popupTimeMs) {
            setPendingRating({
              teacherId: booking.teacher.id,
              sessionTime: sessionTimeEetConfirmed.getTime(),
              bookingId: booking.id,
              teacherName: booking.teacher.name,
            });
            setShowRatingPopup(true);
            setShownPopups((prev) => new Set(prev).add(booking.id));
          }
        }
      });
    };

    let intervalId = null;

    fetchData().then((fetchedBookings) => {
      checkBookings(fetchedBookings);

      intervalId = setInterval(() => {
        checkBookings(fetchedBookings);
      }, 60000);
    });

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  };

  useEffect(() => {
    let cleanup = null;
    if (isAuthenticated) {
      cleanup = fetchAuthenticatedData();
    }
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isAuthenticated, ratedTeachers]);

  const scheduleRatingPopup = (
    teacherId,
    sessionTime,
    bookingId,
    teacherName
  ) => {
    if (ratedTeachers.has(teacherId) || shownPopups.has(bookingId)) {
      return;
    }

    setShownPopups((prev) => new Set(prev).add(bookingId));

    const sessionTimeEet = toZonedTime(new Date(sessionTime), TIMEZONE);
    const popupTimeEet = addHours(sessionTimeEet, 2);
    const now = new Date();
    const nowEet = toZonedTime(now, TIMEZONE);
    const delay = popupTimeEet.getTime() - nowEet.getTime();

    if (delay <= 0) {
      setPendingRating({
        teacherId,
        sessionTime: sessionTimeEet.getTime(),
        bookingId,
        teacherName,
      });
      setShowRatingPopup(true);
    } else {
      setTimeout(() => {
        setPendingRating({
          teacherId,
          sessionTime: sessionTimeEet.getTime(),
          bookingId,
          teacherName,
        });
        setShowRatingPopup(true);
      }, delay);
    }
  };

  const handleRatingSubmit = async (teacherId, rating) => {
    try {
      setRatedTeachers((prev) => new Set(prev).add(teacherId));
      await updateTeacherRating(teacherId, rating);
      setShowRatingPopup(false);
      setPendingRating(null);
      if (pendingRating?.bookingId) {
        await markBookingRated(pendingRating.bookingId);
        await addRatedTeacher(teacherId);
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === pendingRating.bookingId
              ? { ...booking, rated: true }
              : booking
          )
        );
        const bookingsResponse = await axios.get(`${API_URL}bookings/`, {
          withCredentials: true,
        });
        setBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const handleClosePopup = async () => {
    setShowRatingPopup(false);
    const bookingId = pendingRating?.bookingId;
    const teacherId = pendingRating?.teacherId;
    setPendingRating(null);
    if (bookingId) {
      setRatedTeachers((prev) => new Set(prev).add(teacherId));
      await closeBookingPopup(bookingId);
      await addRatedTeacher(teacherId);
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, closed_time: new Date().toISOString() }
            : booking
        )
      );
      const bookingsResponse = await axios.get(`${API_URL}bookings/`, {
        withCredentials: true,
      });
      setBookings(bookingsResponse.data);
    }
  };

  return (
    <div className="app">
      {showRatingPopup && pendingRating && (
        <RatingPopup
          teacherId={pendingRating.teacherId}
          teacherName={pendingRating.teacherName}
          onSubmitRating={handleRatingSubmit}
          onClose={handleClosePopup}
        />
      )}
      <Routes>
        <Route
          path="/"
          element={<Home teachers={teachers} isLoading={isLoading} />}
        />
        <Route
          path="/teachers"
          element={
            <TeachersList
              teachers={teachers}
              user={user}
              setTeachers={setTeachers}
              apiUrl={API_URL}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/teacher/:id"
          element={
            <TeacherDetails
              teachers={teachers}
              ratings={ratings}
              apiUrl={API_URL}
              isLoading={isLoading}
            />
          }
        />
        <Route
          path="/booking/:id"
          element={
            <Booking
              teachers={teachers}
              bookings={bookings}
              setBookings={setBookings}
              updateTeacherRating={updateTeacherRating}
              scheduleRatingPopup={scheduleRatingPopup}
            />
          }
        />
        <Route
          path="/bookings"
          element={<BookingsList bookings={bookings} />}
        />
        <Route
          path="/admin/*"
          element={
            <AdminDashboard
              teachers={teachers}
              user={user}
              setTeachers={setTeachers}
              apiUrl={API_URL}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </div>
  );
};

export default App;
