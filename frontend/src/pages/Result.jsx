import { useState , useEffect } from "react";
import { useParams , useNavigate } from "react-router-dom";
import API from "../api/axios"


function Result(params) {
    const {id} = useParams()

    const [result , setResult] = useState(null)
    const navigate = useNavigate()


    const fetchResult = async () => {
      try {
        const res = await API.get(`/result-interview/${id}`);
        setResult(res.data);

      } catch (error) {
        console.log(error);
      }
    }
    useEffect(() => {
      fetchResult();
    } , [])


    if (!result) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black">
        Loading Result...
      </div>
    );
  }

   return (
    <div className="min-h-screen p-8 text-white bg-gradient-to-br from-black via-gray-900 to-gray-800">

      {/* 🎯 Title */}
      <h1 className="text-4xl font-bold mb-6">🎯 Interview Result</h1>

      {/* 🟢 Score Card */}
      <div className="bg-white/10 p-6 rounded-xl mb-6">
        <p className="text-2xl font-semibold">
          Average Score:
          <span className="text-green-400 ml-2">
            {result.average_score} / 10
          </span>
        </p>

        <p className="text-gray-400 mt-2">
          Total Questions: {result.total_questions}
        </p>
      </div>

      {/* 🤖 AI Feedback (if available) */}
      {result.ai_feedback && (
        <div className="bg-white/10 p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">
            🤖 AI Interview Analysis
          </h2>

          <p className="text-green-400 mb-2">
            💪 Strengths: {result.ai_feedback.strengths}
          </p>

          <p className="text-red-400 mb-2">
            ⚠ Weaknesses: {result.ai_feedback.weaknesses}
          </p>

          <p className="text-blue-300 mb-2">
            🗣 Communication: {result.ai_feedback.communication}
          </p>

          <p className="text-yellow-300 mb-2">
            🧠 Technical: {result.ai_feedback.technical}
          </p>

          <p className="text-gray-300 mt-4">
            📌 Final Feedback: {result.ai_feedback.final_feedback}
          </p>
        </div>
      )}

      {/* 📊 Breakdown */}
      <div className="bg-white/10 p-6 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-4">
          📊 Performance Breakdown
        </h2>

        {result.breakdown.map((item, index) => (
          <div
            key={index}
            className="mb-4 p-4 bg-black/40 rounded-lg"
          >
            <p className="text-gray-200 mb-2">
              Q{index + 1}: {item.question}
            </p>

            <p className="text-gray-400 text-sm mb-2">
              Your Answer: {item.answer}
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${item.score * 10}%` }}
                ></div>
              </div>

              <span className="text-green-400 text-sm">
                {item.score}/10
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 🔘 Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Result;