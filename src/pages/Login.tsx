import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import axiosInstance, {TOKEN_KEYS} from "../middleware/axiosinterceptor.tsx";
import {Toast} from "../components/Toast.tsx";


/* ==========================================================================
   TYPES
   ========================================================================== */
interface LoginPayload {
    email: string;
    password: string;
}

interface LoginResponse {
    first_name: string;
    last_name: string;
    access_token: string;
    refresh_token: string;
    token_type: string;
    user_id: number;
    email: string;
    user_role: "reviewer" | "admin" | string;
}

interface StoredUser {
    first_name: string;
    last_name: string;
    user_id: number;
    email: string;
    user_role: string;
}

interface ApiErrorShape {
    detail?: string | Record<string, string[]>;
    message?: string;
}

/* ==========================================================================
   API CALL
   ========================================================================== */
const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>(
        "/auth/login/",
        payload
    );
    return data;
};

/* ==========================================================================
   HOOK
   ========================================================================== */
const useLogin = () => {
    return useMutation<LoginResponse, Error, LoginPayload>({
        mutationFn: login,
    });
};

/* ==========================================================================
   SHARED LOGIN FORM
   One form powers both the Reviewer and Admin login pages — only the
   surrounding copy (eyebrow/heading) differs. The role actually granted
   comes back from the server (`user_role`) and is what gets stored.
   ========================================================================== */
interface LoginPageProps {
    eyebrow: string;
    heading: string;
    headingAccent: string;
    subheading: string;
}

interface FormState {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string;
    password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = ({
                       eyebrow,
                       heading,
                       headingAccent,
                       subheading,
                   }: LoginPageProps) => {
    const [form, setForm] = useState<FormState>({ email: "", password: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showToast, setShowToast] = useState(false);
    const [loggedInRole, setLoggedInRole] = useState<string | null>(null);

    const { mutate, isPending, isError, error } = useLogin();

    const updateField =
        (field: keyof FormState) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, [field]: event.target.value }));
            };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};
        if (!form.email.trim()) {
            nextErrors.email = "Enter your email address.";
        } else if (!emailPattern.test(form.email)) {
            nextErrors.email = "Enter a valid email address.";
        }
        if (!form.password) nextErrors.password = "Enter your password.";

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        mutate(
            { email: form.email.trim(), password: form.password },
            {
                onSuccess: (data) => {
                    const user: StoredUser = {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        user_id: data.user_id,
                        email: data.email,
                        user_role: data.user_role,
                    };

                    localStorage.setItem(TOKEN_KEYS.ACCESS, data.access_token);
                    localStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh_token);
                    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));

                    setLoggedInRole(data.user_role);
                    setShowToast(true);
                    setForm({ email: "", password: "" });

                    setTimeout(() => {
                        window.location.href = "/dashboard";
                    }, 1000);
                },
            }
        );
    };

    const serverErrorMessage = (): string | null => {
        if (!isError || !error) return null;
        if (axios.isAxiosError<ApiErrorShape>(error)) {
            const data = error.response?.data;
            if (typeof data?.detail === "string") return data.detail;
            if (data?.message) return data.message;
            if (data?.detail && typeof data.detail === "object") {
                return Object.values(data.detail).flat().join(" ");
            }
            if (error.response?.status === 401 || error.response?.status === 400) {
                return "Invalid email or password.";
            }
        }
        return "Something went wrong. Please try again.";
    };

    return (
        <div className="page-shell">
            <Toast
                message={
                    loggedInRole
                        ? `Signed in as ${loggedInRole}. Redirecting to your dashboard.`
                        : "Signed in successfully."
                }
                visible={showToast}
                onClose={() => setShowToast(false)}
            />

            <div className="page-grid">
                {/* Left: pitch panel */}
                <section className="pitch-panel">
                    <span className="eyebrow">{eyebrow}</span>
                    <h1 className="pitch-heading">
                        {heading}
                        <br />
                        <span className="pitch-heading-accent">{headingAccent}</span>
                    </h1>
                    <p className="pitch-copy">{subheading}</p>

                    <ul className="pitch-points">
                        <li>
                            <span className="pitch-point-dot" />
                            Your session stays secure with short-lived access tokens.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            Access is scoped to your role — no more, no less.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            Forgot your credentials? Reach out to your workspace admin.
                        </li>
                    </ul>

                    <div className="pitch-tags">
                        <span className="pitch-tag">#secure</span>
                        <span className="pitch-tag">#login</span>
                        <span className="pitch-tag">#dashboard</span>
                    </div>
                </section>

                {/* Right: glass form card */}
                <section className="form-panel">
                    <div className="glass-card">
                        <header className="glass-card-header">
                            <h2 className="form-title">Sign in</h2>
                            <p className="form-subtitle">
                                Enter your registered email and password.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="form-body">
                            <div className="field-group">
                                <label htmlFor="email" className="field-label">
                                    Email address *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={updateField("email")}
                                    placeholder="you@example.com"
                                    className={`text-field ${errors.email ? "text-field-error" : ""}`}
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p className="field-error">{errors.email}</p>
                                )}
                            </div>

                            <div className="field-group">
                                <label htmlFor="password" className="field-label">
                                    Password *
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={form.password}
                                    onChange={updateField("password")}
                                    placeholder="••••••••"
                                    className={`text-field ${
                                        errors.password ? "text-field-error" : ""
                                    }`}
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <p className="field-error">{errors.password}</p>
                                )}
                            </div>

                            {isError && (
                                <p className="form-server-error">{serverErrorMessage()}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="submit-button"
                            >
                                {isPending ? "Signing in…" : "Sign in"}
                            </button>

                            <div className="register-links">
                                <a href="/register/reviewer" className="create-link">
                                    Reviewer Registration
                                </a>
                                <a href="/register/admin" className="create-link">
                                    Admin Registration
                                </a>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

/* ==========================================================================
   PAGE EXPORTS
   Both pages render the exact same form — only the left-panel copy differs.
   ========================================================================== */
export const ReviewerAdminLoginPage = () => (
    <LoginPage
        eyebrow="Reviewer / Admin Portal"
        heading="Sign in to"
        headingAccent="manage the pipeline."
        subheading="Sign in to review candidate applications or manage the hiring workflow, based on your account's role."
    />
);