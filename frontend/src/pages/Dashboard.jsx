import { useEffect , useState } from "react";
import API from "../api/axios"
import { useNavigate } from "react-router-dom";
import { useRef } from "react";

function Dashboard() {
  const [data , setData] = useState(null);
  const navigate = useNavigate()
  const [history , setHistory] = useState([])
  const [showLogoutModal , setShowLogoutModal] = useState(false)
  const [file , setFile] = useState(null);
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);
  const [selectedFileName , setSelectedFileName] = useState("");

  // 🔥 Upload Resume
 const handleUpload = async () => {
  if (!fileRef.current) {
    alert("Please select file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileRef.current);

  try {
    const res = await API.post("/upload-resume", formData);

    // alert("Skills detected: " + res.data.skills);

    // 🔥 AUTO REDIRECT TO INTERVIEW
    navigate(`/interview/${res.data.interview_id}`);

  } catch (err) {
    console.log(err.response?.data);
  }
};

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/dashboard");
        setData(res.data);
      } catch (error) {
        console.log(error)
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await API.get("/interview-history")
        setHistory(res.data);
      } catch (error) {
        console.log(error)
      }
    };

    fetchDashboard();
    fetchHistory();
  } ,[])

  if(!data){
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black">
        Loading Dashboard...
      </div>
    );
  }
return (
  <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden">

    {/* Background */}
    <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl top-10 left-10"></div>
    <div className="absolute w-96 h-96 bg-blue-500 opacity-20 blur-3xl bottom-10 right-10"></div>

    <div className="relative z-10 p-8">

      {/* 🔥 UPDATED HEADER */}
      <div className="flex items-center justify-between mb-8">

        {/* LEFT */}
        <div>
          <h1 className="text-4xl font-bold">Dashboard 📊</h1>

          <p className="text-gray-400 mt-1 text-xl mt-4 ">
            Welcome,{" "}
            <span className="text-purple-400 font-semibold text-xl">
              {data.user_name}
            </span>{" "}
            👋
          </p>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/start")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
          >
            + Start Interview
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg"
          >
            Logout 🚪
          </button>
        </div>
      </div>

      {/* 🔥 Resume Upload */}
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-2xl mb-8 text-center">

        <h2 className="text-2xl font-bold mb-2">
          AI Resume-Based Interview 🚀
        </h2>

        <p className="text-gray-400 mb-6">
          Upload your resume and get personalized interview questions based on your skills.
        </p>

        {/* Upload Box */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-gray-500 rounded-xl p-10 cursor-pointer hover:border-purple-400 transition"
        >
          <p className="text-lg">📄 Click to Upload Resume</p>
          <p className="text-sm text-gray-400 mt-1">
            Only PDF supported
          </p>
        </div>

        {/* Hidden Input */}
        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              fileRef.current = file;
              setSelectedFileName(file.name);
            }
          }}
        />

        {/* File Name */}
        {selectedFileName && (
          <p className="mt-4 text-green-400">
            ✅ {selectedFileName}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={!fileRef.current}
          className={`mt-6 px-6 py-3 rounded-lg ${
            fileRef.current
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          Start AI Interview 🚀
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/10 p-6 rounded-2xl">
          <h2>Total Questions</h2>
          <p className="text-3xl">{data.total_questions}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl">
          <h2>Total Answers</h2>
          <p className="text-3xl">{data.total_answers}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl">
          <h2>Average Score</h2>
          <p className="text-3xl text-blue-400">
            {data.average_score ? data.average_score.toFixed(1) : "0"}
          </p>
        </div>
      </div>

      {/* Recent Answers */}
      <div className="bg-white/10 p-6 rounded-2xl mb-10">
        <h2 className="text-2xl mb-6">Recent Answers 🧠</h2>

        {data.recent_answers?.length === 0 ? (
          <p>No answers yet</p>
        ) : (
          data.recent_answers.map((ans) => (
            <div key={ans.id} className="border-b py-3">
              <p>{ans.answer_text}</p>
              <p className="text-blue-400">Score: {ans.score}/10</p>
            </div>
          ))
        )}
      </div>

      {/* History */}
      <div className="bg-white/10 p-6 rounded-2xl">
        <h2 className="text-2xl mb-6">📜 Interview History</h2>

        {history.length === 0 ? (
          <p>No interviews yet</p>
        ) : (
          history.map((item) => (
            <div
              key={item.interview_id}
              className="border-b py-4 flex justify-between"
            >
              <div>
                <p>{item.role}</p>
                <p className="text-sm text-gray-400">{item.date}</p>
              </div>

              <button
                onClick={() => navigate(`/result/${item.interview_id}`)}
                className="text-purple-400"
              >
                View →
              </button>
            </div>
          ))
        )}
      </div>
    </div>

    {/* 🔥 Logout Modal FIXED */}
{showLogoutModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl w-80 text-center">

      <h2 className="text-xl font-semibold mb-4 text-white">
        Confirm Logout
      </h2>

      <p className="text-gray-400 mb-6">
        Are you sure you want to logout?
      </p>

      <div className="flex justify-center gap-4">

        {/* Cancel */}
        <button
          onClick={() => setShowLogoutModal(false)}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
        >
          Cancel
        </button>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          Yes, Logout
        </button>

      </div>
    </div>
  </div>
)}
  </div>
);
}

export default Dashboard;