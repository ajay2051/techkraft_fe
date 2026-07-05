import { useState, type SVGProps } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance, {clearSession, TOKEN_KEYS} from "../middleware/axiosinterceptor.tsx";

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

interface CandidateItem {
    id: number;
    name: string;
    email: string;
    role_applied: string;
    skills: string[];
    keywords: string;
    status: string;
    scores: number[];
    internal_notes: string | null;
    created_at: string;
    updated_at: string;
}

interface CandidateListData {
    count: number;
    next_page: number | null;
    previous_page: number | null;
    current_page: number;
    total_pages: number;
    items: CandidateItem[];
}

interface CandidateListResponse {
    message: string;
    data: CandidateListData;
}

/* ==========================================================================
   API CALL — Bearer token is attached automatically by axiosInstance's
   request interceptor, so no manual header handling is needed here.
   ========================================================================== */
const listCandidates = async (
    page: number = 1
): Promise<CandidateListResponse> => {
    const { data } = await axiosInstance.get<CandidateListResponse>(
        "/candidate/list_candidates/",
        { params: { page } }
    );
    return data;
};

/* ==========================================================================
   HOOK
   ========================================================================== */
const useCandidates = (page: number) => {
    return useQuery({
        queryKey: ["candidates", page],
        queryFn: () => listCandidates(page),
        placeholderData: (previousData) => previousData,
    });
};

/* ==========================================================================
   ICONS — plain inline SVGs, no icon library dependency
   ========================================================================== */
const EyeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const PencilIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path
            d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path
            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/* ==========================================================================
   STATUS BADGE
   ========================================================================== */
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
   DETAILS MODAL — full candidate info (read-only)
   ========================================================================== */
interface DetailsModalProps {
    candidate: CandidateItem;
    onClose: () => void;
}

const DetailsModal = ({ candidate, onClose }: DetailsModalProps) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
                <h3 className="modal-title">{candidate.name}</h3>
                <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                    <CloseIcon width={18} height={18} />
                </button>
            </div>

            <div className="modal-body">
                <div className="modal-row">
                    <span className="modal-label">Email</span>
                    <span className="modal-value">{candidate.email}</span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Role applied</span>
                    <span className="modal-value">{candidate.role_applied}</span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Status</span>
                    <span className={statusClass(candidate.status)}>{candidate.status}</span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Skills</span>
                    <div className="candidate-skills">
                        {candidate.skills.map((skill) => (
                            <span key={skill} className="skill-chip">
                #{skill}
              </span>
                        ))}
                    </div>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Keywords</span>
                    <span className="modal-value">{candidate.keywords || "—"}</span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Scores</span>
                    <span className="modal-value">
            {candidate.scores.length ? candidate.scores.join(", ") : "Not scored yet"}
          </span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Internal notes</span>
                    <span className="modal-value">{candidate.internal_notes || "No notes yet."}</span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Applied on</span>
                    <span className="modal-value">
            {new Date(candidate.created_at).toLocaleString()}
          </span>
                </div>
                <div className="modal-row">
                    <span className="modal-label">Last updated</span>
                    <span className="modal-value">
            {new Date(candidate.updated_at).toLocaleString()}
          </span>
                </div>
            </div>
        </div>
    </div>
);

/* ==========================================================================
   EDIT NOTES MODAL — admin only
   ========================================================================== */
interface EditNotesModalProps {
    candidate: CandidateItem;
    onClose: () => void;
    onSave: (id: number, note: string) => void;
    isSaving?: boolean;
}

const EditNotesModal = ({
                            candidate,
                            onClose,
                            onSave,
                            isSaving,
                        }: EditNotesModalProps) => {
    const [note, setNote] = useState(candidate.internal_notes ?? "");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Internal notes — {candidate.name}</h3>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
                        <CloseIcon width={18} height={18} />
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
                </div>

                <div className="internal-notes-actions">
                    <button type="button" className="notes-cancel-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="notes-save-button"
                        onClick={() => onSave(candidate.id, note.trim())}
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
   DASHBOARD PAGE
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

export const DashboardPage = () => {
    const [page, setPage] = useState(1);
    const [viewingCandidate, setViewingCandidate] = useState<CandidateItem | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<CandidateItem | null>(null);

    const user = getStoredUser();
    const isAdmin = user?.user_role === "admin";

    const { data, isLoading, isError, error, isFetching } = useCandidates(page);

    const handleLogout = () => {
        clearSession();
        window.location.href = "/login";
    };

    const handleSaveNote = (id: number, note: string) => {
        // NOTE: no "update candidate" endpoint was provided alongside
        // list_candidates/, so this only closes the modal for now.
        // Wire this up to your update endpoint, e.g.:
        // await axiosInstance.patch(`/candidate/update_candidate/${id}/`, { internal_notes: note });
        console.log("Save internal note", { id, note });
        setEditingCandidate(null);
    };

    const handleDelete = (candidate: CandidateItem) => {
        // NOTE: no "delete candidate" endpoint was provided.
        // Wire this up once available, e.g.:
        // await axiosInstance.delete(`/candidate/delete_candidate/${candidate.id}/`);
        const confirmed = window.confirm(
            `Delete ${candidate.name}'s application? This cannot be undone.`
        );
        if (confirmed) {
            console.log("Delete candidate", candidate.id);
        }
    };

    const items = data?.data.items ?? [];
    const currentPage = data?.data.current_page ?? page;
    const totalPages = data?.data.total_pages ?? 1;

    return (
        <div className="dashboard-shell">
            <header className="dashboard-topbar">
                <div>
          <span className="eyebrow">
            {isAdmin ? "Admin Dashboard" : "Reviewer Dashboard"}
          </span>
                    <h1 className="dashboard-heading">
                        Welcome{user?.first_name ? `, ${user.first_name}` : ""}
                    </h1>
                </div>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <main className="dashboard-content">
                {isLoading && <p className="dashboard-status">Loading candidates…</p>}

                {isError && (
                    <p className="form-server-error">
                        {error instanceof Error ? error.message : "Failed to load candidates."}
                    </p>
                )}

                {!isLoading && !isError && items.length === 0 && (
                    <p className="dashboard-status">No candidates found yet.</p>
                )}

                {items.length > 0 && (
                    <>
                        <p className="dashboard-count">
                            {data?.data.count} candidate{data?.data.count === 1 ? "" : "s"} total
                            {isFetching && " · refreshing…"}
                        </p>

                        <div className="table-wrapper">
                            <table className="candidates-table">
                                <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role applied</th>
                                    <th>Skills</th>
                                    <th>Status</th>
                                    <th>Applied</th>
                                    <th className="col-actions">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {items.map((candidate) => (
                                    <tr key={candidate.id}>
                                        <td data-label="Name">{candidate.name}</td>
                                        <td data-label="Email">{candidate.email}</td>
                                        <td data-label="Role applied">{candidate.role_applied}</td>
                                        <td data-label="Skills">
                                            <div className="candidate-skills">
                                                {candidate.skills.map((skill) => (
                                                    <span key={skill} className="skill-chip">
                              #{skill}
                            </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td data-label="Status">
                        <span className={statusClass(candidate.status)}>
                          {candidate.status}
                        </span>
                                        </td>
                                        <td data-label="Applied">
                                            {new Date(candidate.created_at).toLocaleDateString()}
                                        </td>
                                        <td data-label="Actions" className="col-actions">
                                            <div className="row-actions">
                                                <button
                                                    type="button"
                                                    className="icon-button"
                                                    title="View details"
                                                    aria-label={`View details for ${candidate.name}`}
                                                    onClick={() => setViewingCandidate(candidate)}
                                                >
                                                    <EyeIcon width={17} height={17} />
                                                </button>

                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        className="icon-button"
                                                        title="Edit internal notes"
                                                        aria-label={`Edit internal notes for ${candidate.name}`}
                                                        onClick={() => setEditingCandidate(candidate)}
                                                    >
                                                        <PencilIcon width={17} height={17} />
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="icon-button icon-button-danger"
                                                    title="Delete candidate"
                                                    aria-label={`Delete ${candidate.name}`}
                                                    onClick={() => handleDelete(candidate)}
                                                >
                                                    <TrashIcon width={17} height={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination-bar">
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={data?.data.previous_page === null}
                                >
                                    ← Previous
                                </button>
                                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={data?.data.next_page === null}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {viewingCandidate && (
                <DetailsModal
                    candidate={viewingCandidate}
                    onClose={() => setViewingCandidate(null)}
                />
            )}

            {editingCandidate && isAdmin && (
                <EditNotesModal
                    candidate={editingCandidate}
                    onClose={() => setEditingCandidate(null)}
                    onSave={handleSaveNote}
                />
            )}
        </div>
    );
};