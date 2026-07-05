export const NotFoundPage = () => {
    return (
        <div className="page-shell">
            <div className="page-grid" style={{ gridTemplateColumns: "1fr" }}>
                <section className="form-panel">
                    <div className="glass-card" style={{ textAlign: "center" }}>
                        <span className="eyebrow">Error 404</span>
                        <h1 className="pitch-heading" style={{ marginTop: "0.75rem" }}>
                            Page not <span className="pitch-heading-accent">found.</span>
                        </h1>
                        <p className="pitch-copy" style={{ margin: "0.75rem auto 1.5rem" }}>
                            The page you're looking for doesn't exist or may have been moved.
                        </p>
                        <a href="/" className="submit-button" style={{ display: "inline-block", textDecoration: "none" }}>
                            Back to home
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
};