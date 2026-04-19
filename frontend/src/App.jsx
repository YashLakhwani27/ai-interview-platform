import { BrowserRouter , Route , Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import StartInterview from "./pages/StartInterview";
import Result from "./pages/Result";

function App(){
  return (
    <BrowserRouter>
    <Routes>

      <Route path="/" element={<Login />}/>
      <Route path="/signup" element={<Signup />}/>
      <Route path="/dashboard" element=
      {
        <ProtectedRoute> 
          <Dashboard />
        </ProtectedRoute> 
      }
      />
      <Route path="/start" element=
      {
        <ProtectedRoute> 
          <StartInterview />
        </ProtectedRoute> 
      }
      />
      <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
      <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
    </Routes>
    
    </BrowserRouter>
  );
}

export default App;