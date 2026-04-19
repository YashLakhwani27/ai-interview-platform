import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios"

function StartInterview(params) {
    const [role , setRole] = useState("dsa");
    const navigate = useNavigate();

    const handleStart = async () => {
      try {
        const res = await API.post("/start-interview" , {
            role : role,
        });

        const interview_id = res.data.interview_id;

        navigate(`/interview/${interview_id}`);
      } catch (error) {
        console.log(error)
      }

    };

   return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">

    {/* Glow Background */}
    <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl top-10 left-10"></div>
    <div className="absolute w-96 h-96 bg-blue-500 opacity-20 blur-3xl bottom-10 right-10"></div>

    <div className="relative backdrop-blur-lg bg-white/10 border border-white/20 p-10 rounded-2xl shadow-2xl w-[420px]">

      {/* 🔥 Title */}
      <h1 className="text-3xl font-bold text-center mb-2">
        Start Your Interview 🎯
      </h1>

      {/* 🔥 Subtitle */}
      <p className="text-gray-400 text-center mb-6 text-sm">
        Choose your role and begin a real interview experience.
        Get AI feedback, scoring, and improve your skills.
      </p>

      {/* Role Select */}
      <label className="text-sm text-gray-300 mb-2 block">
        Select Interview Role
      </label>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full p-3 mb-6 bg-black border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="dsa">DSA</option>
        <option value="web">Frontend</option>
        <option value="backend">Backend</option>
        <option value="html-css">HTML & CSS</option>
        <option value="js">JavaScript</option>
        <option value="react">React</option>
        <option value="python">Python</option>
        <option value="sql">SQL</option>
      </select>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 p-3 rounded-lg font-semibold transition"
      >
        🚀 Start Interview
      </button>

      {/* 🔥 Extra Hint */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Tip: Choose the role you want to practice for interviews
      </p>

    </div>
  </div>
);
}

export default StartInterview;