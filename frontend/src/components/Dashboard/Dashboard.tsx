import { useState, useEffect } from 'react';
import {
  customerContactService,
  accountService,
  taskService,
  interactionService,
  leadsService,
  dealsService,
  contactService,
  activityService,
  designDraftsService,
  completedLabelFormsService,
  discoveryCallService,
} from '../../services/airtable.service';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    // Leads Section
    totalContacts: 0,
    totalLeads: 0,
    totalDeals: 0,
    wonDeals: 0,
    totalActivities: 0,
    dealValue: 0,
    // Customer Success Section
    totalCustomers: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalInteractions: 0,
    // Creatives Section
    totalLabelForms: 0,
    totalDiscoveryCalls: 0,
    totalDesignDrafts: 0,
    approvedForms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();

      // Fetch data with error handling for tables that might not be accessible
      const results = await Promise.allSettled([
        contactService.getAll(),
        leadsService.getAll(),
        dealsService.getAll(),
        activityService.getAll(),
        customerContactService.getAll(),
        accountService.getAll(),
        taskService.getAll(),
        interactionService.getAll(),
        completedLabelFormsService.getAll(),
        discoveryCallService.getAll(),
        designDraftsService.getAll(),
      ]);

      const contacts = results[0].status === 'fulfilled' ? results[0].value : [];
      const leads = results[1].status === 'fulfilled' ? results[1].value : [];
      const deals = results[2].status === 'fulfilled' ? results[2].value : [];
      const activities = results[3].status === 'fulfilled' ? results[3].value : [];
      const customers = results[4].status === 'fulfilled' ? results[4].value : [];
      const accounts = results[5].status === 'fulfilled' ? results[5].value : [];
      const tasks = results[6].status === 'fulfilled' ? results[6].value : [];
      const interactions = results[7].status === 'fulfilled' ? results[7].value : [];
      const labelForms = results[8].status === 'fulfilled' ? results[8].value : [];
      const discoveryCalls = results[9].status === 'fulfilled' ? results[9].value : [];
      const designDrafts = results[10].status === 'fulfilled' ? results[10].value : [];

      const wonDeals = deals.filter(d => d.fields['Stage'] === 'Won');
      const dealValue = deals.reduce((sum, d) => sum + (d.fields['Amount'] || 0), 0);
      const activeAccounts = accounts.filter(a => a.fields['Account Status'] === 'Active').length;
      const completedTasks = tasks.filter(t => t.fields['Status'] === 'Done').length;
      const approvedForms = labelForms.filter(f => f.fields['Artwork Status'] === 'Approved').length;

      // Ensure loading state lasts at least 600ms for animation visibility
      const duration = Date.now() - startTime;
      if (duration < 600) {
        await new Promise(resolve => setTimeout(resolve, 600 - duration));
      }

      setStats({
        totalContacts: contacts.length,
        totalLeads: leads.length,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        totalActivities: activities.length,
        dealValue,
        totalCustomers: customers.length,
        totalAccounts: accounts.length,
        activeAccounts,
        totalTasks: tasks.length,
        completedTasks,
        totalInteractions: interactions.length,
        totalLabelForms: labelForms.length,
        totalDiscoveryCalls: discoveryCalls.length,
        totalDesignDrafts: designDrafts.length,
        approvedForms,
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-6">
        <h1 className="mb-0">Dashboard Overview</h1>
        <button className="btn btn-icon btn-custom btn-active-color-primary" onClick={loadAllData} disabled={loading} title="Refresh All">
          <i className={`ki-duotone ki-arrows-circle fs-1 ${loading ? 'rotate' : ''}`}>
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
        </button>
      </div>

      {/* Department Dashboards */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-4">
          <div
            className="card card-flush h-100"
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            onClick={() => onNavigate?.('leads-dashboard')}
          >
            <div className="card-body">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <i className="ki-duotone ki-chart-line-up fs-3x text-white me-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                  </i>
                  <h3 className="text-white fw-bold mb-0">Sales Pipeline</h3>
                </div>
                <div className="text-white opacity-75 mb-5">
                  Leads, Deals, Contacts & Activities
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Contacts:</span>
                  <span className="text-white fw-bold">{stats.totalContacts}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Leads:</span>
                  <span className="text-white fw-bold">{stats.totalLeads}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Deals:</span>
                  <span className="text-white fw-bold">{stats.totalDeals} ({stats.wonDeals} Won)</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-white opacity-75">Pipeline Value:</span>
                  <span className="text-white fw-bold">{formatCurrency(stats.dealValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div
            className="card card-flush h-100"
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            onClick={() => onNavigate?.('customer-success-dashboard')}
          >
            <div className="card-body">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <i className="ki-duotone ki-people fs-3x text-white me-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                    <span className="path5"></span>
                  </i>
                  <h3 className="text-white fw-bold mb-0">Customer Success</h3>
                </div>
                <div className="text-white opacity-75 mb-5">
                  Customers, Accounts, Tasks & Interactions
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Customers:</span>
                  <span className="text-white fw-bold">{stats.totalCustomers}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Accounts:</span>
                  <span className="text-white fw-bold">{stats.totalAccounts} ({stats.activeAccounts} Active)</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Tasks:</span>
                  <span className="text-white fw-bold">{stats.totalTasks} ({stats.completedTasks} Done)</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-white opacity-75">Interactions:</span>
                  <span className="text-white fw-bold">{stats.totalInteractions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div
            className="card card-flush h-100"
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
            onClick={() => onNavigate?.('creatives-dashboard')}
          >
            <div className="card-body">
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <i className="ki-duotone ki-colors-square fs-3x text-white me-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                  <h3 className="text-white fw-bold mb-0">Creatives</h3>
                </div>
                <div className="text-white opacity-75 mb-5">
                  Label Forms, Discovery Calls & Designs
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Label Forms:</span>
                  <span className="text-white fw-bold">{stats.totalLabelForms} ({stats.approvedForms} Approved)</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-white opacity-75">Discovery Calls:</span>
                  <span className="text-white fw-bold">{stats.totalDiscoveryCalls}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-white opacity-75">Design Projects:</span>
                  <span className="text-white fw-bold">{stats.totalDesignDrafts}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('leads')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalLeads}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Active Leads</span>
              <div className="mt-3">
                <i className="ki-duotone ki-badge fs-3x text-primary">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                  <span className="path5"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('deals')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-success me-2">{formatCurrency(stats.dealValue)}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Pipeline Value</span>
              <div className="mt-3 text-gray-600">
                {stats.totalDeals} deals ({stats.wonDeals} won)
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('customer-contacts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalCustomers}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Customers</span>
              <div className="mt-3">
                <i className="ki-duotone ki-user fs-3x text-info">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate?.('design-drafts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalDesignDrafts}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Design Projects</span>
              <div className="mt-3">
                <i className="ki-duotone ki-colors-square fs-3x text-warning">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                </i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="row g-5 g-xl-8">
        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Sales Performance</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              <div className="d-flex align-items-center mb-5">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-gray-800 fw-bold fs-6 me-2">Deal Win Rate</span>
                    <span className="badge badge-light-success">
                      {stats.totalDeals > 0 ? ((stats.wonDeals / stats.totalDeals) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="progress h-6px">
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${stats.totalDeals > 0 ? (stats.wonDeals / stats.totalDeals) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="separator separator-dashed mb-5"></div>
              <div className="d-flex justify-content-between">
                <span className="text-gray-600">Total Contacts</span>
                <span className="text-gray-800 fw-bold">{stats.totalContacts}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Active Leads</span>
                <span className="text-gray-800 fw-bold">{stats.totalLeads}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Activities Logged</span>
                <span className="text-gray-800 fw-bold">{stats.totalActivities}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Customer Success</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              <div className="d-flex align-items-center mb-5">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-gray-800 fw-bold fs-6 me-2">Task Completion</span>
                    <span className="badge badge-light-primary">
                      {stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="progress h-6px">
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="separator separator-dashed mb-5"></div>
              <div className="d-flex justify-content-between">
                <span className="text-gray-600">Active Accounts</span>
                <span className="text-gray-800 fw-bold">{stats.activeAccounts}/{stats.totalAccounts}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Completed Tasks</span>
                <span className="text-gray-800 fw-bold">{stats.completedTasks}/{stats.totalTasks}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Total Interactions</span>
                <span className="text-gray-800 fw-bold">{stats.totalInteractions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Creative Output</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              <div className="d-flex align-items-center mb-5">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    <span className="text-gray-800 fw-bold fs-6 me-2">Approval Rate</span>
                    <span className="badge badge-light-success">
                      {stats.totalLabelForms > 0 ? ((stats.approvedForms / stats.totalLabelForms) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="progress h-6px">
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${stats.totalLabelForms > 0 ? (stats.approvedForms / stats.totalLabelForms) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="separator separator-dashed mb-5"></div>
              <div className="d-flex justify-content-between">
                <span className="text-gray-600">Label Forms</span>
                <span className="text-gray-800 fw-bold">{stats.totalLabelForms}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Discovery Calls</span>
                <span className="text-gray-800 fw-bold">{stats.totalDiscoveryCalls}</span>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <span className="text-gray-600">Design Projects</span>
                <span className="text-gray-800 fw-bold">{stats.totalDesignDrafts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
