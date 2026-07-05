import { useEffect } from "react";

interface ToastProps {
    message: string;
    visible: boolean;
    onClose: () => void;
}

export const Toast = ({ message, visible, onClose }: ToastProps) => {
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [visible, onClose]);

    return (
        <div
            role="status"
            aria-live="polite"
            className={`toast-wrapper ${visible ? "toast-visible" : "toast-hidden"}`}
        >
            <div className="toast-card">
        <span className="toast-icon" aria-hidden="true">
          ✓
        </span>
                <div className="toast-text">
                    <p className="toast-title">Application submitted</p>
                    <p className="toast-subtitle">{message}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="toast-close"
                    aria-label="Dismiss notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
};