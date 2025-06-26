import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import "./index.css";

// Layout & Pages
import Layout from "./components/Layout";
import SignUp from "./pages/SignUpPage/SignUp";
import LogIn from "./pages/LogInPage/LogIn";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import TrendPage from "./pages/TrendPage/TrendPage";
import MainAlertPage from "./pages/AlertPage/MainAlertPage";
import AlertSubPage from "./pages/AlertPage/AlertSubPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Component (for login/signup pages)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    // If already logged in, redirect to dashboard
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-950">
    <Loader2 className="animate-spin text-white" size={24} />
  </div>
);

// Router config
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <SignUp />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LogIn />
      </PublicRoute>
    ),
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <LoadingFallback />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "alerts",
        element: <MainAlertPage />,
      },
      {
        path: "alerts/:new_id",
        element: <AlertSubPage />,
      },
      {
        path: "trends",
        element: <TrendPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
