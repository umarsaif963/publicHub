import { useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { login as loginService } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

const LoginForm = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Too short").required("Required"),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const data = await loginService(values);
      login(data.user, data.token);
      navigate("/feed");
    } catch (error) {
      setStatus(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, status }) => (
        <Form>
          <div className="form-group">
            <Field
              name="email"
              type="email"
              placeholder="Email"
              className="input-field"
            />
            <ErrorMessage name="email" component="span" className="error-text" />
          </div>

          <div className="form-group">
            <Field
              name="password"
              type="password"
              placeholder="Password"
              className="input-field"
            />
            <ErrorMessage name="password" component="span" className="error-text" />
          </div>

          {status && <div className="error-text" style={{textAlign: 'center', marginBottom: '1rem'}}>{status}</div>}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "..." : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
