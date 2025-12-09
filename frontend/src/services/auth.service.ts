import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase.config';
import { hrEmployeeService } from './airtable.service';
import type { HREmployee } from '../types/airtable.types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

class AuthService {
  private readonly STORAGE_KEY = 'glampack_auth_user';

  // Authenticate user with Firebase email and password
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      console.log('Firebase login successful:', firebaseUser.email);

      // Fetch employee data from Airtable to get additional info (name, role, etc.)
      const employees = await hrEmployeeService.getAll();
      const employeeData = employees.find(
        (emp: HREmployee) => emp.fields['Email']?.toLowerCase() === email.toLowerCase()
      );

      // Create auth user object
      const authUser: AuthUser = {
        id: firebaseUser.uid,
        name: employeeData?.fields['Full Name'] || firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        role: employeeData?.fields['Role'] || 'Employee',
      };

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));

      return authUser;
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide user-friendly error messages
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  }

  // Register new employee with Firebase
  async register(email: string, password: string, fullName: string): Promise<{ needsVerification: boolean }> {
    try {
      // Check if email exists in Airtable Employees table
      const employees = await hrEmployeeService.getAll();
      const employeeData = employees.find(
        (emp: HREmployee) => emp.fields['Email']?.toLowerCase() === email.toLowerCase()
      );

      if (!employeeData) {
        throw new Error('Email not found in employee records. Please contact HR.');
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name in Firebase
      await updateProfile(firebaseUser, {
        displayName: fullName
      });

      console.log('Registration successful:', firebaseUser.email);

      // Send email verification
      try {
        const actionCodeSettings = {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        };
        await sendEmailVerification(firebaseUser, actionCodeSettings);
        console.log('Verification email sent to:', firebaseUser.email);

        // Sign out the user until they verify their email
        await signOut(auth);

        return { needsVerification: true };
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError);
        // If verification email fails, still allow registration to proceed

        // Create auth user object
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          name: employeeData.fields['Full Name'] || fullName,
          email: firebaseUser.email || '',
          role: employeeData.fields['Role'] || 'Employee',
        };

        // Store in localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authUser));

        return { needsVerification: false };
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Provide user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.message.includes('employee records')) {
        throw error;
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  // Request password reset via Firebase
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log('Password reset email sent to:', email);
    } catch (error: any) {
      console.error('Password reset error:', error);

      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else {
        throw new Error('Unable to send password reset email. Please try again.');
      }
    }
  }

  // Subscribe to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Fetch employee data from Airtable
        const employees = await hrEmployeeService.getAll();
        const employeeData = employees.find(
          (emp: HREmployee) => emp.fields['Email']?.toLowerCase() === firebaseUser.email?.toLowerCase()
        );

        const authUser: AuthUser = {
          id: firebaseUser.uid,
          name: employeeData?.fields['Full Name'] || firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: employeeData?.fields['Role'] || 'Employee',
        };

        callback(authUser);
      } else {
        callback(null);
      }
    });
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current logged-in user
  getCurrentUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr) as AuthUser;
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const authService = new AuthService();
