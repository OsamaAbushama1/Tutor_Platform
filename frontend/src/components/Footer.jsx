import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./Footer.css";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="footer-brand">
              <Link to="/" className="d-flex align-items-center mb-3 twice">
                <img
                  src={logo}
                  alt={t("footer.logoAlt")}
                  className="footer-logo"
                />
                <span className="footer-title">EduBridge</span>
              </Link>
              <p className="footer-description">{t("footer.description")}</p>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="footer-heading">{t("footer.links.title")}</h5>
            <ul className="footer-links list-unstyled">
              <li>
                <Link to="/" className="footer-link">
                  {t("footer.links.home")}
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="footer-link">
                  {t("footer.links.tutors")}
                </Link>
              </li>
              <li>
                <Link to="/profile" className="footer-link">
                  {t("footer.links.profile")}
                </Link>
              </li>
              <li>
                <Link to="/settings" className="footer-link">
                  {t("footer.links.settings")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-md-4 mb-4">
            <h5 className="footer-heading">{t("footer.contact.title")}</h5>
            <p className="footer-contact">
              {t("footer.contact.emailLabel")}:{" "}
              <a href="mailto:support@edubridge.com" className="footer-link">
                support@edubridge.com
              </a>
            </p>
            <p className="footer-contact">
              {t("footer.contact.phoneLabel")}:{" "}
              <a href="tel:+201234567890" className="footer-link">
                +20 123 456 7890
              </a>
            </p>
            <div className="footer-social-icons">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label={t("footer.social.facebook")}
              >
                <FaFacebook />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label={t("footer.social.twitter")}
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label={t("footer.social.instagram")}
              >
                <FaInstagram />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label={t("footer.social.linkedin")}
              >
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom text-center">
          <p>
            © {new Date().getFullYear()} EduBridge. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
