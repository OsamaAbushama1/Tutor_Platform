import React from "react";
import { useTranslation } from "react-i18next";
import "./RatingPopup.css";

const RatingPopup = ({ teacherId, teacherName, onSubmitRating, onClose }) => {
  const { t } = useTranslation();
  const [rating, setRating] = React.useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmitRating(teacherId, rating);
    }
  };

  return (
    <div className="rp-overlay">
      <div className="rp-container">
        <h3>
          {t("ratingPopup.rate")} {teacherName}
        </h3>
        <p>{t("ratingPopup.message")}</p>
        <p>
          {t("ratingPopup.note")}: {t("ratingPopup.ratingNote")}
        </p>
        <div className="rp-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= rating ? "rp-star rp-filled" : "rp-star"}
              onClick={() => setRating(star)}
              role="button"
              aria-label={t("ratingPopup.starAriaLabel", { star })}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setRating(star);
                }
              }}
            >
              ★
            </span>
          ))}
        </div>
        <div className="rp-actions">
          <button
            onClick={handleSubmit}
            className="rp-btn rp-btn-primary"
            disabled={rating === 0}
            aria-label={t("ratingPopup.submitButtonAriaLabel")}
          >
            {t("ratingPopup.submitButton")}
          </button>
          <button
            onClick={onClose}
            className="rp-btn rp-btn-secondary"
            aria-label={t("ratingPopup.closeButtonAriaLabel")}
          >
            {t("ratingPopup.closeButton")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingPopup;
