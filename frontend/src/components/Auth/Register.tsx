import { useState } from 'react';
import { authService } from '../../services/auth.service';
import logoRed from '../logo_red.png';
import Modal from '../Common/Modal';



interface RegisterProps {
  onRegister: () => void;
  onBackToLogin: () => void;
}

export default function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal States
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !fullName) {
      showFeedback('error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showFeedback('error', 'Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { needsVerification } = await authService.register(email, password, fullName);

      if (needsVerification) {
        setIsVerifyModalOpen(true);
      } else {
        setIsSuccessModalOpen(true);
      }
    } catch (error: any) {
      showFeedback('error', error.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClose = () => {
    setIsVerifyModalOpen(false);
    onBackToLogin(); // Redirect to login after showing verification message
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    onRegister(); // Auto login or redirect to dashboard
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
            <h1>Create Your Account</h1>
            <div className="text-helper mt-2">
              Register to access the Customer Service System
            </div>
          </div>

          {/* Register Form */}
          <form className="form w-100" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                placeholder="Enter your company email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <div className="text-helper mt-2">
                Use your email registered in the HR system
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Create a password (min. 6 characters)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <i className="ki-duotone ki-arrow-right fs-3 ms-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                    </i>
                  </>
                )}
              </button>
            </div>

            <div className="auth-footer text-center">
              <span className="text-helper">Already have an account? </span>
              <button
                type="button"
                className="link-primary"
                onClick={onBackToLogin}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="text-center mt-5">
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>© 2024 GlamPack</span>
          </div>
        </div>
      </div>

      {/* Verify Email Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={handleVerifyClose}
        title="Verify Your Email"
        footer={<button className="btn btn-primary" onClick={handleVerifyClose}>OK</button>}
      >
        <div className="d-flex flex-column gap-3 text-center">
          <i className="ki-duotone ki-sms fs-5x text-info mb-2">
            <span className="path1"></span><span className="path2"></span>
          </i>
          <p>We've sent a verification link to:</p>
          <p className="fw-bold fs-5">{email}</p>
          <p className="text-muted">Please check your inbox and click the verification link to activate your account.</p>
          <div className="alert alert-dismissible bg-light-info border border-info border-dashed d-flex flex-column flex-sm-row w-100 p-5 mb-10">
            <div className="d-flex flex-column pe-0 pe-sm-10">
              <h5 className="mb-1">Note</h5>
              <span>Don't forget to check your spam folder!</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Registration Successful!"
        footer={<button className="btn btn-primary" onClick={handleSuccessClose}>Start Exploring</button>}
      >
        <div className="d-flex flex-column gap-3 text-center">
          <i className="ki-duotone ki-check-circle fs-5x text-success mb-2">
            <span className="path1"></span><span className="path2"></span>
          </i>
          <p className="fw-bold fs-4">Welcome, {fullName}!</p>
          <p className="text-muted">Your account has been successfully created.</p>
        </div>
      </Modal>
    </>
  );
}
