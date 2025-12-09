import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    // Redirect based on the action mode
    if (mode === 'resetPassword' && oobCode) {
      // Redirect to our custom reset password page
      navigate(`/reset-password?oobCode=${oobCode}`);
    } else if (mode === 'verifyEmail' && oobCode) {
      // Redirect to our custom email verification page
      navigate(`/verify-email?oobCode=${oobCode}`);
    } else if (mode === 'recoverEmail' && oobCode) {
      // For email recovery, redirect to login with a message
      navigate('/login');
    } else {
      // Invalid action, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate]);

  // Show loading state while redirecting
  return (
    <div className="auth-page d-flex flex-column flex-root">
      <div className="d-flex flex-column flex-center flex-column-fluid">
        <div className="auth-form-container text-center">
          <h1 className="text-gray-900 fw-bolder mb-5">Redirecting...</h1>
          <p className="text-gray-600 fw-semibold fs-4 mb-8">
            Please wait while we redirect you to the appropriate page.
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
