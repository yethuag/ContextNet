import { Outlet } from "react-router-dom";
import Navbar from "./NavBar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <MainContent />
    </div>
  );
};

const MainContent = () => (
  <main className="flex-1 transition-all duration-300">
    <div className="overflow-y-auto h-[calc(100vh-64px)]">
      {" "}
      {/* Subtract navbar height */}
      <div className="p-6">
        {" "}
        {/* Add padding for content */}
        <Outlet />
      </div>
    </div>
  </main>
);

export default Layout;
