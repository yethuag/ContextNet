import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
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
    element: <Navigate to="/signup" replace />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/login",
    element: <LogIn />,
  },
  {
    path: "/app",
    element: <Layout />,
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
        path: "alerts/:id",
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
    element: <Navigate to="/signup" replace />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
