import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import "../styles/auth.css";

const LoginPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h1 className="auth-title">Login</h1>
        <LoginForm />
        <div className="auth-footer">
          Don't have an account? 
          <Link to="/signup" className="auth-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
