import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import defaultProfilePicture from "../../assets/alt.png";
import "./Settings.css";

const Settings = ({ apiUrl = "/api/" }) => {
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    password: "",
    confirm_password: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultProfilePicture);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const cropperRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        bio: user.bio || "",
        password: "",
        confirm_password: "",
      });
      setPreviewUrl(user.profile_picture || defaultProfilePicture);
    }
  }, [user]);

  const validatePasswordStrength = (password) => {
    const strength = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    setPasswordStrength(strength);
    return Object.values(strength).every((criterion) => criterion);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setShowPasswordCriteria(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setMessage(t("settings.invalidImageType"));
        setMessageType("error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage(t("settings.imageSizeError"));
        setMessageType("error");
        return;
      }
      setImageToCrop(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  const handleCrop = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper;
      cropper.getCroppedCanvas().toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], `profile_picture.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            setProfilePicture(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedFile));
            setShowCropper(false);
          }
        },
        "image/jpeg",
        0.8
      );
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    setProfilePicture(null);
    setPreviewUrl(user?.profile_picture || defaultProfilePicture);
  };

  const handleSubmit = async (e, tab) => {
    e.preventDefault();

    if (tab === "profile") {
      if (!formData.first_name.trim()) {
        setMessage(t("settings.firstNameRequired"));
        setMessageType("error");
        return;
      }
      if (!formData.last_name.trim()) {
        setMessage(t("settings.lastNameRequired"));
        setMessageType("error");
        return;
      }
    }

    if (tab === "security") {
      if (!formData.password) {
        setMessage(t("settings.noPasswordEntered"));
        setMessageType("error");
        return;
      }
      const isPasswordValid = validatePasswordStrength(formData.password);
      if (!isPasswordValid) {
        setShowPasswordCriteria(true);
        setMessage(t("settings.passwordRequirementsNotMet"));
        setMessageType("error");
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setMessage(t("settings.passwordMismatch"));
        setMessageType("error");
        return;
      }
    }

    setIsLoading(true);
    const data = new FormData();
    if (tab === "profile") {
      data.append("first_name", formData.first_name.trim());
      data.append("last_name", formData.last_name.trim());
      data.append("bio", formData.bio.trim());
      if (profilePicture) {
        data.append("profile_picture", profilePicture);
      }
    } else if (tab === "security") {
      data.append("password", formData.password);
    }

    try {
      const response = await axios.put(
        `${apiUrl}${tab === "profile" ? "profile" : "settings"}/`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(t("settings.updatedSuccess"));
      setMessageType("success");
      if (tab === "profile") {
        setIsEditingProfile(false);
        setProfilePicture(null);
        setPreviewUrl(response.data.profile_picture || defaultProfilePicture);
      }
      setFormData({
        ...formData,
        password: "",
        confirm_password: "",
      });
      setShowPasswordCriteria(false);
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
    } catch (error) {
      console.error("Update error:", error.response?.data);
      const errorMsg =
        error.response?.data?.errors?.first_name?.[0] ||
        error.response?.data?.errors?.last_name?.[0] ||
        error.response?.data?.errors?.bio?.[0] ||
        error.response?.data?.errors?.profile_picture?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        t("settings.unknownError");
      setMessage(errorMsg);
      setMessageType("error");
      if (tab === "security") {
        setShowPasswordCriteria(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${apiUrl}settings/`, {
        withCredentials: true,
      });
      setMessage(t("settings.accountDeleted"));
      setMessageType("success");
      setShowDeleteModal(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || t("settings.deleteError");
      setMessage(errorMsg);
      setMessageType("error");
      setShowDeleteModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditProfile = () => {
    setIsEditingProfile(!isEditingProfile);
    setMessage("");
    if (isEditingProfile) {
      setProfilePicture(null);
      setPreviewUrl(user?.profile_picture || defaultProfilePicture);
      setFormData({
        ...formData,
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        bio: user?.bio || "",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-page" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-lg settings-card">
              <div className="card-body">
                <h2 className="card-title mb-4">{t("settings.title")}</h2>
                {message && (
                  <div
                    className={`alert alert-${
                      messageType === "success" ? "success" : "danger"
                    } alert-dismissible fade show`}
                    role="alert"
                  >
                    {message}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setMessage("")}
                    ></button>
                  </div>
                )}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "profile" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("profile")}
                    >
                      {t("settings.tabs.profile")}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${
                        activeTab === "security" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("security")}
                    >
                      {t("settings.tabs.security")}
                    </button>
                  </li>
                </ul>

                {activeTab === "profile" && (
                  <div>
                    <h4 className="section-title">
                      {t("settings.profileInfo")}
                    </h4>
                    <div className="row settings">
                      <div className="col-md-4 text-center">
                        <div className="mb-3">
                          <img
                            src={previewUrl}
                            alt="Profile"
                            className="profile-picture rounded-circle mb-3"
                            onError={(e) => {
                              if (e.target.src !== defaultProfilePicture) {
                                e.target.src = defaultProfilePicture;
                              }
                            }}
                          />
                          {isEditingProfile && (
                            <div className="mb-3">
                              <label
                                htmlFor="profile_picture"
                                className="form-label upload-label"
                              >
                                {t("settings.uploadPicture")}
                              </label>
                              <input
                                type="file"
                                className="form-control upload-input"
                                id="profile_picture"
                                name="profile_picture"
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </div>
                          )}
                        </div>
                        <div className="mb-3">
                          <label htmlFor="first_name" className="form-label">
                            {t("settings.firstName")}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="first_name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            disabled={!isEditingProfile}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="last_name" className="form-label">
                            {t("settings.lastName")}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="last_name"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            disabled={!isEditingProfile}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-8">
                        <form
                          onSubmit={(e) =>
                            isEditingProfile
                              ? handleSubmit(e, "profile")
                              : e.preventDefault()
                          }
                        >
                          <div className="mb-3">
                            <label htmlFor="bio" className="form-label">
                              {t("settings.bio")}
                            </label>
                            <textarea
                              className="form-control"
                              id="bio"
                              name="bio"
                              value={formData.bio}
                              onChange={handleChange}
                              disabled={!isEditingProfile}
                              rows="4"
                            />
                          </div>
                          <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                              {t("settings.email")}
                            </label>
                            <input
                              type="email"
                              className="form-control"
                              id="email"
                              name="email"
                              value={user?.email || "N/A"}
                              disabled
                            />
                          </div>
                          <div className="mb-3">
                            <label
                              htmlFor="phone_number"
                              className="form-label"
                            >
                              {t("settings.phoneNumber")}
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="phone_number"
                              name="phone_number"
                              value={user?.phone_number || "N/A"}
                              disabled
                            />
                          </div>
                          <div className="mb-3">
                            <label htmlFor="date_joined" className="form-label">
                              {t("settings.memberSince")}
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              id="date_joined"
                              name="date_joined"
                              value={
                                user?.date_joined
                                  ? formatDate(user.date_joined)
                                  : "N/A"
                              }
                              disabled
                            />
                          </div>
                          {isEditingProfile && (
                            <div className="d-grid mt-4">
                              <button
                                type="submit"
                                className="btn btn-success"
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-2"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    {t("settings.saving")}
                                  </>
                                ) : (
                                  t("settings.saveChanges")
                                )}
                              </button>
                            </div>
                          )}
                        </form>
                        <button
                          className={`btn ${
                            isEditingProfile
                              ? "btn-outline-secondary"
                              : "btn-primary"
                          } mt-3`}
                          onClick={toggleEditProfile}
                          disabled={isLoading}
                        >
                          {isEditingProfile
                            ? t("settings.cancel")
                            : t("settings.editProfile")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h4 className="section-title">
                      {t("settings.changePassword")}
                    </h4>
                    <form onSubmit={(e) => handleSubmit(e, "security")}>
                      <div className="row settings">
                        <div className="col-md-6 mb-3 position-relative">
                          <label htmlFor="password" className="form-label">
                            {t("settings.newPassword")}
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={t("settings.passwordPlaceholder")}
                            disabled={isLoading}
                          />
                          <span
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? "👁️‍🗨️" : "👁️"}
                          </span>
                        </div>
                        <div className="col-md-6 mb-3 position-relative">
                          <label
                            htmlFor="confirm_password"
                            className="form-label"
                          >
                            {t("settings.confirmPassword")}
                          </label>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-control"
                            id="confirm_password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            placeholder={t(
                              "settings.confirmPasswordPlaceholder"
                            )}
                            disabled={isLoading}
                          />
                          <span
                            className="password-toggle"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                          </span>
                        </div>
                      </div>
                      {showPasswordCriteria && (
                        <div className="password-strength mb-3">
                          <ul className="password-criteria">
                            <li
                              className={
                                passwordStrength.length
                                  ? "criterion-met"
                                  : "criterion-unmet"
                              }
                            >
                              {passwordStrength.length ? "✔" : "✘"}{" "}
                              {t("settings.passwordCriteria.length")}
                            </li>
                            <li
                              className={
                                passwordStrength.uppercase
                                  ? "criterion-met"
                                  : "criterion-unmet"
                              }
                            >
                              {passwordStrength.uppercase ? "✔" : "✘"}{" "}
                              {t("settings.passwordCriteria.uppercase")}
                            </li>
                            <li
                              className={
                                passwordStrength.lowercase
                                  ? "criterion-met"
                                  : "criterion-unmet"
                              }
                            >
                              {passwordStrength.lowercase ? "✔" : "✘"}{" "}
                              {t("settings.passwordCriteria.lowercase")}
                            </li>
                            <li
                              className={
                                passwordStrength.number
                                  ? "criterion-met"
                                  : "criterion-unmet"
                              }
                            >
                              {passwordStrength.number ? "✔" : "✘"}{" "}
                              {t("settings.passwordCriteria.number")}
                            </li>
                            <li
                              className={
                                passwordStrength.special
                                  ? "criterion-met"
                                  : "criterion-unmet"
                              }
                            >
                              {passwordStrength.special ? "✔" : "✘"}{" "}
                              {t("settings.passwordCriteria.special")}
                            </li>
                          </ul>
                        </div>
                      )}
                      <div className="mt-3">
                        <button
                          type="submit"
                          className="btn btn-success"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              {t("settings.saving")}
                            </>
                          ) : (
                            t("settings.save")
                          )}
                        </button>
                      </div>
                    </form>
                    <h4 className="section-title mt-5">
                      {t("settings.dangerZone")}
                    </h4>
                    <div className="danger-zone">
                      <p className="text-danger">
                        {t("settings.deleteWarning")}
                      </p>
                      <button
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={isLoading}
                      >
                        {t("settings.deleteAccount")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t("settings.deleteConfirmTitle")}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                ></button>
              </div>
              <div className="modal-body">
                <p>{t("settings.deleteConfirmMessage")}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isLoading}
                >
                  {t("settings.cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {t("settings.deleting")}
                    </>
                  ) : (
                    t("settings.deleteAccount")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCropper && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t("settings.cropImage")}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCropCancel}
                  disabled={isLoading}
                ></button>
              </div>
              <div className="modal-body">
                <Cropper
                  src={imageToCrop}
                  style={{ height: 400, width: "100%" }}
                  initialAspectRatio={1}
                  aspectRatio={1}
                  guides={true}
                  viewMode={1}
                  autoCropArea={1}
                  background={false}
                  responsive={true}
                  ref={cropperRef}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCropCancel}
                  disabled={isLoading}
                >
                  {t("settings.cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCrop}
                  disabled={isLoading}
                >
                  {t("settings.cropAndSave")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
