import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Header from "../../components/Header";
import { useTranslation } from "react-i18next";
import "./Login.css";

const Login = () => {
  const { t } = useTranslation();
  const { isAuthenticated, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail || t("login.errors.invalidCredentials")
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="login-page">
      <Header />
      <main className="login-container">
        <div className="login-info-container">
          <h2 className="info-title">{t("login.info.title")}</h2>
          <p className="info-text">{t("login.info.description")}</p>
        </div>
        <div className="login-form-container">
          <h1 className="login-title">{t("login.form.title")}</h1>
          {errorMessage && (
            <div className="alert alert-danger">{errorMessage}</div>
          )}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder={t("login.form.email")}
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group password-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                placeholder={t("login.form.password")}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <i
                className={`fas ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } password-icon`}
                onClick={togglePasswordVisibility}
                style={{ cursor: "pointer" }}
                aria-label={t("login.form.togglePasswordVisibility")}
              ></i>
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? t("login.form.loggingIn") : t("login.form.login")}
            </button>
            <Link className="forget" to="/forgot-password">
              {t("login.form.forgotPassword")}
            </Link>
            <p className="dont-have-account">
              {t("login.form.dontHaveAccount")}{" "}
              <Link to="/register" className="register-link">
                {t("login.form.register")}
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
