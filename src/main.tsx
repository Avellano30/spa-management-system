import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import '@mantine/tiptap/styles.css';
import '@mantine/notifications/styles.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

//Routes

//Private Route

// Mantine
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/code-highlight/styles.css';

import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router";
import PrivateRoutes from './utils/PrivateRouter';
import { AuthProvider } from './utils/AuthContext';
import SignIn from './pages/auth/signIn';
import App from './App';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/' element={<SignIn />} />
      <Route element={<PrivateRoutes />}>
        <Route path='/dashboard' element={<App />} />
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
          <Notifications limit={1} zIndex={1000} position='top-right' miw={250} w={"fit-content"}/>
          <RouterProvider router={router} />
        </MantineProvider>
      </AuthProvider>
    </React.StrictMode>
  </GoogleOAuthProvider>,
)