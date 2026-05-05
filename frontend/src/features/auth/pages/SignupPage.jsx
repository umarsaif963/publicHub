import { Link } from "react-router-dom";
import SignupForm from "../components/SignupForm";
import "../styles/auth.css";

const SignupPage = () => {
  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <h1 className="auth-title">Signup</h1>
        <SignupForm />
        <div className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
