import { useNavigate } from "react-router";
import { useAuth } from "../../utils/AuthContext";
import { logAuth } from '../../lib/logger';

export default function useHandleLogout() {
    const { setAuthState } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logAuth('Admin signed out', {});
        setAuthState(null);
        localStorage.removeItem("session");
        navigate("/");
    };

    return { handleLogout };
}