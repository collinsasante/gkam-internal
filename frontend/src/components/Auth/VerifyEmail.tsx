import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../../services/firebase.config';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const oobCode = searchParams.get('oobCode');

      if (!oobCode) {
        setError('Invalid verification link');
        setVerifying(false);
        return;
      }

      try {
        // Apply the email verification code
        await applyActionCode(auth, oobCode);
        setVerifying(false);

        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);

      } catch (err: any) {
        setVerifying(false);
        let errorMessage = 'Failed to verify email. The link may be invalid or expired.';

        if (err.code === 'auth/invalid-action-code') {
          errorMessage = 'This verification link is invalid or has already been used.';
        } else if (err.code === 'auth/expired-action-code') {
          errorMessage = 'This verification link has expired. Please request a new one.';
        }

        setError(errorMessage);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (verifying) {
    return (
      <div className="auth-page d-flex flex-column flex-root">
        <div className="d-flex flex-column flex-center flex-column-fluid">
          <div className="auth-form-container text-center">
            <h1 className="text-gray-900 fw-bolder mb-5">Verifying Your Email</h1>
            <p className="text-gray-600 fw-semibold fs-4 mb-8">
              Please wait while we verify your email address...
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
            <h1 className="text-gray-900 fw-bolder mb-5">Verification Failed</h1>
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
        <div className="auth-form-container text-center">
          <div className="mb-8">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="text-gray-900 fw-bolder mb-5">Email Verified!</h1>
          <p className="text-gray-600 fw-semibold fs-4 mb-8">
            Your email has been successfully verified. Redirecting to sign in...
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Sign In Now
          </button>
        </div>
      </div>
    </div>
  );
}
