import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Toast } from "../components/Toast";
import axiosInstance from "../middleware/axiosinterceptor.tsx";

/* ==========================================================================
   TYPES
   ========================================================================== */
interface CreateUserPayload {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: number;
    address: string;
    password: string;
}

interface CreateUserResponse {
    message: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
        phone_number: number;
        address: string;
        id: number;
        role: string;
        created_at: string;
        updated_at: string;
    };
}

interface ApiErrorShape {
    detail?: string | Record<string, string[]>;
    message?: string;
}

/* ==========================================================================
   API CALLS — same payload/response shape, different endpoint per role
   ========================================================================== */
const createReviewerUser = async (
    payload: CreateUserPayload
): Promise<CreateUserResponse> => {
    const { data } = await axiosInstance.post<CreateUserResponse>(
        "/auth/create_reviewer_user/",
        payload
    );
    return data;
};

const createAdminUser = async (
    payload: CreateUserPayload
): Promise<CreateUserResponse> => {
    const { data } = await axiosInstance.post<CreateUserResponse>(
        "/auth/create_admin_user/",
        payload
    );
    return data;
};

/* ==========================================================================
   HOOK — pass the endpoint fn in, so one hook serves both roles
   ========================================================================== */
const useCreateUser = (
    mutationFn: (payload: CreateUserPayload) => Promise<CreateUserResponse>
) => {
    return useMutation<CreateUserResponse, Error, CreateUserPayload>({
        mutationFn,
    });
};

/* ==========================================================================
   SHARED REGISTRATION FORM
   ========================================================================== */
interface RegistrationPageProps {
    role: "reviewer" | "admin";
    eyebrow: string;
    heading: string;
    headingAccent: string;
    subheading: string;
    loginHref: string;
}

interface FormState {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address: string;
    password: string;
    confirm_password: string;
}

interface FormErrors {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    password?: string;
    confirm_password?: string;
}

const initialFormState: FormState = {
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    password: "",
    confirm_password: "",
};

const phonePattern = /^[0-9]{8,15}$/;
const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegistrationPage = ({
                              role,
                              eyebrow,
                              heading,
                              headingAccent,
                              subheading,
                              loginHref,
                          }: RegistrationPageProps) => {
    const [form, setForm] = useState<FormState>(initialFormState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showToast, setShowToast] = useState(false);

    const mutationFn = role === "admin" ? createAdminUser : createReviewerUser;
    const { mutate, isPending, isError, error } = useCreateUser(mutationFn);

    const updateField =
        (field: keyof FormState) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, [field]: event.target.value }));
            };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};

        const firstName = form.first_name.trim();
        if (!firstName) {
            nextErrors.first_name = "Enter your first name.";
        } else if (firstName.length < 3 || firstName.length > 15) {
            nextErrors.first_name = "First name must be between 3 and 15 characters.";
        } else if (specialCharPattern.test(firstName)) {
            nextErrors.first_name = "First name should not contain special characters.";
        }

        const lastName = form.last_name.trim();
        if (!lastName) {
            nextErrors.last_name = "Enter your last name.";
        } else if (lastName.length < 3 || lastName.length > 15) {
            nextErrors.last_name = "Last name must be between 3 and 15 characters.";
        } else if (specialCharPattern.test(lastName)) {
            nextErrors.last_name = "Last name should not contain special characters.";
        }

        if (!form.email.trim()) {
            nextErrors.email = "Enter your email address.";
        } else if (!emailPattern.test(form.email)) {
            nextErrors.email = "Enter a valid email address.";
        }

        const phone = form.phone_number.trim();
        if (!phone) {
            nextErrors.phone_number = "Enter your phone number.";
        } else if (!phonePattern.test(phone)) {
            nextErrors.phone_number = "Phone number must be 8–15 digits, no symbols.";
        }

        if (!form.address.trim()) nextErrors.address = "Enter your address.";

        if (!form.password) {
            nextErrors.password = "Enter a password.";
        } else if (form.password.length > 15) {
            nextErrors.password = "Password must be 15 characters or less.";
        } else if (!/[A-Z]/.test(form.password)) {
            nextErrors.password = "Password must contain at least one uppercase letter.";
        } else if (!specialCharPattern.test(form.password)) {
            nextErrors.password = "Password must contain at least one symbol.";
        }

        if (form.confirm_password !== form.password) {
            nextErrors.confirm_password = "Passwords do not match.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        mutate(
            {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                email: form.email.trim(),
                phone_number: Number(form.phone_number.trim()),
                address: form.address.trim(),
                password: form.password,
            },
            {
                onSuccess: () => {
                    setShowToast(true);
                    setForm(initialFormState);
                    setErrors({});
                    setTimeout(() => {
                        window.location.href = loginHref;
                    }, 1200);
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
        }
        return "Something went wrong. Please try again.";
    };

    return (
        <div className="page-shell">
            <Toast
                message={`Account created — redirecting you to sign in.`}
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
                            Your details are used only to set up your account and role.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            You'll sign in right after with the email and password you set here.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            Already have an account? Head to the login page instead.
                        </li>
                    </ul>

                    <div className="pitch-tags">
                        <span className="pitch-tag">#{role}</span>
                        <span className="pitch-tag">#registration</span>
                        <span className="pitch-tag">#onboarding</span>
                    </div>
                </section>

                {/* Right: glass form card */}
                <section className="form-panel">
                    <div className="glass-card">
                        <header className="glass-card-header">
                            <h2 className="form-title">
                                {role === "admin" ? "Admin Registration" : "Reviewer Registration"}
                            </h2>
                            <p className="form-subtitle">
                                Fields marked with * are required.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="form-body">
                            <div className="field-row">
                                <div className="field-group">
                                    <label htmlFor="first_name" className="field-label">
                                        First name *
                                    </label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        value={form.first_name}
                                        onChange={updateField("first_name")}
                                        placeholder="Ajay"
                                        className={`text-field ${
                                            errors.first_name ? "text-field-error" : ""
                                        }`}
                                        autoComplete="given-name"
                                    />
                                    {errors.first_name && (
                                        <p className="field-error">{errors.first_name}</p>
                                    )}
                                </div>

                                <div className="field-group">
                                    <label htmlFor="last_name" className="field-label">
                                        Last name *
                                    </label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        value={form.last_name}
                                        onChange={updateField("last_name")}
                                        placeholder="Thakur"
                                        className={`text-field ${
                                            errors.last_name ? "text-field-error" : ""
                                        }`}
                                        autoComplete="family-name"
                                    />
                                    {errors.last_name && (
                                        <p className="field-error">{errors.last_name}</p>
                                    )}
                                </div>
                            </div>

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
                                {errors.email && <p className="field-error">{errors.email}</p>}
                            </div>

                            <div className="field-group">
                                <label htmlFor="phone_number" className="field-label">
                                    Phone number *
                                </label>
                                <input
                                    id="phone_number"
                                    type="tel"
                                    inputMode="numeric"
                                    value={form.phone_number}
                                    onChange={updateField("phone_number")}
                                    placeholder="9850231470"
                                    maxLength={15}
                                    className={`text-field ${
                                        errors.phone_number ? "text-field-error" : ""
                                    }`}
                                    autoComplete="tel"
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="address" className="field-label">
                                    Address *
                                </label>
                                <input
                                    id="address"
                                    type="text"
                                    value={form.address}
                                    onChange={updateField("address")}
                                    placeholder="Nepalgunj"
                                    className={`text-field ${
                                        errors.address ? "text-field-error" : ""
                                    }`}
                                    autoComplete="address-level2"
                                />
                                {errors.address && (
                                    <p className="field-error">{errors.address}</p>
                                )}
                            </div>

                            <div className="field-row">
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
                                        maxLength={15}
                                        className={`text-field ${
                                            errors.password ? "text-field-error" : ""
                                        }`}
                                        autoComplete="new-password"
                                    />
                                    {errors.password ? (
                                        <p className="field-error">{errors.password}</p>
                                    ) : (
                                        <p className="field-hint">Max 15 characters, 1 uppercase, 1 symbol.</p>
                                    )}
                                </div>

                                <div className="field-group">
                                    <label htmlFor="confirm_password" className="field-label">
                                        Confirm password *
                                    </label>
                                    <input
                                        id="confirm_password"
                                        type="password"
                                        value={form.confirm_password}
                                        onChange={updateField("confirm_password")}
                                        placeholder="••••••••"
                                        className={`text-field ${
                                            errors.confirm_password ? "text-field-error" : ""
                                        }`}
                                        autoComplete="new-password"
                                    />
                                    {errors.confirm_password && (
                                        <p className="field-error">{errors.confirm_password}</p>
                                    )}
                                </div>
                            </div>

                            {isError && (
                                <p className="form-server-error">{serverErrorMessage()}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="submit-button"
                            >
                                {isPending ? "Creating account…" : "Create account"}
                            </button>

                            <a href={loginHref} className="create-link">
                                Already have an account? Sign in
                            </a>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
};

/* ==========================================================================
   PAGE EXPORTS
   ========================================================================== */
export const ReviewerRegistrationPage = () => (
    <RegistrationPage
        role="reviewer"
        eyebrow="Reviewer Portal"
        heading="Join as a"
        headingAccent="reviewer."
        subheading="Create your reviewer account to start evaluating candidate applications."
        loginHref="/login"
    />
);

export const AdminRegistrationPage = () => (
    <RegistrationPage
        role="admin"
        eyebrow="Admin Portal"
        heading="Set up an"
        headingAccent="admin account."
        subheading="Create your admin account to manage reviewers and oversee the hiring pipeline."
        loginHref="/login"
    />
);