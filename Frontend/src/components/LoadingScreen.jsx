const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
    {/* Animated background elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
    </div>

    {/* Main loading content */}
    <div className="relative z-10 flex flex-col items-center space-y-8">
      {/* Enhanced spinner */}
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600"></div>
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-r-4 border-purple-500 absolute top-0 left-0"></div>
        <div className="animate-ping rounded-full h-20 w-20 border-2 border-purple-400 absolute top-0 left-0 opacity-20"></div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Loading
          <span className="animate-pulse">.</span>
          <span className="animate-pulse delay-200">.</span>
          <span className="animate-pulse delay-400">.</span>
        </h2>
        <p className="text-gray-400 text-sm font-medium">
          Please wait while we prepare everything for you
        </p>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
