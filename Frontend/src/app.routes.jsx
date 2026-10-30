import { createBrowserRouter } from 'react-router'
import Login from './features/app/pages/Login'
import Register from './features/app/pages/Register'
import { Protected } from './features/app/components/Protected';
import Home from './features/interview/pages/HOME.JSX';
import Interview from './features/interview/pages/Interview';


const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    }
])

export default router;
