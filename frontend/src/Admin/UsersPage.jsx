import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const UsersPage = ({ apiUrl }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${apiUrl}users/all/`, {
          withCredentials: true,
        });
        setUsers(response.data);
      } catch (error) {
        setError(t("userpage.error_fetch"));
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [apiUrl, t]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      (user.is_superuser ? "admin" : "user") === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (userId) => {
    if (window.confirm(t("userpage.confirm_delete"))) {
      try {
        await axios.delete(`${apiUrl}users/${userId}/`, {
          withCredentials: true,
        });
        setUsers(users.filter((user) => user.id !== userId));
        setError(null);
      } catch (error) {
        setError(t("userpage.error_delete"));
        console.error(
          "Error deleting user:",
          error.response?.data || error.message
        );
      }
    }
  };

  if (error) return <div className="p-20 c-red">{error}</div>;

  return (
    <div>
      <h1 className="p-relative">{t("userpage.title")}</h1>
      <div className="wrapper d-grid gap-20">
        <div className="search-filter p-20 rad-10">
          <div className="d-flex gap-20">
            <input
              className="p-10 w-full rad-6"
              type="text"
              placeholder={t("userpage.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="p-10 rad-6"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">{t("userpage.filter_all")}</option>
              <option value="user">{t("userpage.filter_user")}</option>
              <option value="admin">{t("userpage.filter_admin")}</option>
            </select>
          </div>
        </div>

        <div className="users-list p-20 rad-10">
          <h2 className="mt-0 mb-10 text-light">{t("userpage.users_list")}</h2>
          <div className="table-responsive">
            <table className="w-full">
              <thead>
                <tr>
                  <th>{t("userpage.table_name")}</th>
                  <th>{t("userpage.table_email")}</th>
                  <th>{t("userpage.table_role")}</th>
                  <th>{t("userpage.table_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.first_name || t("userpage.default_name")}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.is_superuser
                        ? t("userpage.role_admin")
                        : t("userpage.role_user")}
                    </td>
                    <td>
                      <button
                        className="btn-shape bg-red c-white fs-13"
                        onClick={() => handleDelete(user.id)}
                      >
                        {t("userpage.delete_button")}
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

export default UsersPage;
