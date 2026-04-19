import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios"


function Login(params) {
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault()

        try {
            const res = await API.post("/login" , {email , password})

            localStorage.setItem("token" , res.data.access_token);
            navigate("/dashboard")
        } catch (error) {
            alert("Invalid credentials")
        }
    };

    return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">

      {/* Glow Background */}
      <div className="absolute w-96 h-96 bg-purple-600 opacity-20 rounded-full blur-3xl top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl bottom-10 right-10"></div>

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-96"
      >
        {/* Title */}
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          AI Interview 🚀
        </h2>

        <p className="text-gray-300 text-center mb-6 text-sm">
          Practice. Improve. Get hired.
        </p>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded-lg bg-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Button */}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:scale-105 transition duration-300 shadow-lg"
        >
          Login
        </button>

        {/* Footer */}
        <p className="text-gray-400 text-sm text-center mt-6">
          Don’t have an account?{" "}
          <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate("/signup")}>
            Signup
          </span>
        </p>
      </form>
    </div>
  );
}

export default Login;