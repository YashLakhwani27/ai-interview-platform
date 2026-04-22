import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Result() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const fetchResult = async () => {
    try {
      const res = await API.get(`/result-interview/${id}`);
      setResult(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchResult();
  }, []);

  if (!result) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  // ✅ Score color logic
  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBarColor = (score) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return "Excellent 🌟";
    if (score >= 5) return "Good 👍";
    if (score >= 3) return "Needs Work 📚";
    return "Poor ❌";
  };

  return (
    <div className="min-h-screen p-8 text-white bg-gradient-to-br from-black via-gray-900 to-gray-800">

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2">🎯 Interview Result</h1>
      <p className="text-gray-400 mb-6">Here's how you performed in this session</p>

      {/* Score Card */}
      <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Average Score</p>
            <p className={`text-5xl font-bold ${getScoreColor(result.average_score)}`}>
              {result.average_score}
              <span className="text-2xl text-gray-400">/10</span>
            </p>
            <p className={`mt-2 font-semibold ${getScoreColor(result.average_score)}`}>
              {getScoreLabel(result.average_score)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Questions</p>
            <p className="text-3xl font-bold text-white">{result.total_questions}</p>
          </div>
        </div>
      </div>

      {/* 🤖 AI Feedback */}
      {result.ai_feedback && (
        <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/10">
          <h2 className="text-xl font-bold mb-5">🤖 AI Interview Analysis</h2>

          <div className="grid grid-cols-1 gap-4">

            {/* Strengths */}
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
              <p className="text-green-400 font-semibold mb-1">💪 Strengths</p>
              <p className="text-gray-300 text-sm">
                {result.ai_feedback.strengths || "No strengths detected"}
              </p>
            </div>

            {/* Weaknesses */}
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 font-semibold mb-1">⚠️ Areas to Improve</p>
              <p className="text-gray-300 text-sm">
                {result.ai_feedback.weaknesses || "No weaknesses detected"}
              </p>
            </div>

            {/* Communication */}
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <p className="text-blue-400 font-semibold mb-1">🗣️ Communication</p>
              <p className="text-gray-300 text-sm">
                {result.ai_feedback.communication || "No communication feedback"}
              </p>
            </div>

            {/* Technical */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-1">🧠 Technical Knowledge</p>
              <p className="text-gray-300 text-sm">
                {result.ai_feedback.technical || "No technical feedback"}
              </p>
            </div>

            {/* Final Feedback */}
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg">
              <p className="text-purple-400 font-semibold mb-1">📌 Final Recommendation</p>
              <p className="text-gray-300 text-sm">
                {result.ai_feedback.final_feedback || "No final feedback"}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 📊 Performance Breakdown */}
      <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/10">
        <h2 className="text-xl font-bold mb-5">📊 Performance Breakdown</h2>

        {result.breakdown.map((item, index) => (
          <div key={index} className="mb-5 p-4 bg-black/40 rounded-lg border border-gray-700">

            {/* Question */}
            <p className="text-white font-semibold mb-2">
              Q{index + 1}: {item.question}
            </p>

            {/* Answer */}
            <div className="bg-white/5 p-3 rounded-lg mb-3">
              <p className="text-gray-400 text-xs mb-1">Your Answer:</p>
              <p className="text-gray-300 text-sm">
                {item.answer || "No answer provided"}
              </p>
            </div>

            {/* Score Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(item.score)}`}
                  style={{ width: `${item.score * 10}%` }}
                ></div>
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(item.score)}`}>
                {item.score}/10
              </span>
              <span className={`text-xs ${getScoreColor(item.score)}`}>
                {getScoreLabel(item.score)}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer font-semibold"
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => navigate("/start-interview")}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer font-semibold"
        >
          New Interview 🚀
        </button>
      </div>
    </div>
  );
}

export default Result;