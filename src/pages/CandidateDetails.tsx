import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance, { TOKEN_KEYS } from "../middleware/axiosinterceptor.tsx";
import useAuthGuard from "../middleware/authguard.tsx";

/* ==========================================================================
   TYPES
   ========================================================================== */
interface StoredUser {
    first_name: string;
    last_name: string;
    user_id: number;
    email: string;
    user_role: string;
}

interface CandidateScore {
    id: number;
    score: number;
    category: string;
    notes: string;
    candidate_id: number;
    reviewer_id: number;
    created_at: string;
    updated_at: string;
}

interface CandidateDetails {
    id: number;
    name: string;
    email: string;
    role_applied: string;
    skills: string[];
    keywords: string;
    status: string;
    internal_notes: string | null;
    scores: CandidateScore[];
    created_at: string;
    updated_at: string;
}

interface CandidateDetailsResponse {
    message: string;
    data: CandidateDetails;
}

/* ==========================================================================
   API CALL — access_token is attached automatically by axiosInstance's
   request interceptor (Authorization: Bearer <access_token>).
   ========================================================================== */
const getCandidateDetails = async (
    id: string
): Promise<CandidateDetailsResponse> => {
    const { data } = await axiosInstance.get<CandidateDetailsResponse>(
        `/candidate/${id}/`
    );
    return data;
};


type CandidateStatus = "new" | "reviewed" | "hired" | "rejected";

const CANDIDATE_STATUSES: CandidateStatus[] = [
    "new",
    "reviewed",
    "hired",
    "rejected",
];

const updateCandidateStatus = async (
    id: string,
    status: CandidateStatus
): Promise<void> => {
    await axiosInstance.patch(`/candidate/${id}/status/`, { status });
};

const updateInternalNote = async (
    id: string,
    internal_notes: string
): Promise<void> => {
    await axiosInstance.patch(`/candidate/${id}/`, { internal_notes });
};

interface CreateScorePayload {
    category: string;
    score: number;
    notes: string;
}

const createCandidateScore = async (
    id: string,
    payload: CreateScorePayload
): Promise<void> => {
    await axiosInstance.post(`/candidates/${id}/scores/`, payload);
};


const useCandidateDetails = (id: string) => {
    return useQuery({
        queryKey: ["candidate", id],
        queryFn: () => getCandidateDetails(id),
        enabled: Boolean(id),
    });
};

const useUpdateCandidateStatus = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (status: CandidateStatus) => updateCandidateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["candidate", id] });
            queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
    });
};

const useUpdateInternalNote = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (internal_notes: string) => updateInternalNote(id, internal_notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["candidate", id] });
            queryClient.invalidateQueries({ queryKey: ["candidates"] });
        },
    });
};

const useCreateCandidateScore = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateScorePayload) => createCandidateScore(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["candidate", id] });
        },
    });
};

/* ==========================================================================
   HELPERS
   ========================================================================== */
const getStoredUser = (): StoredUser | null => {
    const raw = localStorage.getItem(TOKEN_KEYS.USER);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredUser;
    } catch {
        return null;
    }
};

const statusClass = (status: string) => {
    switch (status.toLowerCase()) {
        case "new":
            return "status-badge status-new";
        case "shortlisted":
        case "reviewed":
            return "status-badge status-reviewed";
        case "rejected":
            return "status-badge status-rejected";
        case "hired":
            return "status-badge status-hired";
        default:
            return "status-badge";
    }
};

/* ==========================================================================
   INTERNAL NOTE MODAL (admin only)
   ========================================================================== */
interface NoteModalProps {
    initialNote: string;
    onClose: () => void;
    onSave: (note: string) => void;
    isSaving: boolean;
    isError: boolean;
}

const NoteModal = ({ initialNote, onClose, onSave, isSaving, isError }: NoteModalProps) => {
    const [note, setNote] = useState(initialNote);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Update internal note</h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="modal-body">
          <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note for other reviewers…"
              className="notes-textarea"
              rows={5}
              autoFocus
          />
                    {isError && (
                        <p className="form-server-error">Failed to save note. Please try again.</p>
                    )}
                </div>
                <div className="internal-notes-actions">
                    <button type="button" className="notes-cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="notes-save-button"
                        onClick={() => onSave(note.trim())}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ==========================================================================
   SCORE MODAL — shared for both Create and Update
   ========================================================================== */
interface ScoreModalProps {
    mode: "create" | "update";
    initialScore?: CandidateScore;
    onClose: () => void;
    onCreate: (payload: CreateScorePayload) => void;
    isSaving: boolean;
    isError: boolean;
}

const ScoreModal = ({
                        mode,
                        initialScore,
                        onClose,
                        onCreate,
                        isSaving,
                        isError,
                    }: ScoreModalProps) => {
    const [score, setScore] = useState(initialScore?.score?.toString() ?? "");
    const [category, setCategory] = useState(initialScore?.category ?? "");
    const [notes, setNotes] = useState(initialScore?.notes ?? "");

    const handleSave = () => {
        if (mode === "create") {
            onCreate({ category: category.trim(), score: Number(score), notes: notes.trim() });
        } else {
            // NOTE: no "update score" endpoint has been provided yet.
            // Wire this up once available, e.g.:
            // await axiosInstance.patch(`/candidates/${candidateId}/scores/${initialScore?.id}/`, { category, score, notes });
            console.log("Update score", { id: initialScore?.id, score: Number(score), category, notes });
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        {mode === "create" ? "Create score" : "Update score"}
                    </h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                <div className="modal-body">
                    <div className="field-group">
                        <label htmlFor="score" className="field-label">Score</label>
                        <input
                            id="score"
                            type="number"
                            value={score}
                            onChange={(event) => setScore(event.target.value)}
                            placeholder="5"
                            className="text-field"
                        />
                    </div>
                    <div className="field-group">
                        <label htmlFor="category" className="field-label">Category</label>
                        <input
                            id="category"
                            type="text"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            placeholder="Developer"
                            className="text-field"
                        />
                    </div>
                    <div className="field-group">
                        <label htmlFor="score-notes" className="field-label">Notes</label>
                        <textarea
                            id="score-notes"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Looks like a good candidate"
                            className="notes-textarea"
                            rows={3}
                        />
                    </div>
                    {isError && (
                        <p className="form-server-error">Failed to save score. Please try again.</p>
                    )}
                </div>
                <div className="internal-notes-actions">
                    <button type="button" className="notes-cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="notes-save-button"
                        onClick={handleSave}
                        disabled={isSaving || !score.trim() || !category.trim()}
                    >
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ==========================================================================
   CANDIDATE DETAILS PAGE
   ========================================================================== */
export const CandidateDetailsPage = () => {
    useAuthGuard();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = getStoredUser();
    const isAdmin = user?.user_role === "admin";

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [scoreModal, setScoreModal] = useState<"create" | "update" | null>(null);

    const { data, isLoading, isError, error } = useCandidateDetails(id ?? "");
    const candidate = data?.data;

    const [selectedStatus, setSelectedStatus] = useState<CandidateStatus | null>(null);
    const statusMutation = useUpdateCandidateStatus(id ?? "");

    const handleStatusUpdate = () => {
        if (selectedStatus) {
            statusMutation.mutate(selectedStatus);
        }
    };

    const noteMutation = useUpdateInternalNote(id ?? "");

    const handleSaveNote = (note: string) => {
        noteMutation.mutate(note, {
            onSuccess: () => setIsNoteModalOpen(false),
        });
    };

    const createScoreMutation = useCreateCandidateScore(id ?? "");

    const handleCreateScore = (payload: CreateScorePayload) => {
        createScoreMutation.mutate(payload, {
            onSuccess: () => setScoreModal(null),
        });
    };

    return (
        <div className="dashboard-shell">
            <header className="dashboard-topbar">
                <div>
                    <span className="eyebrow">Candidate</span>
                    <h1 className="dashboard-heading">Candidate details</h1>
                </div>
                <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
                    ← Back to dashboard
                </button>
            </header>

            <main className="dashboard-content">
                {isLoading && <p className="dashboard-status">Loading candidate…</p>}

                {isError && (
                    <p className="form-server-error">
                        {error instanceof Error ? error.message : "Failed to load candidate."}
                    </p>
                )}

                {candidate && (
                    <>
                        {/* Summary card */}
                        <div className="glass-card detail-summary-card">
                            <div className="detail-summary-header">
                                <div>
                                    <h2 className="form-title">{candidate.name}</h2>
                                    <p className="candidate-email">{candidate.email}</p>
                                </div>
                                <div className="status-update-group">
                                    <span className={statusClass(candidate.status)}>{candidate.status}</span>
                                    <select
                                        value={selectedStatus ?? candidate.status}
                                        onChange={(event) =>
                                            setSelectedStatus(event.target.value as CandidateStatus)
                                        }
                                        className="status-select"
                                    >
                                        {CANDIDATE_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={handleStatusUpdate}
                                        disabled={
                                            statusMutation.isPending ||
                                            !selectedStatus ||
                                            selectedStatus === candidate.status
                                        }
                                    >
                                        {statusMutation.isPending ? "Updating…" : "Update Status"}
                                    </button>
                                </div>
                            </div>

                            <div className="detail-grid">
                                <div>
                                    <span className="modal-label">Role applied</span>
                                    <p className="modal-value">{candidate.role_applied}</p>
                                </div>
                                <div>
                                    <span className="modal-label">Keywords</span>
                                    <p className="modal-value">{candidate.keywords || "—"}</p>
                                </div>
                                <div>
                                    <span className="modal-label">Applied on</span>
                                    <p className="modal-value">
                                        {new Date(candidate.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <span className="modal-label">Last updated</span>
                                    <p className="modal-value">
                                        {new Date(candidate.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <span className="modal-label">Skills</span>
                                <div className="candidate-skills" style={{ marginTop: "0.4rem" }}>
                                    {candidate.skills.map((skill) => (
                                        <span key={skill} className="skill-chip">
                      #{skill}
                    </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Scores section */}
                        <section className="detail-section">
                            <div className="detail-section-header">
                                <h3 className="section-title">Scores</h3>
                                <div className="button-row">
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => setScoreModal("create")}
                                    >
                                        Create Score
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => setScoreModal("update")}
                                        disabled={candidate.scores.length === 0}
                                    >
                                        Update Score
                                    </button>
                                </div>
                            </div>

                            {candidate.scores.length === 0 ? (
                                <p className="dashboard-status">No scores yet.</p>
                            ) : (
                                <div className="scores-list">
                                    {candidate.scores.map((score) => (
                                        <div key={score.id} className="score-card">
                                            <div className="score-card-header">
                                                <span className="score-value">{score.score}</span>
                                                <span className="score-category">{score.category}</span>
                                            </div>
                                            <p className="score-notes">{score.notes}</p>
                                            <p className="candidate-date">
                                                Reviewed {new Date(score.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Internal notes — admin only */}
                        {isAdmin && (
                            <section className="detail-section">
                                <div className="detail-section-header">
                                    <h3 className="section-title">Internal notes</h3>
                                    <button
                                        type="button"
                                        className="ghost-button"
                                        onClick={() => setIsNoteModalOpen(true)}
                                    >
                                        Update Internal Note
                                    </button>
                                </div>
                                <p className="internal-notes-text">
                                    {candidate.internal_notes || "No notes yet."}
                                </p>
                            </section>
                        )}
                    </>
                )}
            </main>

            {isNoteModalOpen && candidate && (
                <NoteModal
                    initialNote={candidate.internal_notes ?? ""}
                    onClose={() => setIsNoteModalOpen(false)}
                    onSave={handleSaveNote}
                    isSaving={noteMutation.isPending}
                    isError={noteMutation.isError}
                />
            )}

            {scoreModal && candidate && (
                <ScoreModal
                    mode={scoreModal}
                    initialScore={scoreModal === "update" ? candidate.scores[0] : undefined}
                    onClose={() => setScoreModal(null)}
                    onCreate={handleCreateScore}
                    isSaving={createScoreMutation.isPending}
                    isError={createScoreMutation.isError}
                />
            )}
        </div>
    );
};