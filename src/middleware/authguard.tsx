import {useEffect} from "react";
import {useNavigate} from "react-router-dom";

const TOKEN_KEY    = "access_token";

function useAuthGuard() {
    const navigate = useNavigate();
    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        if (!token) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);
}

export default useAuthGuard;