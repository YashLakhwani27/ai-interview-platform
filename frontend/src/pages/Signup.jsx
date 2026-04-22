import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // ✅ Frontend validation
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // ✅ Signup
      await API.post("/signup", { name, email, password });

      // ✅ Auto Login after signup
      const res = await API.post("/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");

    } catch (error) {
      const msg = error.response?.data?.detail;

      if (msg === "Email already registered") {
        setError("⚠️ Email already exists. Please login instead.");
      } else {
        setError(msg || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="absolute w-96 h-96 bg-blue-500 opacity-20 blur-3xl top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl bottom-10 right-10"></div>

      <form
        onSubmit={handleSignup}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-96"
      >
        <h2 className="text-3xl text-white text-center mb-2 font-bold">
          Create Account 🚀
        </h2>

        <p className="text-gray-300 text-center mb-6 text-sm">
          Start your interview prep today
        </p>

        {/* ✅ Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
            {/* ✅ If email exists, show login link */}
            {error.includes("already exists") && (
              <span
                onClick={() => navigate("/")}
                className="text-blue-400 cursor-pointer hover:underline ml-1"
              >
                Go to Login →
              </span>
            )}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          autoComplete="name"
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          autoComplete="new-password"
          maxLength={72}
          className="w-full p-3 mb-6 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Signup"}
        </button>

        <p className="text-gray-400 text-center mt-4 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/")}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default Signup;