import { useState } from 'react';
import type { AuthUser } from '../../services/auth.service';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  currentUser: AuthUser | null;
  isOpen?: boolean;
  onClose?: () => void;
}

import logoRed from '../logo_red.png';

export default function Sidebar({ activeView, onViewChange, currentUser, isOpen, onClose }: SidebarProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Overview': true,
    'Leads': false,
    'Customer Success': false,
    'Creatives': false,
    'Team': true,
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'element-11' },
      ],
      hasDropdown: false,
    },
    {
      title: 'Leads',
      dashboardId: 'leads-dashboard',
      items: [
        { id: 'contacts', label: 'Contacts', icon: 'profile-circle' },
        { id: 'leads', label: 'Leads', icon: 'badge' },
        { id: 'deals', label: 'Deals', icon: 'cheque' },
        { id: 'activities', label: 'Activities', icon: 'notification-bing' },
      ],
      hasDropdown: true,
    },
    {
      title: 'Customer Success',
      dashboardId: 'customer-success-dashboard',
      items: [
        { id: 'customer-contacts', label: 'Customers', icon: 'user' },
        { id: 'accounts', label: 'Accounts', icon: 'shop' },
        { id: 'tasks', label: 'Tasks', icon: 'notepad' },
        { id: 'interactions', label: 'Interactions', icon: 'message-text-2' },
      ],
      hasDropdown: true,
    },
    {
      title: 'Creatives',
      dashboardId: 'creatives-dashboard',
      items: [
        { id: 'completed-label-forms', label: 'Label Forms', icon: 'document' },
        { id: 'discovery-calls', label: 'Discovery Calls', icon: 'call' },
        { id: 'design-drafts', label: 'Design & Revisions', icon: 'colors-square' },
      ],
      hasDropdown: true,
    },
    {
      title: 'Team',
      items: [
        { id: 'team-members', label: 'Team Members', icon: 'people' },
      ],
      hasDropdown: false,
    },
  ];

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
    document.body.classList.toggle('app-sidebar-minimize');
  };

  return (
    <div
      className={`app-sidebar flex-column ${isOpen ? 'drawer-on' : ''}`}
      data-kt-drawer="true"
      data-kt-drawer-name="app-sidebar"
      data-kt-drawer-activate="{default: true, lg: false}"
      data-kt-drawer-overlay="true"
      data-kt-drawer-width="225px"
      data-kt-drawer-direction="start"
      data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle"
      id="kt_app_sidebar"
    >
      <div className="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
        <div className="d-flex align-items-center">
          <img src={logoRed} alt="GlamPack" style={{ height: '40px', width: 'auto' }} />
        </div>
        <div
          id="kt_app_sidebar_toggle"
          className="app-sidebar-toggle btn btn-icon btn-shadow btn-sm btn-color-muted btn-active-color-primary body-bg h-30px w-30px position-absolute top-50 start-100 translate-middle rotate"
          onClick={toggleSidebar}
          style={{ cursor: 'pointer' }}
        >
          <i className={`ki-duotone ki-double-left fs-2 ${isMinimized ? '' : 'rotate-180'}`}>
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
        </div>
      </div>

      <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
        <div
          id="kt_app_sidebar_menu_wrapper"
          className="app-sidebar-wrapper hover-scroll-overlay-y my-5"
          data-kt-scroll="true"
          data-kt-scroll-activate="true"
          data-kt-scroll-height="auto"
          data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer"
          data-kt-scroll-wrappers="#kt_app_sidebar_menu"
          data-kt-scroll-offset="5px"
          data-kt-scroll-save-state="true"
        >
          <div
            className="menu menu-column menu-rounded menu-sub-indention px-3"
            id="kt_app_sidebar_menu"
            data-kt-menu="true"
            data-kt-menu-expand="false"
          >
            {menuSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="mb-3">
                {section.hasDropdown ? (
                  <div data-kt-menu-trigger="click" className="menu-item menu-accordion">
                    <span
                      className="menu-link"
                      onClick={() => toggleSection(section.title)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="menu-icon">
                        <i className="ki-duotone ki-element-11 fs-2">
                          <span className="path1"></span>
                          <span className="path2"></span>
                          <span className="path3"></span>
                          <span className="path4"></span>
                        </i>
                      </span>
                      <span className="menu-title">{section.title}</span>
                      <span className="menu-arrow"></span>
                    </span>
                    <div className={`menu-sub menu-sub-accordion ${expandedSections[section.title] ? 'show' : ''}`}>
                      {section.dashboardId && (
                        <div
                          className={`menu-item ${activeView === section.dashboardId ? 'here show' : ''}`}
                          onClick={() => onViewChange(section.dashboardId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className={`menu-link ${activeView === section.dashboardId ? 'active' : ''}`}>
                            <span className="menu-bullet">
                              <span className="bullet bullet-dot"></span>
                            </span>
                            <span className="menu-title">Dashboard</span>
                          </span>
                        </div>
                      )}
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className={`menu-item ${activeView === item.id ? 'here show' : ''}`}
                          onClick={() => onViewChange(item.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className={`menu-link ${activeView === item.id ? 'active' : ''}`}>
                            <span className="menu-bullet">
                              <span className="bullet bullet-dot"></span>
                            </span>
                            <span className="menu-title">{item.label}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="menu-item">
                      <div className="menu-content pb-2">
                        <span className="menu-section text-muted text-uppercase fs-8 ls-1">
                          {section.title}
                        </span>
                      </div>
                    </div>
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`menu-item ${activeView === item.id ? 'here show' : ''}`}
                        onClick={() => onViewChange(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className={`menu-link ${activeView === item.id ? 'active' : ''}`}>
                          <span className="menu-icon">
                            <i className={`ki-duotone ki-${item.icon} fs-2`}>
                              <span className="path1"></span>
                              <span className="path2"></span>
                              <span className="path3"></span>
                              <span className="path4"></span>
                            </i>
                          </span>
                          <span className="menu-title">{item.label}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="app-sidebar-footer flex-column-auto pt-2 pb-6 px-6" id="kt_app_sidebar_footer">
        <div className="d-flex flex-stack p-3 rounded">
          <div className="d-flex align-items-center">
            <div className="symbol symbol-circle symbol-45px">
              <div className="symbol-label" style={{ backgroundColor: '#DC143C' }}>
                <span className="text-white fw-bold fs-4">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ms-3">
              <span className="text-gray-900 fw-bold fs-6 d-block">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-gray-600 fw-semibold fs-7">
                {currentUser?.role || 'Team Member'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
