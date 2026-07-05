import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// Token storage keys — must match logout.ts
const TOKEN_KEYS = {
    ACCESS:  "access_token",
    REFRESH: "refresh_token",
    USER:    "user",
} as const;

function clearSession() {
    Object.values(TOKEN_KEYS).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

// ─── Shared axios instance ────────────────────────────────────────────────────

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — auto-attach Bearer token ───────────────────────────

axiosInstance.interceptors.request.use(
    config => {
        const token =
            localStorage.getItem(TOKEN_KEYS.ACCESS) ||
            sessionStorage.getItem(TOKEN_KEYS.ACCESS);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// ── Response interceptor — handle expired / invalid token ────────────────────

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const data   = error.response?.data;

            const isTokenExpired =
                status === 401 &&
                (
                    data?.code === "token_not_valid" ||
                    data?.detail === "Given token not valid for any token type" ||
                    data?.messages?.some?.(
                        (m: { message: string }) =>
                            m.message === "Token is expired"
                    )
                );

            if (isTokenExpired) {
                clearSession();
                // Hard redirect — works outside React component tree too
                window.location.href = "/";
                // Return a never-resolving promise to stop further .catch handlers
                return new Promise(() => {});
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;

export { TOKEN_KEYS, clearSession };