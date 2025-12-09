# Firebase Authentication Setup Guide

This application now uses Firebase Authentication for secure user login instead of storing passwords in Airtable.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Email/Password Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Click on **Email/Password**
4. Enable the toggle switch for **Email/Password**
5. Click **Save**

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register your app with a nickname (e.g., "GlamPack Web")
6. Copy the Firebase configuration object

## Step 4: Add Firebase Config to .env

1. Open (or create) `/frontend/.env` file
2. Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 5: Add Users to Firebase

You have two options to add users:

### Option A: Manually via Firebase Console

1. Go to **Authentication** > **Users** tab
2. Click **Add user**
3. Enter the employee's email and password
4. Click **Add user**

**Repeat for each employee** (you can bulk import via CSV in Authentication settings)

### Option B: Using Firebase Admin SDK (Backend)

Create a script to import users from your Airtable Employees table. This requires:
- Setting up Firebase Admin SDK
- Reading emails from Airtable
- Creating Firebase users with default passwords
- Sending password reset emails to employees

## Step 6: Test Login

1. Start your dev server: `npm run dev`
2. Try logging in with an employee email and the password you set in Firebase
3. The app will:
   - Authenticate via Firebase
   - Fetch additional employee data (name, role) from Airtable
   - Grant access to the system

## Password Reset Flow

When users click "Forgot Password?":
1. They enter their email
2. Firebase sends a password reset email
3. They click the link in the email
4. Firebase provides a secure password reset page
5. They set a new password

## Security Benefits

✅ **Passwords are never stored in Airtable** - Firebase handles all password encryption
✅ **Built-in security** - Firebase provides brute-force protection, rate limiting, and secure password hashing
✅ **Password reset** - Automatic email-based password recovery
✅ **Account management** - Easy to disable/enable user accounts
✅ **Audit logs** - Firebase tracks login attempts and security events

## Syncing Employees

The system uses **Firebase for authentication** and **Airtable for employee data**:

- **Firebase**: Stores email/password, handles login
- **Airtable**: Stores Full Name, Role, Department, Job Title, etc.

When an employee logs in:
1. Firebase verifies their email/password
2. The app fetches their profile from Airtable using their email
3. User gets access with their role and permissions

## Troubleshooting

**Error: "Firebase config not found"**
- Make sure `.env` file has all Firebase variables
- Restart the dev server after adding env variables

**Error: "Invalid email or password"**
- Verify the user exists in Firebase Authentication
- Check if the email matches exactly (case-insensitive)

**Error: "Too many requests"**
- Firebase has rate limiting - wait a few minutes and try again
- Consider implementing reCAPTCHA for production

## Next Steps

1. Set up Firebase project
2. Add Firebase credentials to `.env`
3. Create users in Firebase Authentication
4. Remove the `Password` field from Airtable Employees table (no longer needed)
5. Test login functionality

---

**Need help?** Check the [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
