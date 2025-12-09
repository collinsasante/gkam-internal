import { useState } from 'react';
import { authService } from '../../services/auth.service';
import logoRed from '../logo_red.png';

declare const Swal: any;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please enter both your email and password',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    setLoading(true);

    try {
      await authService.login(email, password);
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Welcome!',
          text: 'Login successful',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      onLogin();
    } catch (error: any) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Login Failed',
          text: error.message || 'Invalid email or password. Please try again.',
          icon: 'error',
          confirmButtonText: 'Try Again',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please enter your email address',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    setResetLoading(true);

    try {
      await authService.requestPasswordReset(resetEmail);
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Check Your Email',
          html: `
            <p>We've sent a password reset link to:</p>
            <p class="fw-bold">${resetEmail}</p>
            <p class="mt-3">Click the link in your email to reset your password.</p>
            <p class="text-muted mt-2" style="font-size: 0.875rem;">The link will expire in 1 hour. Don't forget to check your spam folder!</p>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      }
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Unable to process password reset request.',
          icon: 'error',
          confirmButtonText: 'Try Again',
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
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
  );
}
