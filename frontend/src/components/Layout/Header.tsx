import { useState, useEffect } from 'react';
import type { AuthUser } from '../../services/auth.service';
import { notificationService } from '../../services/notification.service';
import type { Notification } from '../../services/notification.service';
import Modal from '../Common/Modal';



interface HeaderProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export default function Header({ currentUser, onLogout, onToggleSidebar }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  // Form States
  const [settingsForm, setSettingsForm] = useState({
    darkMode: true,
    emailNotifications: false,
    autoRefresh: true,
    language: 'English'
  });

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Initial fetch of unread count
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const notifs = await notificationService.getNotifications();
      const unread = notificationService.getUnreadCount(notifs);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const handleNotificationsClick = async () => {
    setIsNotificationsOpen(true);
    setIsLoadingNotifications(true);
    try {
      const notifs = await notificationService.getNotifications();
      setNotifications(notifs);
      const unread = notificationService.getUnreadCount(notifs);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsSubmit = () => {
    // Save settings logic here (e.g., save to local storage or API)
    console.log('Settings saved:', settingsForm);
    setIsSettingsOpen(false);
    showFeedback('success', 'Settings saved successfully');
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };

  const handleEditProfileClick = () => {
    setProfileForm({
      name: currentUser?.name || '',
      phone: '' // You might want to fetch this if available
    });
    setIsProfileOpen(false);
    setIsEditProfileOpen(true);
  };

  const handleEditProfileSubmit = () => {
    if (!profileForm.name) {
      showFeedback('error', 'Name is required');
      return;
    }
    // Update profile logic here
    console.log('Profile updated:', profileForm);
    setIsEditProfileOpen(false);
    setIsProfileOpen(true);
    showFeedback('success', 'Profile updated');
  };

  const handleChangePasswordClick = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsProfileOpen(false);
    setIsChangePasswordOpen(true);
  };

  const handleChangePasswordSubmit = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showFeedback('error', 'All fields are required');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showFeedback('error', 'New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showFeedback('error', 'Passwords do not match');
      return;
    }

    // Change password logic here
    console.log('Password changed');
    setIsChangePasswordOpen(false);
    setIsProfileOpen(true);
    showFeedback('success', 'Password changed successfully');
  };

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    onLogout();
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
      <div id="kt_app_header" className="app-header">
        <div className="app-container container-fluid d-flex align-items-stretch justify-content-between">
          <div className="d-flex align-items-center d-lg-none ms-n3 me-1 me-md-2" title="Show sidebar menu">
            <button
              className="btn btn-icon btn-active-color-primary w-35px h-35px"
              id="kt_app_sidebar_mobile_toggle"
              onClick={onToggleSidebar}
            >
              <i className="ki-duotone ki-abstract-14 fs-1">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
            </button>
          </div>
          <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
            <a href="#" className="d-lg-none">
              <div className="symbol symbol-30px">
                <div className="symbol-label bg-primary">
                  <i className="ki-duotone ki-shop fs-4 text-white">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                    <span className="path5"></span>
                  </i>
                </div>
              </div>
            </a>
          </div>

          <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
            <div className="app-header-menu app-header-mobile-drawer align-items-stretch" data-kt-drawer="true" data-kt-drawer-name="app-header-menu" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="250px" data-kt-drawer-direction="end" data-kt-drawer-toggle="#kt_app_header_menu_toggle" data-kt-swapper="true" data-kt-swapper-mode="{default: 'append', lg: 'prepend'}" data-kt-swapper-parent="{default: '#kt_app_body', lg: '#kt_app_header_wrapper'}">
              <div className="menu menu-rounded menu-column menu-lg-row my-5 my-lg-0 align-items-stretch fw-semibold px-2 px-lg-0" id="kt_app_header_menu" data-kt-menu="true">
                <div className="menu-item me-0 me-lg-2">
                  <span className="menu-link">
                    <span className="menu-title fw-bold fs-3 text-gray-900">Customer Service</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="app-navbar flex-shrink-0">
              <div className="app-navbar-item ms-1 ms-md-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="position-relative">
                    <button
                      className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px"
                      title="Notifications"
                      onClick={handleNotificationsClick}
                    >
                      <i className="ki-duotone ki-notification-bing fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                      </i>
                    </button>
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge badge-circle badge-primary"
                        style={{ fontSize: '10px', padding: '4px 6px' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px"
                    title="Settings"
                    onClick={handleSettingsClick}
                  >
                    <i className="ki-duotone ki-setting-2 fs-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                    </i>
                  </button>
                  <button
                    className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px"
                    title="User Profile"
                    onClick={handleProfileClick}
                  >
                    <i className="ki-duotone ki-profile-circle fs-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                    </i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title={`Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ''}`}
        footer={<button className="btn btn-light" onClick={() => setIsNotificationsOpen(false)}>Close</button>}
      >
        {isLoadingNotifications ? (
          <div className="d-flex justify-content-center p-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-5">
            <i className="ki-duotone ki-notification-bing fs-5x text-muted mb-3">
              <span className="path1"></span><span className="path2"></span><span className="path3"></span>
            </i>
            <div className="text-muted fw-semibold">No notifications yet</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.map((notification, index) => (
              <div key={index} className={`d-flex align-items-center p-3 bg-light rounded ${notification.isNew ? 'border border-primary' : ''}`}>
                <i className={`ki-duotone ${notification.icon} fs-2 ${notification.iconColor} me-3`}>
                  <span className="path1"></span><span className="path2"></span><span className="path3"></span>
                </i>
                <div className="flex-grow-1">
                  <div className="fw-bold">{notification.title}</div>
                  <div className="text-muted fs-7">{notification.description}</div>
                  <div className="text-muted fs-8 mt-1">{notification.time}</div>
                </div>
                {notification.isNew && <span className="badge badge-primary">New</span>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSettingsSubmit}>Save Settings</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div className="form-check form-switch ps-0">
            <div className="d-flex justify-content-between align-items-center w-100">
              <label className="form-check-label ms-0" htmlFor="darkMode">Dark Sidebar</label>
              <input className="form-check-input ms-2" type="checkbox" id="darkMode" checked={settingsForm.darkMode} onChange={(e) => setSettingsForm({ ...settingsForm, darkMode: e.target.checked })} />
            </div>
          </div>
          <div className="form-check form-switch ps-0">
            <div className="d-flex justify-content-between align-items-center w-100">
              <label className="form-check-label ms-0" htmlFor="notifications">Email Notifications</label>
              <input className="form-check-input ms-2" type="checkbox" id="notifications" checked={settingsForm.emailNotifications} onChange={(e) => setSettingsForm({ ...settingsForm, emailNotifications: e.target.checked })} />
            </div>
          </div>
          <div className="form-check form-switch ps-0">
            <div className="d-flex justify-content-between align-items-center w-100">
              <label className="form-check-label ms-0" htmlFor="autoRefresh">Auto Refresh Data</label>
              <input className="form-check-input ms-2" type="checkbox" id="autoRefresh" checked={settingsForm.autoRefresh} onChange={(e) => setSettingsForm({ ...settingsForm, autoRefresh: e.target.checked })} />
            </div>
          </div>
          <hr />
          <div className="fw-bold">Language</div>
          <select className="form-select" value={settingsForm.language} onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
        </div>
      </Modal>

      {/* User Profile Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="User Profile"
        footer={<button className="btn btn-light" onClick={() => setIsProfileOpen(false)}>Close</button>}
      >
        <div className="d-flex flex-column gap-3">
          <div className="symbol symbol-100px mx-auto">
            <div className="symbol-label bg-light-primary">
              <i className="ki-duotone ki-profile-circle fs-3x text-primary">
                <span className="path1"></span><span className="path2"></span><span className="path3"></span>
              </i>
            </div>
          </div>
          <div className="text-center">
            <div className="fw-bold fs-3">{currentUser?.name || 'User'}</div>
            <div className="text-muted">{currentUser?.email || 'N/A'}</div>
            <span className="badge badge-light-primary mt-2">{currentUser?.role || 'Team Member'}</span>
          </div>
          <hr />
          <div className="d-flex flex-column gap-2 text-start">
            <button className="btn btn-light-primary w-100 text-start" onClick={handleEditProfileClick}>
              <i className="ki-duotone ki-user-edit me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
              Edit Profile
            </button>
            <button className="btn btn-light-warning w-100 text-start" onClick={handleChangePasswordClick}>
              <i className="ki-duotone ki-lock me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
              Change Password
            </button>
            <button className="btn btn-light-danger w-100 text-start" onClick={handleLogoutClick}>
              <i className="ki-duotone ki-entrance-left me-2"><span className="path1"></span><span className="path2"></span></i>
              Sign Out
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => { setIsEditProfileOpen(false); setIsProfileOpen(true); }}
        title="Edit Profile"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsEditProfileOpen(false); setIsProfileOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditProfileSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Full Name</label>
            <input type="text" className="form-control" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Enter your name" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={currentUser?.email || ''} disabled />
            <div className="form-text">Email cannot be changed</div>
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-control" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Enter your phone number" />
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => { setIsChangePasswordOpen(false); setIsProfileOpen(true); }}
        title="Change Password"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsChangePasswordOpen(false); setIsProfileOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleChangePasswordSubmit}>Change Password</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Current Password</label>
            <input type="password" className="form-control" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter current password" />
          </div>
          <div>
            <label className="form-label required">New Password</label>
            <input type="password" className="form-control" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Enter new password (min. 6 characters)" />
          </div>
          <div>
            <label className="form-label required">Confirm New Password</label>
            <input type="password" className="form-control" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Re-enter new password" />
          </div>
        </div>
      </Modal>
    </>
  );
}
