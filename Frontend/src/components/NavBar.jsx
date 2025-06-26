import React, { useState, useEffect } from "react";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  User,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the active tab from the current URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/app/alerts")) return "alerts";
    if (path.includes("/app/trends")) return "trends";
    if (path.includes("/app/dashboard")) return "dashboard";
    return "dashboard"; // default fallback
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Update activeTab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const handleSignOut = () => {
    // Remove all auth-related data
    localStorage.removeItem("token");

    // Navigate to login with replace
    navigate("/login", { replace: true });
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    navigate(`/app/${tabName}`);
    setShowMobileMenu(false); // Close mobile menu on navigation
    console.log(`Navigating to ${tabName}`);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setShowMobileMenu(false); // Close mobile menu when logout is clicked
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleSignOut();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const NavItem = ({ id, icon: Icon, title, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`group relative flex items-center space-x-2 px-3 py-2 transition-all duration-300 ease-out cursor-pointer w-full md:w-auto ${
        isActive ? "text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{title}</span>

      {/* Active underline - hidden on mobile */}
      {isActive && (
        <div className="hidden md:block absolute -bottom-3 left-0 right-0 h-0.5 bg-white transition-all duration-300"></div>
      )}

      {/* Mobile active indicator */}
      {isActive && (
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
      )}

      {/* Hover background effect */}
      <div className="absolute inset-0 rounded-md bg-gray-800/0 group-hover:bg-gray-800/50 transition-all duration-300 -z-10" />
    </button>
  );

  const ActionButton = ({
    icon: Icon,
    title,
    onClick,
    variant = "default",
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out transform hover:scale-105 cursor-pointer ${
        variant === "user"
          ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600"
          : "bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600"
      }`}
    >
      <Icon className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors duration-300" />
    </button>
  );

  const handleUserClick = () => {
    setShowUserMenu(!showUserMenu);
    console.log("User menu toggled");
  };

  const handleAddClick = () => {
    console.log("Add button clicked");
  };

  return (
    <>
      <nav className="w-full bg-black border-b border-gray-800 px-4 md:px-6 py-3 relative">
        <div className="flex items-center justify-between">
          {/* Left - Brand */}
          <div className="text-white text-lg md:text-xl font-semibold tracking-wide cursor-pointer hover:text-gray-300 transition-colors duration-200">
            CONTEXTNET
          </div>

          {/* Center - Navigation Items (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            <NavItem
              id="dashboard"
              icon={BarChart3}
              title="Dashboard"
              isActive={activeTab === "dashboard"}
              onClick={handleTabClick}
            />
            <NavItem
              id="alerts"
              icon={AlertTriangle}
              title="Alerts"
              isActive={activeTab === "alerts"}
              onClick={handleTabClick}
            />
            <NavItem
              id="trends"
              icon={TrendingUp}
              title="Trends"
              isActive={activeTab === "trends"}
              onClick={handleTabClick}
            />
          </div>

          {/* Right - User Actions */}
          <div className="flex items-center space-x-3">
            {/* Desktop Logout Button */}
            <div className="hidden md:block">
              <ActionButton
                icon={LogOut}
                title="Logout"
                onClick={handleLogoutClick}
                variant="logout"
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black border-b border-gray-800 z-40">
            <div className="flex flex-col py-2">
              <NavItem
                id="dashboard"
                icon={BarChart3}
                title="Dashboard"
                isActive={activeTab === "dashboard"}
                onClick={handleTabClick}
              />
              <NavItem
                id="alerts"
                icon={AlertTriangle}
                title="Alerts"
                isActive={activeTab === "alerts"}
                onClick={handleTabClick}
              />
              <NavItem
                id="trends"
                icon={TrendingUp}
                title="Trends"
                isActive={activeTab === "trends"}
                onClick={handleTabClick}
              />

              {/* Mobile Logout Button */}
              <div className="border-t border-gray-800 mt-2 pt-2 px-3">
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors duration-200 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <LogOut className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">
                Confirm Logout
              </h3>
            </div>

            <p className="text-gray-300 mb-6 text-sm md:text-base">
              Are you sure you want to log out? You'll need to sign in again to
              access your account.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200 border border-gray-600 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
