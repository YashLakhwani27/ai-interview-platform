import { use, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios"


function Signup(params) {
    const [name , setName] = useState("");
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const navigate = useNavigate()

     const handleSignup = async (e) => {
  e.preventDefault();

  try {
    // ✅ Signup
    await API.post("/signup", { name, email, password });

    // ✅ Login (JSON ONLY)
    const res = await API.post("/login", { email, password });

    // ✅ Save token
    localStorage.setItem("token", res.data.access_token);

    // ✅ Navigate
    navigate("/dashboard");

  } catch (error) {
    console.log("ERROR:", error.response?.data);

    const msg = error.response?.data?.detail;

    if (msg === "Email already registered") {
      alert("⚠ Email already exists. Please login.");
      navigate("/");
    } else {
      alert(msg || "Signup/Login failed");
    }
  }
};
    return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">

      {/* Glow */}
      <div className="absolute w-96 h-96 bg-blue-500 opacity-20 blur-3xl top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl bottom-10 right-10"></div>

      <form
        onSubmit={handleSignup}
        className="backdrop-blur-lg bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl w-96"
      >
        <h2 className="text-3xl text-white text-center mb-6 font-bold">
          Create Account 🚀
        </h2>

        <input
          type="text"
          placeholder="Name"
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded-lg bg-white/10 text-white outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold hover:scale-105 transition">
          Signup
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