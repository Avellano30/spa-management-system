import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import '@mantine/tiptap/styles.css';
import '@mantine/notifications/styles.css';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router";

// Mantine
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/code-highlight/styles.css';

//Private Route
import { AuthProvider } from './utils/AuthContext';
import PrivateRoutes from './utils/PrivateRouter';

//Routes
import App from './App';
import SignIn from "./pages/auth/SignIn.tsx";
import Services from "./pages/services/index.tsx";
import Settings from './pages/settings/index.tsx';
import Appointments from './pages/appointments/index.tsx';
import Users from './pages/users/index.tsx';
import Reports from './pages/reports/index.tsx';
import Logs from "./pages/logs.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <>
            <Route path='/' element={<SignIn />} />
            <Route element={<PrivateRoutes />}>
                <Route path='/dashboard' element={<App />} />
                <Route path='/appointments' element={<Appointments />} />
                <Route path='/services' element={<Services />} />
                <Route path='/users' element={<Users />} />
                <Route path='/reports' element={<Reports />} />
                <Route path='/settings' element={<Settings />} />
                <Route path='/logs' element={<Logs />} />
            </Route>
        </>
    )
);

const theme = createTheme({
    /** Put your mantine theme override here */
    // fontFamily: 'Inter, sans-serif',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
        <React.StrictMode>
            <AuthProvider>
                <MantineProvider theme={theme}>
                    <Notifications limit={1} zIndex={1000} position='top-right' miw={250} w={"fit-content"} />
                    <RouterProvider router={router} />
                </MantineProvider>
            </AuthProvider>
        </React.StrictMode>
    </GoogleOAuthProvider>,
)