import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../services/firebase.config';

declare const Swal: any;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid password reset link');
        setVerifying(false);
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (err: any) {
        setVerifying(false);
        let errorMessage = 'Invalid or expired password reset link.';

        if (err.code === 'auth/invalid-action-code') {
          errorMessage = 'This password reset link is invalid or has already been used.';
        } else if (err.code === 'auth/expired-action-code') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        }

        setError(errorMessage);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oobCode) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', 'Invalid reset link', 'error');
      }
      return;
    }

    // Validation
    if (!newPassword) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', 'Please enter a new password', 'error');
      }
      return;
    }

    if (newPassword.length < 6) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', 'Password must be at least 6 characters long', 'error');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', 'Passwords do not match', 'error');
      }
      return;
    }

    setLoading(true);

    try {
      // Confirm the password reset with the new password
      await confirmPasswordReset(auth, oobCode, newPassword);

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Success!',
          text: 'Your password has been reset successfully. You can now sign in with your new password.',
          icon: 'success',
          confirmButtonText: 'Go to Sign In',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        }).then(() => {
          navigate('/login');
        });
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to reset password. Please try again.';

      if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-action-code') {
        errorMessage = 'This password reset link is invalid or has already been used.';
      } else if (err.code === 'auth/expired-action-code') {
        errorMessage = 'This password reset link has expired. Please request a new one.';
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', errorMessage, 'error');
      }
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-page d-flex flex-column flex-root">
        <div className="d-flex flex-column flex-center flex-column-fluid">
          <div className="auth-form-container text-center">
            <h1 className="text-gray-900 fw-bolder mb-5">Verifying Reset Link</h1>
            <p className="text-gray-600 fw-semibold fs-4 mb-8">
              Please wait while we verify your password reset link...
            </p>
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page d-flex flex-column flex-root">
        <div className="d-flex flex-column flex-center flex-column-fluid">
          <div className="auth-form-container text-center">
            <div className="mb-8">
              <i className="bi bi-x-circle text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h1 className="text-gray-900 fw-bolder mb-5">Invalid Link</h1>
            <p className="text-gray-600 fw-semibold fs-4 mb-8">
              {error}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page d-flex flex-column flex-root">
      <div className="d-flex flex-column flex-center flex-column-fluid">
        <div className="auth-form-container">
          <form onSubmit={handleSubmit} className="form w-100">
            <div className="text-center mb-8">
              <h1 className="text-gray-900 fw-bolder mb-3">Reset Password</h1>
              <div className="text-gray-500 fw-semibold fs-6">
                Enter a new password for {email}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">New Password</label>
              <div className="position-relative">
                <input
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-icon position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none' }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-4`}></i>
                </button>
              </div>
              <div className="form-text">Password must be at least 6 characters</div>
            </div>

            <div className="mb-8">
              <label className="form-label">Confirm New Password</label>
              <div className="position-relative">
                <input
                  className="form-control"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-icon position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'none', border: 'none' }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} fs-4`}></i>
                </button>
              </div>
            </div>

            <div className="d-grid mb-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="link-primary"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                disabled={loading}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
