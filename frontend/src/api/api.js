import axios from "axios";

const API_BASE_URL = "/api/";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.detail === "Invalid token."
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("refresh_token="))
          ?.split("=")[1];
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        const response = await axios.post(
          "/api/refresh/",
          {},
          { headers: { Cookie: `refresh_token=${refreshToken}` } }
        );
        const newAccessToken = response.data.access;
        document.cookie = `access_token=${newAccessToken}; path=/; max-age=3600; SameSite=Lax`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const fetchTeachers = async () => {
  try {
    const response = await apiClient.get("teachers/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
