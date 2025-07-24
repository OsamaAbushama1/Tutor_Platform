import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/api/forgot-password/", { email });
      setMessage(t("forgotPassword.success"));
      setIsError(false);
      setShowModal(true);
    } catch (error) {
      setMessage(t("forgotPassword.error"));
      setIsError(true);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate("/login");
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>{t("forgotPassword.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("forgotPassword.form.emailLabel")}</label>
            <input
              className="in"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder={t("forgotPassword.form.emailPlaceholder")}
            />
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            aria-label={
              loading
                ? t("forgotPassword.form.sending")
                : t("forgotPassword.form.submit")
            }
          >
            {loading
              ? t("forgotPassword.form.sending")
              : t("forgotPassword.form.submit")}
          </button>
        </form>
      </div>

      {showModal && (
        <div className="forget modal-overlay">
          <div
            className={`forget modal-content ${
              i18n.language === "ar" ? "rtl" : "ltr"
            }`}
          >
            <p className={`message ${isError ? "error" : "success"}`}>
              {message}
            </p>
            <button
              className="modal-close-btn"
              onClick={handleCloseModal}
              aria-label={t("forgotPassword.modal.close")}
            >
              {t("forgotPassword.modal.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
