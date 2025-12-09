import { useState } from 'react';
import { authService } from '../../services/auth.service';
import logoRed from '../logo_red.png';

declare const Swal: any;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !fullName) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Missing Information',
          text: 'Please fill in all fields',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    if (password !== confirmPassword) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Password Mismatch',
          text: 'Passwords do not match. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    if (password.length < 6) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Weak Password',
          text: 'Password must be at least 6 characters long',
          icon: 'warning',
          confirmButtonText: 'OK',
        });
      }
      return;
    }

    setLoading(true);

    try {
      const { needsVerification } = await authService.register(email, password, fullName);

      if (needsVerification) {
        // Email verification sent
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Verify Your Email',
            html: `
              <p>We've sent a verification link to:</p>
              <p class="fw-bold">${email}</p>
              <p class="mt-3">Please check your inbox and click the verification link to activate your account.</p>
              <p class="text-muted mt-2" style="font-size: 0.875rem;">Don't forget to check your spam folder!</p>
            `,
            icon: 'info',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
          });
        }
      } else {
        // Account created without verification (fallback)
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Registration Successful!',
            text: 'Your account has been created',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }

      onRegister();
    } catch (error: any) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Registration Failed',
          text: error.message || 'Unable to create account. Please try again.',
          icon: 'error',
          confirmButtonText: 'Try Again',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
