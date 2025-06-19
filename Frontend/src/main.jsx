import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { Loader2 } from "lucide-react"; // Added missing import
import "./index.css";

// Components
import Layout from "./components/Layout";

// Pages
import SignUp from "./pages/SignUpPage/SignUp";
import LogIn from "./pages/LogInPage/LogIn";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import AlertPage from "./pages/AlertPage/AlertPage";
import TrendPage from "./pages/TrendPage/TrendPage";

// Loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen bg-gray-950">
    <Loader2 className="animate-spin text-white" size={24} />
  </div>
);

// Router configuration
const router = createBrowserRouter([
  // Root redirect
  {
    path: "/",
    element: <Navigate to="/signup" replace />,
  },

  // Auth routes
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/login",
    element: <LogIn />,
  },

  // Protected app routes with layout
  {
    path: "/app",
    element: <Layout />,
    errorElement: <LoadingFallback />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "alerts",
        element: <AlertPage />,
      },
      {
        path: "trends",
        element: <TrendPage />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/signup" replace />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
