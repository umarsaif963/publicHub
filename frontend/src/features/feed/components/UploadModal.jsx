import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createPost } from "../services/postService";
import "../styles/feed.css";

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const validationSchema = Yup.object({
    description: Yup.string().required("Description is required"),
    hashtag: Yup.string().optional(),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    if (!file) {
      setStatus("Please select an image");
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("description", values.description);
    formData.append("hashtag", values.hashtag);

    try {
      await createPost(formData);
      onUploadSuccess();
      onClose();
    } catch (error) {
      setStatus("Upload failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Create Post</h2>

        <Formik
          initialValues={{ description: "", hashtag: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status }) => (
            <Form>
              <div className="file-input-wrapper">
                {preview ? (
                  <img src={preview} alt="Preview" className="upload-preview" onClick={() => setPreview(null)} />
                ) : (
                  <label className="file-label">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Choose an image</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                  </label>
                )}
              </div>

              <div className="form-group">
                <Field
                  name="description"
                  as="textarea"
                  placeholder="What's on your mind?"
                  className="input-field"
                  style={{ minHeight: "100px", resize: "none" }}
                />
                <ErrorMessage name="description" component="span" className="error-text" />
              </div>

              <div className="form-group">
                <Field
                  name="hashtag"
                  type="text"
                  placeholder="#hashtags"
                  className="input-field"
                />
              </div>

              {status && <div className="error-text" style={{ textAlign: 'center' }}>{status}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-upload" disabled={isSubmitting}>
                  {isSubmitting ? "Uploading..." : "Upload"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UploadModal;
