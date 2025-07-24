import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const TeachersPage = ({ apiUrl }) => {
  const { t, i18n } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get(`${apiUrl}teachers/`, {
          withCredentials: true,
        });
        setTeachers(response.data);
      } catch (error) {
        setError(t("teacherAdmin.failed_to_fetch_teachers"));
        console.error("Error fetching teachers:", error);
      }
    };
    fetchTeachers();
  }, [apiUrl, t]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      (teacher.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (teacher.subject || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || (teacher.status || "active") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (teacherId) => {
    if (window.confirm(t("teacherAdmin.confirm_delete"))) {
      try {
        await axios.delete(`${apiUrl}teachers/${teacherId}/`, {
          withCredentials: true,
        });
        setTeachers(teachers.filter((teacher) => teacher.id !== teacherId));
        setError(null);
      } catch (error) {
        setError(t("teacherAdmin.failed_to_delete_teacher"));
        console.error("Error deleting teacher:", error);
      }
    }
  };

  const handleUpdate = async (teacherId, updatedData) => {
    try {
      const response = await axios.put(
        `${apiUrl}teachers/${teacherId}/`,
        updatedData,
        { withCredentials: true }
      );
      setTeachers(
        teachers.map((teacher) =>
          teacher.id === teacherId ? response.data : teacher
        )
      );
      setError(null);
    } catch (error) {
      setError(t("teacherAdmin.failed_to_update_teacher"));
      console.error("Error updating teacher:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (error) return <div className="p-20 c-red">{error}</div>;

  return (
    <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <h1 className="p-relative">{t("teacherAdmin.teachers_management")}</h1>
      <div className="wrapper d-grid gap-20">
        <div className="search-filter p-20 rad-10">
          <div className="d-flex gap-20">
            <input
              className="p-10 w-full rad-6"
              type="text"
              placeholder={t("teacherAdmin.search_placeholder")}
              value={search}
              onChange={handleSearchChange}
            />
            <select
              className="p-10 rad-6"
              value={filterStatus}
              onChange={handleFilterChange}
            >
              <option value="all">{t("teacherAdmin.all")}</option>
              <option value="active">{t("teacherAdmin.active")}</option>
              <option value="suspended">{t("teacherAdmin.suspended")}</option>
            </select>
            <select
              className="p-10 rad-6"
              onChange={(e) => changeLanguage(e.target.value)}
              defaultValue={i18n.language}
            >
              <option value="en">{t("teacherAdmin.english")}</option>
              <option value="ar">{t("teacherAdmin.arabic")}</option>
              <option value="fr">{t("teacherAdmin.french")}</option>
            </select>
          </div>
        </div>

        <div className="teachers-list p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">
            {t("teacherAdmin.teachers")}
          </h2>
          <div className="table-responsive text-light">
            <table className="w-full">
              <thead>
                <tr>
                  <th>{t("teacherAdmin.name")}</th>
                  <th>{t("teacherAdmin.subject")}</th>
                  <th>{t("teacherAdmin.rating")}</th>
                  <th>{t("teacherAdmin.status")}</th>
                  <th>{t("teacherAdmin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>{teacher.name}</td>
                    <td>{t(`subjects.${teacher.subject}`)}</td>
                    <td>{teacher.rating || "N/A"}</td>
                    <td>
                      <select
                        value={teacher.status || "active"}
                        onChange={(e) =>
                          handleUpdate(teacher.id, { status: e.target.value })
                        }
                        className="p-2 rad-6"
                      >
                        <option value="active">
                          {t("teacherAdmin.active")}
                        </option>
                        <option value="suspended">
                          {t("teacherAdmin.suspended")}
                        </option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-shape bg-red c-white fs-13"
                        onClick={() => handleDelete(teacher.id)}
                      >
                        {t("teacherAdmin.delete")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
