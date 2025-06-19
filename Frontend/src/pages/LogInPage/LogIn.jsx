import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LogIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/app/dashboard");
    console.log("Login attempt:", { email, password });
  };

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 w-full p-6 z-10">
        <h1 className="text-3xl font-medium tracking-widest text-gray-400">
          CONTEXTNET
        </h1>
      </nav>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-7xl grid lg:grid-cols-3 gap-16 items-center">
          {/* Left Side - Branding and CTA */}
          <div className="lg:col-span-2 text-white space-y-8">
            <div className="space-y-2">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                WELCOME BACK TO
              </h2>
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  CONTEXTNET
                </span>{" "}
                <span className="text-white">COMMUNITY</span>
              </h2>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  LOG
                </span>{" "}
                <span className="text-white">IN</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Log in with{" "}
                <span className="text-white font-medium">email address</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email :"
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-r from-purple-600 to-blue-600 border-0 rounded-lg text-white placeholder-gray-200 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password :"
                  className="w-full pl-12 pr-4 py-4 bg-gradient-to-r from-purple-600 to-blue-600 border-0 rounded-lg text-white placeholder-gray-200 focus:placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 hover:cursor-pointer mt-6"
              >
                Log in
              </button>

              {/* Sign up link */}
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <a
                    href="/signup"
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
