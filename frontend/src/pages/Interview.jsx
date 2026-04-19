import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showQuitModal , setShowQuitModal] = useState(false)

  const recognitionRef = useRef(null);

  // 🎤 Speech Setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    recognitionRef.current?.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // 🔥 Fetch Question
  const fetchQuestion = async () => {
    try {
      setLoading(true);

      const res = await API.post(
        `/generate_questions?interview_id=${id}`
      );

      setQuestion(res.data);
      setAnswer("");
      setFeedback(null); // 🔥 reset feedback for new question

      // ⏱ Per-question timer (10 minutes = 600 sec)
      setTimeLeft(600);

    } catch (err) {
      console.log("ERROR:", err.response?.data);

      const msg = err.response?.data?.detail;

      if (msg === "Interview completed" || msg === "Time is up") {
        navigate(`/result/${id}`);
      }

    } finally {
      setLoading(false);
    }
  };

  const handleQuitInterview = async () => {
    try {
      await API.post(`/quit-interview/${id}`);
    } catch (error) {
      console.log(error);
    }
    navigate(`/result/${id}`);
  };
  
  let tabswitch = 0;

  useEffect(() => {
    let tabswitch = 0;

    const handleVisiblityChange = () => {
      if(document.hidden){
        tabswitch++;

        if(tabswitch == 1){
          alert("⚠ Warning: Do not switch tabs during interview")
        }else{
          alert("❌ Interview ended due to tab switching")
          handleQuitInterview();
        }
      }
    }
      document.addEventListener("visibilitychange" , handleVisiblityChange);

      return () => {
        document.removeEventListener("visibilitychange" , handleVisiblityChange);
      };
    
  } , []);

  // 🔥 Submit Answer
  const handleSubmit = async () => {
    try {
      const res = await API.post("/submit-answer", {
        question_id: question.question_id,
        answer: answer,
        interview_id: id,
      });

      setFeedback(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  // Load first question
  useEffect(() => {
    fetchQuestion();
  }, []);

  // ⏱ Timer Logic
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          alert("⏱ Time is up!");
          navigate(`/result/${id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black">
        Loading Question...
      </div>
    );
  }

  if (!question) return null;
  return (
    <div className="min-h-screen p-8 text-white bg-gradient-to-br from-black via-gray-900 to-gray-800">

      {/* Heading */}
      <h1 className="text-3xl font-bold mb-4">
        Question {question.question_number} / {question.total_questions}
      </h1>

      {/* Timer */}
      {timeLeft !== null && (
        <p className="text-red-400 text-lg mb-4 font-semibold">
          ⏱ Time Left: {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </p>
      )}
  
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${
                (question.question_number / question.total_questions) * 100
              }%`,
            }}
          ></div>
        </div>

        <p className="text-sm text-gray-400 mt-1">
          {Math.round(
            (question.question_number / question.total_questions) * 100
          )}% completed
        </p>
      </div>

      {/* Question */}
      <div className="bg-white/10 p-6 rounded-xl mb-6">
        {question.question_text}
      </div>

      {/* Mic Status */}
      <p className="mb-2 text-gray-400">
        {listening ? "🎤 Listening..." : "Mic Off"}
      </p>

      {/* Answer Input */}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full p-4 bg-black border border-gray-600 rounded-lg mb-4"
        rows={6}
      />

      {/* 🎤 Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={startListening}
          className="px-4 py-2 bg-green-600 rounded-lg"
        >
          🎤 Start
        </button>

        <button
          onClick={stopListening}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          ⛔ Stop
        </button>
      </div>
          <div className="flex justify-between items-center mb-4">
  <h1 className="text-3xl font-bold">
    Question {question.question_number} / {question.total_questions}
  </h1>

  <button
    onClick={() => setShowQuitModal(true)}
    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
  >
    Quit ❌
  </button>
</div>
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!!feedback}
        className={`px-6 py-3 rounded-lg ${
          feedback
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Submit Answer
      </button>

      {/* ✅ Feedback Section */}
      {feedback && (
  <div className="bg-white/10 p-4 rounded-lg mb-4 border border-gray-600">

    <p className="text-green-400 font-semibold">
      ✅ Score: {feedback.score}/10
    </p>

    <p className="text-gray-300 mt-2">
      💬 {feedback.feedback}
    </p>

    {/* 🔥 NEW FEATURE */}
    <div className="mt-4 p-3 bg-black/40 rounded-lg border border-gray-700">
      <p className="text-yellow-400 font-semibold mb-1">
        💡 Better Answer:
      </p>
      <p className="text-gray-300 text-sm">
        {feedback.ideal_answer}
      </p>
    </div>

    {/* BUTTON LOGIC */}
    {question.question_number < question.total_questions ? (
      <button
        onClick={() => {
          setFeedback(null);
          setAnswer("");
          fetchQuestion();
        }}
        className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer"
      >
        Next Question →
      </button>
    ) : (
      <button
        onClick={() => navigate(`/result/${id}`)}
        className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg cursor-pointer"
      >
        Finish Interview ✅
      </button>
    )}

  </div>
)}
{showQuitModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-80 text-center">

      <h2 className="text-xl font-semibold mb-4">
        Quit Interview?
      </h2>

      <p className="text-gray-400 mb-6">
        Your remaining questions will be marked as 0.
      </p>

      <div className="flex justify-center gap-4">

        <button
          onClick={() => setShowQuitModal(false)}
          className="px-4 py-2 bg-gray-600 rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            try {
              await API.post(`/quit-interview/${id}`);
              navigate(`/result/${id}`);
            } catch (err) {
              console.log(err);
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Yes, Quit
        </button>

      </div>
    </div>
  </div>
)}
    </div>
    
  );
}

export default Interview;