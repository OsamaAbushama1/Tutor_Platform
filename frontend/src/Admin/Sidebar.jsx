import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => (
  <div className="sidebar bg-white p-20 p-relative">
    <h3 className="p-relative txt-c mt-0">Elzero</h3>
    <ul>
      <li>
        <Link className="d-flex align-center fs-14 c-black rad-6 p-10" to="/">
          <i className="fa-regular fa-chart-bar fa-fw"></i>
          <span>Dashboard</span>
        </Link>
      </li>
      <li>
        <Link
          className="d-flex align-center fs-14 c-black rad-6 p-10"
          to="/settings"
        >
          <i className="fa-solid fa-gear fa-fw"></i>
          <span>Settings</span>
        </Link>
      </li>
      <li>
        <Link
          className="active d-flex align-center fs-14 c-black rad-6 p-10"
          to="/profile"
        >
          <i className="fa-regular fa-user fa-fw"></i>
          <span>Profile</span>
        </Link>
      </li>
      <li>
        <Link
          className="d-flex align-center fs-14 c-black rad-6 p-10"
          to="/courses"
        >
          <i className="fa-solid fa-graduation-cap fa-fw"></i>
          <span>Courses</span>
        </Link>
      </li>
    </ul>
  </div>
);

export default Sidebar;
