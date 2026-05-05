import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { signup as signupService } from "../services/authService";

const SignupForm = () => {
  const navigate = useNavigate();

  const initialValues = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const validationSchema = Yup.object({
    username: Yup.string().min(3, "Too short").required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Too short").required("Required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Required"),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      await signupService(values);
      navigate("/login");
    } catch (error) {
      setStatus(error.response?.data?.error || "Signup failed");
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
              name="username"
              type="text"
              placeholder="Username"
              className="input-field"
            />
            <ErrorMessage name="username" component="span" className="error-text" />
          </div>

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

          <div className="form-group">
            <Field
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              className="input-field"
            />
            <ErrorMessage name="confirmPassword" component="span" className="error-text" />
          </div>

          {status && <div className="error-text" style={{textAlign: 'center', marginBottom: '1rem'}}>{status}</div>}

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? "..." : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            )}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default SignupForm;
