import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const checkPasswordStrength = (password) => {
    return {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowPasswordStrength(false);
    const strength = checkPasswordStrength(newPassword);
    setPasswordStrength(strength);

    const isPasswordStrong = Object.values(strength).every(
      (condition) => condition
    );

    if (newPassword !== confirmPassword) {
      setMessage(t("resetPassword.errors.passwordsDoNotMatch"));
      return;
    }

    if (!isPasswordStrong) {
      setMessage(t("resetPassword.errors.weakPassword"));
      setShowPasswordStrength(true);
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/reset-password/", {
        token,
        new_password: newPassword,
      });
      setMessage(t("resetPassword.success"));
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setMessage(t("resetPassword.errors.error"));
    } finally {
      setLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h2>{t("resetPassword.title")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t("resetPassword.form.newPasswordLabel")}</label>
            <div className="password-wrapper">
              <input
                className="in"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder={t("resetPassword.form.newPasswordPlaceholder")}
              />
              <span
                className="password-toggle"
                onClick={toggleNewPasswordVisibility}
                aria-label={
                  showNewPassword
                    ? t("resetPassword.form.hidePassword")
                    : t("resetPassword.form.showPassword")
                }
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {showPasswordStrength && (
              <div className="password-strength">
                {!passwordStrength.length && (
                  <span className="invalid">
                    ✗ {t("resetPassword.passwordStrength.length")}
                  </span>
                )}
                {!passwordStrength.lowercase && (
                  <span className="invalid">
                    ✗ {t("resetPassword.passwordStrength.lowercase")}
                  </span>
                )}
                {!passwordStrength.uppercase && (
                  <span className="invalid">
                    ✗ {t("resetPassword.passwordStrength.uppercase")}
                  </span>
                )}
                {!passwordStrength.number && (
                  <span className="invalid">
                    ✗ {t("resetPassword.passwordStrength.number")}
                  </span>
                )}
                {!passwordStrength.specialChar && (
                  <span className="invalid">
                    ✗ {t("resetPassword.passwordStrength.specialChar")}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>{t("resetPassword.form.confirmPasswordLabel")}</label>
            <div className="password-wrapper">
              <input
                className="in"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder={t("resetPassword.form.confirmPasswordPlaceholder")}
              />
              <span
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={
                  showConfirmPassword
                    ? t("resetPassword.form.hidePassword")
                    : t("resetPassword.form.showPassword")
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
            aria-label={
              loading
                ? t("resetPassword.form.resetting")
                : t("resetPassword.form.submit")
            }
          >
            {loading
              ? t("resetPassword.form.resetting")
              : t("resetPassword.form.submit")}
          </button>
        </form>
        {message && (
          <p
            className={`message ${
              message === t("resetPassword.success") ? "success" : "error"
            }`}
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
