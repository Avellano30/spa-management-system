import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../utils/AuthContext";
import { logAuth } from '../../lib/logger';

const domain = import.meta.env.VITE_ENDPOINT;

export default function useHandleLogin() {
    const [errorMessage, setErrorMessage] = useState<boolean>(false);
    const { setAuthState } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (email: string, password: string) => {
        setErrorMessage(false);

        try {
            const response = await fetch(`${domain}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                logAuth('Admin sign in failed', { method: 'email', email });
                setErrorMessage(true);
                return;
            }

            const session = await response.json();
            setAuthState({ firstName: session.firstName, lastName: session.lastName, email: session.email });
            localStorage.setItem("session", session.token);
            logAuth('Admin signed in', { method: 'email', email: session.email });
            navigate("/dashboard");
        } catch (error) {
            console.error("There was a problem with the fetch operation:", error);
            setErrorMessage(true);
        }
    };

    return { handleLogin, errorMessage, setErrorMessage };
}