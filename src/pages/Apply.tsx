import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "../lib/axios";
import {Toast} from "../components/Toast.tsx";

/* ==========================================================================
   TYPES
   ========================================================================== */
interface CreateCandidatePayload {
    name: string;
    email: string;
    role_applied: string;
    skills: string[];
    keywords: string;
}

interface CreateCandidateResponse {
    id?: string | number;
    name: string;
    email: string;
    role_applied: string;
    skills: string[];
    keywords: string;
    message?: string;
}

interface ApiErrorShape {
    detail?: string | Record<string, string[]>;
    message?: string;
}

/* ==========================================================================
   API CALL
   ========================================================================== */
const createCandidate = async (
    payload: CreateCandidatePayload
): Promise<CreateCandidateResponse> => {
    const { data } = await apiClient.post<CreateCandidateResponse>(
        "/candidate/create_candidate/",
        payload
    );
    return data;
};
/* ==========================================================================
   SKILL CHIPS INPUT (signature component — echoes the #hashtag chip style)
   ========================================================================== */
interface SkillChipsInputProps {
    skills: string[];
    onChange: (skills: string[]) => void;
    error?: string;
}

const SkillChipsInput = ({ skills, onChange, error }: SkillChipsInputProps) => {
    const [draft, setDraft] = useState("");

    const commitDraft = () => {
        const value = draft.trim().toLowerCase();
        if (value && !skills.includes(value)) {
            onChange([...skills, value]);
        }
        setDraft("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraft();
        } else if (event.key === "Backspace" && draft === "" && skills.length) {
            onChange(skills.slice(0, -1));
        }
    };

    const removeSkill = (skill: string) => {
        onChange(skills.filter((item) => item !== skill));
    };

    return (
        <div>
            <div
                className={`chip-field ${error ? "chip-field-error" : ""}`}
                onClick={(event) => {
                    const input = event.currentTarget.querySelector("input");
                    input?.focus();
                }}
            >
                {skills.map((skill) => (
                    <span key={skill} className="skill-chip">
            #{skill}
                        <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="skill-chip-remove"
                        >
              ×
            </button>
          </span>
                ))}
                <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commitDraft}
                    placeholder={skills.length ? "" : "python, django, react…"}
                    className="chip-input"
                />
            </div>
            <p className="field-hint">Press Enter or comma to add a skill</p>
            {error && <p className="field-error">{error}</p>}
        </div>
    );
};

/* ==========================================================================
   APPLY PAGE
   ========================================================================== */
interface FormState {
    name: string;
    email: string;
    role_applied: string;
    keywords: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    role_applied?: string;
    skills?: string;
}

const initialFormState: FormState = {
    name: "",
    email: "",
    role_applied: "",
    keywords: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ApplyPage = () => {
    const [form, setForm] = useState<FormState>(initialFormState);
    const [skills, setSkills] = useState<string[]>([]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showToast, setShowToast] = useState(false);

    const { mutate, isPending, isError, error } = useMutation<
        CreateCandidateResponse,
        Error,
        CreateCandidatePayload
    >({
        mutationFn: createCandidate,
    });

    const updateField =
        (field: keyof FormState) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({ ...prev, [field]: event.target.value }));
            };

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};
        if (!form.name.trim()) nextErrors.name = "Enter your full name.";
        if (!form.email.trim()) {
            nextErrors.email = "Enter your email address.";
        } else if (!emailPattern.test(form.email)) {
            nextErrors.email = "Enter a valid email address.";
        }
        if (!form.role_applied.trim())
            nextErrors.role_applied = "Enter the role you're applying for.";
        if (skills.length === 0) nextErrors.skills = "Add at least one skill.";

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        mutate(
            {
                name: form.name.trim(),
                email: form.email.trim(),
                role_applied: form.role_applied.trim(),
                skills,
                keywords: form.keywords.trim(),
            },
            {
                onSuccess: () => {
                    setShowToast(true);
                    setForm(initialFormState);
                    setSkills([]);
                    setErrors({});
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
                message={`We've received your application for ${
                    form.role_applied || "the role"
                }.`}
                visible={showToast}
                onClose={() => setShowToast(false)}
            />

            <div className="page-grid">
                {/* Left: pitch panel */}
                <section className="pitch-panel">
                    <span className="eyebrow">Careers</span>
                    <h1 className="pitch-heading">
                        Bring your skills.
                        <br />
                        <span className="pitch-heading-accent">Build what's next.</span>
                    </h1>
                    <p className="pitch-copy">
                        Tell us who you are, the role you want, and the skills you bring.
                        One form, straight to our hiring pipeline — no accounts, no
                        back-and-forth.
                    </p>

                    <ul className="pitch-points">
                        <li>
                            <span className="pitch-point-dot" />
                            Applications are reviewed by real people, usually within 3–5
                            business days.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            Add every relevant skill — our reviewers match on keywords
                            first.
                        </li>
                        <li>
                            <span className="pitch-point-dot" />
                            You'll get a confirmation the moment your application lands.
                        </li>
                    </ul>

                    <div className="pitch-tags">
                        <span className="pitch-tag">#hiring</span>
                        <span className="pitch-tag">#opentowork</span>
                        <span className="pitch-tag">#joinus</span>
                    </div>
                </section>

                {/* Right: glass form card */}
                <section className="form-panel">
                    <div className="glass-card">
                        <header className="glass-card-header">
                            <h2 className="form-title">Apply for a position</h2>
                            <p className="form-subtitle">
                                Fields marked with * are required.
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} noValidate className="form-body">
                            <div className="field-group">
                                <label htmlFor="name" className="field-label">
                                    Full name *
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={form.name}
                                    onChange={updateField("name")}
                                    placeholder="Ajay Kumar"
                                    className={`text-field ${errors.name ? "text-field-error" : ""}`}
                                    autoComplete="name"
                                />
                                {errors.name && <p className="field-error">{errors.name}</p>}
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
                                {errors.email && (
                                    <p className="field-error">{errors.email}</p>
                                )}
                            </div>

                            <div className="field-group">
                                <label htmlFor="role" className="field-label">
                                    Role applied for *
                                </label>
                                <input
                                    id="role"
                                    type="text"
                                    value={form.role_applied}
                                    onChange={updateField("role_applied")}
                                    placeholder="Python Developer"
                                    className={`text-field ${
                                        errors.role_applied ? "text-field-error" : ""
                                    }`}
                                />
                                {errors.role_applied && (
                                    <p className="field-error">{errors.role_applied}</p>
                                )}
                            </div>

                            <div className="field-group">
                                <label htmlFor="skills" className="field-label">
                                    Skills *
                                </label>
                                <SkillChipsInput
                                    skills={skills}
                                    onChange={setSkills}
                                    error={errors.skills}
                                />
                            </div>

                            <div className="field-group">
                                <label htmlFor="keywords" className="field-label">
                                    Keywords
                                </label>
                                <input
                                    id="keywords"
                                    type="text"
                                    value={form.keywords}
                                    onChange={updateField("keywords")}
                                    placeholder="developer"
                                    className="text-field"
                                />
                                <p className="field-hint">
                                    Optional — helps reviewers find your application faster.
                                </p>
                            </div>

                            {isError && (
                                <p className="form-server-error">{serverErrorMessage()}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isPending}
                                className="submit-button"
                            >
                                {isPending ? "Submitting…" : "Submit application"}
                            </button>
                        </form>
                    </div>
                </section>
            </div>

            <footer className="login-footer">
                <a href="/login" className="ghost-button">
                    Reviewer/Admin Login
                </a>
            </footer>
        </div>
    );
};