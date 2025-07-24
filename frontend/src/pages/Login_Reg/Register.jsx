import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Header from "../../components/Header";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import "./Register.css";
import Swal from "sweetalert2";

const Register = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    phone_number: "",
    first_name: "",
    last_name: "",
    password: "",
    generic: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      checkPasswordStrength(value);
    }

    if (name === "confirm_password") {
      setPasswordMatch(value === formData.password);
    }

    if (name === "phone_number") {
      if (!/^\d*$/.test(value)) {
        setPhoneError(t("register.errors.onlyDigits"));
      } else if (value.length >= 3) {
        const phonePrefix = value.substring(0, 3);
        if (!["010", "011", "012", "015"].includes(phonePrefix)) {
          setPhoneError(t("register.errors.invalidPhonePrefix"));
        } else if (value.length > 11) {
          setPhoneError(t("register.errors.phoneTooLong"));
        } else if (value.length < 11 && value.length > 0) {
          setPhoneError(t("register.errors.phoneTooShort"));
        } else {
          setPhoneError("");
        }
      } else {
        setPhoneError("");
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          email: t("register.errors.invalidEmail"),
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, email: "" }));
      }
    }

    if (name === "first_name" || name === "last_name") {
      if (!value.trim()) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: t(`register.errors.${name}Required`),
        }));
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
      }
    }
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({
      email: "",
      phone_number: "",
      first_name: "",
      last_name: "",
      password: "",
      generic: "",
    });

    if (!formData.first_name.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        first_name: t("register.errors.first_nameRequired"),
      }));
      setIsLoading(false);
      return;
    }
    if (!formData.last_name.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        last_name: t("register.errors.last_nameRequired"),
      }));
      setIsLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: t("register.errors.invalidEmail"),
      }));
      setIsLoading(false);
      return;
    }
    if (
      formData.phone_number.length !== 11 ||
      !/^\d*$/.test(formData.phone_number)
    ) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        phone_number: t("register.errors.phoneInvalid"),
      }));
      setIsLoading(false);
      return;
    }

    try {
      const { confirm_password, ...requestData } = formData;
      await axios.post("/api/register/", requestData);

      Swal.fire({
        title: t("register.success.title"),
        text: t("register.success.message"),
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      const serverErrors = error.response?.data?.errors || {};
      setErrors((prevErrors) => ({
        ...prevErrors,
        email: serverErrors.email
          ? t("register.errors.emailInUse")
          : prevErrors.email,
        phone_number: serverErrors.phone_number
          ? t("register.errors.phoneInUse")
          : prevErrors.phone_number,
        first_name: serverErrors.first_name || prevErrors.first_name,
        last_name: serverErrors.last_name || prevErrors.last_name,
        password: serverErrors.password || prevErrors.password,
        generic: t("register.errors.generic"),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="register-page">
      <Header />
      <main className="register-container">
        <div className="register-info-container">
          <h2 className="info-title">{t("register.info.title")}</h2>
          <p className="info-text">{t("register.info.description")}</p>
        </div>
        <div className="register-form-container">
          <h1 className="register-title">{t("register.form.title")}</h1>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group name-group">
              <div className="name-field">
                <input
                  type="text"
                  name="first_name"
                  className="form-control"
                  placeholder={t("register.form.firstName")}
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                {errors.first_name && (
                  <small className="error-text">{errors.first_name}</small>
                )}
              </div>
              <div className="name-field">
                <input
                  type="text"
                  name="last_name"
                  className="form-control"
                  placeholder={t("register.form.lastName")}
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
                {errors.last_name && (
                  <small className="error-text">{errors.last_name}</small>
                )}
              </div>
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder={t("register.form.email")}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <small className="error-text">{errors.email}</small>
              )}
            </div>
            <div className="form-group">
              <input
                type="tel"
                name="phone_number"
                className="form-control"
                placeholder={t("register.form.phoneNumber")}
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
              {errors.phone_number && (
                <small className="error-text">{errors.phone_number}</small>
              )}
              {phoneError && <small className="error-text">{phoneError}</small>}
            </div>
            <div className="form-group position-relative">
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  placeholder={t("register.form.password")}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.password && (
                <small className="error-text">{errors.password}</small>
              )}
              <div className="password-strength">
                <span className={passwordStrength.length ? "valid" : "invalid"}>
                  {passwordStrength.length ? "✓" : "✗"}{" "}
                  {t("register.passwordStrength.length")}
                </span>
                <span
                  className={passwordStrength.lowercase ? "valid" : "invalid"}
                >
                  {passwordStrength.lowercase ? "✓" : "✗"}{" "}
                  {t("register.passwordStrength.lowercase")}
                </span>
                <span
                  className={passwordStrength.uppercase ? "valid" : "invalid"}
                >
                  {passwordStrength.uppercase ? "✓" : "✗"}{" "}
                  {t("register.passwordStrength.uppercase")}
                </span>
                <span className={passwordStrength.number ? "valid" : "invalid"}>
                  {passwordStrength.number ? "✓" : "✗"}{" "}
                  {t("register.passwordStrength.number")}
                </span>
                <span
                  className={passwordStrength.specialChar ? "valid" : "invalid"}
                >
                  {passwordStrength.specialChar ? "✓" : "✗"}{" "}
                  {t("register.passwordStrength.specialChar")}
                </span>
              </div>
            </div>
            <div className="form-group position-relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                className="form-control"
                placeholder={t("register.form.confirmPassword")}
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
              <span
                onClick={toggleConfirmPasswordVisibility}
                className="password-toggle"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {!passwordMatch && (
                <small className="error-text">
                  {t("register.errors.passwordMismatch")}
                </small>
              )}
              {passwordMatch && formData.confirm_password && (
                <small className="success-text">
                  {t("register.success.passwordMatch")}
                </small>
              )}
            </div>
            {errors.generic && (
              <small className="error-text">{errors.generic}</small>
            )}
            <button
              type="submit"
              className="register-button"
              disabled={
                isLoading ||
                !passwordStrength.length ||
                !passwordStrength.lowercase ||
                !passwordStrength.uppercase ||
                !passwordStrength.number ||
                !passwordStrength.specialChar ||
                !passwordMatch ||
                phoneError ||
                formData.phone_number.length !== 11 ||
                !formData.first_name.trim() ||
                !formData.last_name.trim() ||
                !formData.email
              }
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>{" "}
                  {t("register.form.creatingAccount")}
                </>
              ) : (
                t("register.form.createAccount")
              )}
            </button>

            <p className="already-have-account">
              {t("register.form.alreadyHaveAccount")}{" "}
              <Link to="/login" className="login-link">
                {t("register.form.login")}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Register;
