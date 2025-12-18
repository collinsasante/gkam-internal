import { useState } from 'react';
import type { AuthUser } from '../../services/auth.service';
import { notificationService } from '../../services/notification.service';
import type { Notification } from '../../services/notification.service';

declare const Swal: any;

interface HeaderProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotifications = async () => {
    setShowNotifications(!showNotifications);

    if (typeof Swal !== 'undefined') {
      // Show loading state
      Swal.fire({
        title: 'Loading Notifications...',
        html: '<div class="spinner-border text-primary" role="status"></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
      });

      try {
        // Fetch real notifications
        const notifications = await notificationService.getNotifications();
        const unread = notificationService.getUnreadCount(notifications);
        setUnreadCount(unread);

        if (notifications.length === 0) {
          Swal.fire({
            title: 'Notifications',
            html: `
              <div class="text-center py-5">
                <i class="ki-duotone ki-notification-bing fs-5x text-muted mb-3">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <div class="text-muted fw-semibold">No notifications yet</div>
              </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: 500,
          });
          return;
        }

        const notificationsHtml = notifications
          .map((notification: Notification) => `
            <div class="d-flex align-items-center p-3 bg-light rounded ${notification.isNew ? 'border border-primary' : ''}">
              <i class="ki-duotone ${notification.icon} fs-2 ${notification.iconColor} me-3">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              <div class="flex-grow-1">
                <div class="fw-bold">${notification.title}</div>
                <div class="text-muted fs-7">${notification.description}</div>
                <div class="text-muted fs-8 mt-1">${notification.time}</div>
              </div>
              ${notification.isNew ? '<span class="badge badge-primary">New</span>' : ''}
            </div>
          `)
          .join('');

        Swal.fire({
          title: `Notifications ${unread > 0 ? `(${unread} new)` : ''}`,
          html: `
            <div class="d-flex flex-column gap-3" style="max-height: 400px; overflow-y: auto;">
              ${notificationsHtml}
            </div>
          `,
          showCloseButton: true,
          showConfirmButton: false,
          width: 550,
          customClass: {
            htmlContainer: 'p-0'
          }
        });
      } catch (error) {
        console.error('Error loading notifications:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to load notifications',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  const handleSettings = () => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Settings',
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="darkMode" checked>
              <label class="form-check-label" for="darkMode">Dark Sidebar</label>
            </div>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="notifications">
              <label class="form-check-label" for="notifications">Email Notifications</label>
            </div>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="autoRefresh" checked>
              <label class="form-check-label" for="autoRefresh">Auto Refresh Data</label>
            </div>
            <hr>
            <div class="fw-bold">Language</div>
            <select class="form-select">
              <option selected>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Settings',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light',
        },
      });
    }
  };

  const handleChangePassword = () => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Change Password',
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div>
              <label class="form-label">Current Password</label>
              <input type="password" class="form-control" id="current-password" placeholder="Enter current password">
            </div>
            <div>
              <label class="form-label">New Password</label>
              <input type="password" class="form-control" id="new-password" placeholder="Enter new password (min. 6 characters)">
            </div>
            <div>
              <label class="form-label">Confirm New Password</label>
              <input type="password" class="form-control" id="confirm-password" placeholder="Re-enter new password">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Change Password',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light',
        },
        preConfirm: () => {
          const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value;
          const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value;
          const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value;

          if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.showValidationMessage('Please fill in all fields');
            return false;
          }

          if (newPassword.length < 6) {
            Swal.showValidationMessage('New password must be at least 6 characters');
            return false;
          }

          if (newPassword !== confirmPassword) {
            Swal.showValidationMessage('Passwords do not match');
            return false;
          }

          return { currentPassword, newPassword };
        }
      }).then((result: { isConfirmed: boolean }) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Success!',
            text: 'Your password has been updated',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    }
  };

  const handleEditProfile = () => {
    if (typeof Swal !== 'undefined') {
      const userName = currentUser?.name || '';
      const userEmail = currentUser?.email || '';

      Swal.fire({
        title: 'Edit Profile',
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div>
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" id="edit-name" value="${userName}" placeholder="Enter your name">
            </div>
            <div>
              <label class="form-label">Email</label>
              <input type="email" class="form-control" id="edit-email" value="${userEmail}" placeholder="Enter your email" disabled>
              <div class="form-text">Email cannot be changed</div>
            </div>
            <div>
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-control" id="edit-phone" placeholder="Enter your phone number">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light',
        },
        preConfirm: () => {
          const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
          const phone = (document.getElementById('edit-phone') as HTMLInputElement)?.value;

          if (!name) {
            Swal.showValidationMessage('Please enter your name');
            return false;
          }

          return { name, phone };
        }
      }).then((result: { isConfirmed: boolean }) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Success!',
            text: 'Your profile has been updated',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
    }
  };

  const handleProfile = () => {
    setShowProfile(!showProfile);
    if (typeof Swal !== 'undefined') {
      const userName = currentUser?.name || 'User';
      const userEmail = currentUser?.email || 'N/A';
      const userRole = currentUser?.role || 'Team Member';

      Swal.fire({
        title: 'User Profile',
        html: `
          <div class="d-flex flex-column gap-3">
            <div class="symbol symbol-100px mx-auto">
              <div class="symbol-label bg-light-primary">
                <i class="ki-duotone ki-profile-circle fs-3x text-primary">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
              </div>
            </div>
            <div class="text-center">
              <div class="fw-bold fs-3">${userName}</div>
              <div class="text-muted">${userEmail}</div>
              <span class="badge badge-light-primary mt-2">${userRole}</span>
            </div>
            <hr>
            <div class="d-flex flex-column gap-2 text-start">
              <button class="btn btn-light-primary w-100 text-start" id="edit-profile-btn">
                <i class="ki-duotone ki-user-edit me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Edit Profile
              </button>
              <button class="btn btn-light-warning w-100 text-start" id="change-password-btn">
                <i class="ki-duotone ki-lock me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Change Password
              </button>
              <button class="btn btn-light-danger w-100 text-start" id="logout-btn">
                <i class="ki-duotone ki-entrance-left me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Sign Out
              </button>
            </div>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: 400,
        didOpen: () => {
          document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            Swal.close();
            handleEditProfile();
          });
          document.getElementById('change-password-btn')?.addEventListener('click', () => {
            Swal.close();
            handleChangePassword();
          });
          document.getElementById('logout-btn')?.addEventListener('click', () => {
            Swal.close();
            onLogout();
          });
        },
      });
    }
  };

  return (
    <div id="kt_app_header" className="app-header">
      <div className="app-container container-fluid d-flex align-items-stretch justify-content-between">
        <div className="d-flex align-items-center d-lg-none ms-n3 me-1 me-md-2" title="Show sidebar menu">
          <button
            className="btn btn-icon btn-active-color-primary w-35px h-35px"
            id="kt_app_sidebar_mobile_toggle"
            onClick={() => {
              const sidebar = document.getElementById('kt_app_sidebar');
              if (sidebar) {
                sidebar.classList.toggle('drawer-on');
              }
            }}
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
                    onClick={handleNotifications}
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
                  onClick={handleSettings}
                >
                  <i className="ki-duotone ki-setting-2 fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                </button>
                <button
                  className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px"
                  title="User Profile"
                  onClick={handleProfile}
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
  );
}
