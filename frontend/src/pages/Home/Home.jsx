import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Home.css";
import Header from "../../components/Header";
import home from "../../assets/Auction-amico.svg";
import verifiedIcon from "../../assets/Lesson-rafiki.svg";
import coverageIcon from "../../assets/Professor-pana.svg";
import personalizeIcon from "../../assets/Online learning-rafiki.svg";
import Footer from "../../components/Footer";
import { AuthContext } from "../../context/AuthContext";
import defaultImage from "../../assets/alt.png";

const Home = () => {
  const [featuredTeachers, setFeaturedTeachers] = useState([]);
  const [error, setError] = useState(null);
  const apiUrl = "/api/";
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      mirror: false,
    });
  }, []);

  useEffect(() => {
    const fetchFeaturedTeachers = async () => {
      try {
        const response = await axios.get(`${apiUrl}teachers/`, {
          withCredentials: true,
        });
        const topRatedTeachers = response.data
          .filter((teacher) => teacher.is_top_rated)
          .slice(0, 3);
        const nonTopRatedTeachers = response.data
          .filter((teacher) => !teacher.is_top_rated)
          .slice(0, 3 - topRatedTeachers.length);
        const selectedTeachers = [...topRatedTeachers, ...nonTopRatedTeachers];
        setFeaturedTeachers(selectedTeachers);
      } catch (error) {
        setError(t("hero.failedToLoadTeachers"));
      }
    };
    fetchFeaturedTeachers();
  }, [t]);

  const handleCardClick = (teacherId) => {
    navigate(`/teacher/${teacherId}`);
  };

  const renderTeacherCard = (teacher) => (
    <div
      className="teachers-card"
      onClick={() => handleCardClick(teacher.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="teacher-image-wrapper">
        <img
          src={teacher.image ? `${apiUrl}${teacher.image}` : defaultImage}
          alt={teacher.name}
          className="teachers-card-image"
        />
        {teacher.is_top_rated && (
          <span className="top-rated-badge">{t("hero.teachers.topRated")}</span>
        )}
      </div>
      <div className="teachers-card-body">
        <h5 className="teachers-card-title">{teacher.name}</h5>
        <p className="teachers-card-subtitle mt-3">
          {teacher.subject}, {teacher.governorate}
        </p>
        <div className="teachers-card-info">
          <p>
            {t("hero.teachers.rating")}: {(teacher.rating || 0).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );

  const joinNowLink = isAuthenticated ? "/teachers" : "/register";

  return (
    <div className="home-page">
      <div className="background-image"></div>
      <div className="overlay"></div>

      <div className="row g-0">
        <Header />

        <div className="col">
          <section className="hero-section" data-aos="fade-up">
            <div className="container">
              <div className="row align-items-center flex-row-reverse">
                <div className="col-lg-6 mb-4 mb-lg-0 order-lg-2">
                  <h1
                    className="display-3 fw-bold mb-4"
                    data-aos="fade-up"
                    data-aos-delay="100"
                  >
                    {t("hero.title")}
                  </h1>
                  <p
                    className="lead mb-4"
                    data-aos="fade-up"
                    data-aos-delay="200"
                  >
                    {t("hero.description")}
                  </p>
                  <div
                    className="d-flex gap-3"
                    data-aos="fade-up"
                    data-aos-delay="300"
                  >
                    <a href="/teachers">
                      <button className="find">{t("hero.findTutor")}</button>
                    </a>
                    <a className="d-flex" href={joinNowLink}>
                      <button className="join-btn">
                        <span className="join-hover-underline">
                          {t("hero.joinNow")}
                        </span>
                        <svg
                          id="arrow-horizontal"
                          xmlns="http://www.w3.org/2000/svg"
                          width="30"
                          height="10"
                          viewBox="0 0 46 16"
                          fill="#ffffff"
                          style={{
                            transform:
                              i18n.language === "ar"
                                ? "scaleX(-1)"
                                : "scaleX(1)",
                          }}
                        >
                          <path
                            id="Path_10"
                            data-name="Path 10"
                            d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z"
                            transform="translate(30)"
                          ></path>
                        </svg>
                      </button>
                    </a>
                  </div>
                </div>

                <div className="col-lg-6 order-lg-1">
                  <div className="image-container">
                    <img
                      src={home}
                      alt={t("hero.imageAlt")}
                      className="img-fluid rounded hero-image"
                      data-aos="zoom-in"
                      data-aos-delay="400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="featured-teachers-section py-5"
            data-aos="fade-up"
          >
            <div className="container">
              <h2
                className="text-center mb-4"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {t("hero.teachers.title")}
              </h2>
              {error ? (
                <p className="text-center text-danger">{error}</p>
              ) : featuredTeachers.length > 0 ? (
                <div className="row featured-teachers-row">
                  {featuredTeachers.map((teacher, index) => (
                    <div
                      key={teacher.id}
                      className="col-md-4 mb-4 teacher-card-wrapper"
                      data-aos="fade-up"
                      data-aos-delay={200 + index * 100}
                    >
                      {renderTeacherCard(teacher)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center">{t("hero.teachers.noTeachers")}</p>
              )}
              <div className="text-center mt-4">
                <a href="/teachers">
                  <button
                    className="find some"
                    data-aos="fade-up"
                    data-aos-delay="500"
                  >
                    {t("hero.teachers.viewAll")}
                  </button>
                </a>
              </div>
            </div>
          </section>

          <section className="why-choose-us-section py-5" data-aos="fade-up">
            <div className="container">
              <h2
                className="text-center mb-5"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {t("hero.whyChoose.title")}
              </h2>
              <div className="row">
                {[
                  { icon: verifiedIcon, key: "verified" },
                  { icon: coverageIcon, key: "coverage" },
                  { icon: personalizeIcon, key: "personalized" },
                ].map((item, index) => (
                  <div
                    key={item.key}
                    className="col-md-4 mb-4 why"
                    data-aos="fade-up"
                    data-aos-delay={200 + index * 100}
                  >
                    <div className="benefit-card text-center">
                      <img
                        src={item.icon}
                        alt={t(`hero.whyChoose.${item.key}.alt`)}
                        className="benefit-icon mb-3"
                      />
                      <h3 className="benefit-title">
                        {t(`hero.whyChoose.${item.key}.title`)}
                      </h3>
                      <p className="benefit-text">
                        {t(`hero.whyChoose.${item.key}.text`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Home;
