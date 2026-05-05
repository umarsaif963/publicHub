import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./features/auth/context/AuthContext";
import LoginPage from "./features/auth/pages/LoginPage";
import SignupPage from "./features/auth/pages/SignupPage";
import FeedPage from "./features/feed/pages/FeedPage";
// import NotificationPage from "./features/notification/pages/NotificationPage";
import MessagePage from "./features/messages/pages/MessagePage";
import ProfilePage from "./features/profile/pages/ProfilePage";

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <LoginPage /> : <Navigate to="/feed" />} 
          />
          <Route 
            path="/signup" 
            element={!user ? <SignupPage /> : <Navigate to="/feed" />} 
          />
          <Route 
            path="/feed" 
            element={user ? <FeedPage /> : <Navigate to="/login" />} 
          />
          {/* <Route 
            path="/notification" 
            element={user ? <NotificationPage /> : <Navigate to="/login" />} 
          /> */}
          <Route 
            path="/messages" 
            element={user ? <MessagePage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile/:userId" 
            element={user ? <ProfilePage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/feed" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;