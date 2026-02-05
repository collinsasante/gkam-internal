import { useState } from 'react';
import { authService } from '../../services/auth.service';
import logoRed from '../logo_red.png';
import Modal from '../Common/Modal';



interface LoginProps {
  onLogin: () => void;
  onShowRegister?: () => void;
}

export default function Login({ onLogin, onShowRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Modal State
  const [isResetSuccessOpen, setIsResetSuccessOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showFeedback('error', 'Please enter both your email and password');
      return;
    }

    setLoading(true);

    try {
      await authService.login(email, password);
      showFeedback('success', 'Signed in successfully');
      onLogin();
    } catch (error: any) {
      showFeedback('error', error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      showFeedback('error', 'Please enter your email address');
      return;
    }

    setResetLoading(true);

    try {
      await authService.requestPasswordReset(resetEmail);
      setIsResetSuccessOpen(true);
      setShowForgotPassword(false);
      // Keep resetEmail populated if we want to show it in the modal, or clear it. 
      // The modal uses it, so clear it AFTER modal closes or just leave it.
      // setResetEmail(''); 
    } catch (error: any) {
      showFeedback('error', error.message || 'Unable to process password reset request.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      {/* Feedback Alert */}
      {feedback.type && (
        <div
          className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-5`}
          style={{ zIndex: 9999, minWidth: '300px' }}
        >
          {feedback.message}
        </div>
      )}
      <div className="auth-page d-flex align-items-center justify-content-center">
        <div className="auth-form-container">
          {/* Logo */}
          <div className="auth-logo text-center mb-10">
            <img src={logoRed} alt="GlamPack" style={{ height: '70px', width: 'auto' }} className="mb-4" />
            {!showForgotPassword ? (
              <>
                <h1>Sign In</h1>
                <div className="text-helper mt-2">
                  Customer Service Management System
                </div>
              </>
            ) : (
              <>
                <h1>Forgot Password?</h1>
                <div className="text-helper mt-2">
                  Enter your email to reset your password
                </div>
              </>
            )}
          </div>

          {/* Login Form */}
          {!showForgotPassword ? (
            <form className="form w-100" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <div className="text-end mt-2">
                  <button
                    type="button"
                    className="link-primary"
                    onClick={() => setShowForgotPassword(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="d-grid mt-5 mb-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <i className="ki-duotone ki-arrow-right fs-3 ms-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                    </>
                  )}
                </button>
              </div>

              <div className="auth-footer text-center">
                <span className="text-helper">Don't have an account? </span>
                {onShowRegister && (
                  <button
                    type="button"
                    className="link-primary"
                    onClick={onShowRegister}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    Sign Up
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* Forgot Password Form */
            <div className="w-100">
              <form className="form w-100" onSubmit={handleForgotPassword}>
                <div className="mb-4">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={resetLoading}
                  />
                </div>

                <div className="d-flex gap-3 mt-5">
                  <button
                    type="submit"
                    className="btn btn-primary flex-fill"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-light flex-fill"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="text-center mt-5">
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>© 2024 GlamPack</span>
          </div>
        </div>
      </div>

      {/* Reset Success Modal */}
      <Modal
        isOpen={isResetSuccessOpen}
        onClose={() => setIsResetSuccessOpen(false)}
        title="Check Your Email"
        footer={<button className="btn btn-primary" onClick={() => setIsResetSuccessOpen(false)}>OK</button>}
      >
        <div className="d-flex flex-column gap-3 text-center">
          <i className="ki-duotone ki-sms fs-5x text-primary mb-2">
            <span className="path1"></span><span className="path2"></span>
          </i>
          <p>We've sent a password reset link to:</p>
          <p className="fw-bold fs-5">{resetEmail}</p>
          <p className="text-muted">Click the link in your email to reset your password.</p>
          <div className="alert alert-dismissible bg-light-warning border border-warning border-dashed d-flex flex-column flex-sm-row w-100 p-5 mb-10">
            <div className="d-flex flex-column pe-0 pe-sm-10">
              <h5 className="mb-1">Note</h5>
              <span>The link will expire in 1 hour. Don't forget to check your spam folder!</span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
