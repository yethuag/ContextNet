import React, { use, useState } from "react";
import { BarChart3, AlertTriangle, TrendingUp, User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    navigate(`/app/${tabName}`);
    console.log(`Navigating to ${tabName}`);
  };

  const NavItem = ({ id, icon: Icon, title, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`group relative flex items-center space-x-2 px-3 py-2 transition-all duration-300 ease-out cursor-pointer ${
        isActive ? "text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{title}</span>

      {/* Active underline */}
      {isActive && (
        <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-white transition-all duration-300"></div>
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
    <nav className="w-full bg-black border-b border-gray-800 px-6 py-3 relative">
      <div className="flex items-center justify-between">
        {/* Left - Brand */}
        <div className="text-white text-xl font-semibold tracking-wide cursor-pointer hover:text-gray-300 transition-colors duration-200">
          CONTEXTNET
        </div>

        {/* Center - Navigation Items */}
        <div className="flex items-center space-x-8">
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
        <div className="flex items-center space-x-3 relative">
          <ActionButton
            icon={User}
            title="User Profile"
            onClick={handleUserClick}
            variant="user"
          />
          <ActionButton icon={Plus} title="Add New" onClick={handleAddClick} />

          {/* User Menu Dropdown (placeholder) */}
          {showUserMenu && (
            <div className="absolute top-12 right-0 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-2 z-50">
              <button className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200">
                Profile Settings
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200">
                Preferences
              </button>
              <hr className="border-gray-700 my-1" />
              <button className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors duration-200">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
