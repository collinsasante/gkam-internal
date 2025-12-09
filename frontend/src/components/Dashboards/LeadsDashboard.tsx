import { useState, useEffect } from 'react';
import { contactService, leadsService, dealsService, activityService } from '../../services/airtable.service';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function LeadsDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalLeads: 0,
    qualifiedLeads: 0,
    totalDeals: 0,
    wonDeals: 0,
    dealValue: 0,
    wonValue: 0,
    totalActivities: 0,
    leadsPerStage: {
      'New Lead': 0,
      'Attempted to Contact': 0,
      'Contacted': 0,
      'Qualified': 0,
      'Unqualified': 0,
    },
    dealsPerStage: {
      'New': 0,
      'Discovery': 0,
      'Prospective': 0,
      'Invoice': 0,
      'Won': 0,
      'Lost': 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [contacts, leads, deals, activities] = await Promise.all([
        contactService.getAll(),
        leadsService.getAll(),
        dealsService.getAll(),
        activityService.getAll(),
      ]);

      // Calculate leads per stage
      const leadsPerStage = {
        'New Lead': leads.filter(l => l.fields['Status'] === 'New Lead').length,
        'Attempted to Contact': leads.filter(l => l.fields['Status'] === 'Attempted to Contact').length,
        'Contacted': leads.filter(l => l.fields['Status'] === 'Contacted').length,
        'Qualified': leads.filter(l => l.fields['Status'] === 'Qualified').length,
        'Unqualified': leads.filter(l => l.fields['Status'] === 'Unqualified').length,
      };

      // Calculate deals per stage
      const dealsPerStage = {
        'New': deals.filter(d => d.fields['Stage'] === 'New').length,
        'Discovery': deals.filter(d => d.fields['Stage'] === 'Discovery').length,
        'Prospective': deals.filter(d => d.fields['Stage'] === 'Prospective').length,
        'Invoice': deals.filter(d => d.fields['Stage'] === 'Invoice').length,
        'Won': deals.filter(d => d.fields['Stage'] === 'Won').length,
        'Lost': deals.filter(d => d.fields['Stage'] === 'Lost').length,
      };

      // Calculate deal values
      const wonDeals = deals.filter(d => d.fields['Stage'] === 'Won');
      const wonValue = wonDeals.reduce((sum, d) => sum + (d.fields['Amount'] || 0), 0);
      const dealValue = deals.reduce((sum, d) => sum + (d.fields['Amount'] || 0), 0);

      setStats({
        totalContacts: contacts.length,
        totalLeads: leads.length,
        qualifiedLeads: leads.filter(l => l.fields['Status'] === 'Qualified').length,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        dealValue,
        wonValue,
        totalActivities: activities.length,
        leadsPerStage,
        dealsPerStage,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
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

  const conversionRate = stats.totalLeads > 0 ? (stats.wonDeals / stats.totalLeads * 100).toFixed(1) : '0.0';
  const winRate = stats.totalDeals > 0 ? (stats.wonDeals / stats.totalDeals * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-6">
        <h1 className="mb-0">Sales Pipeline Dashboard</h1>
        <button className="btn btn-sm btn-light" onClick={loadStats}>
          <i className="ki-duotone ki-arrows-circle fs-2">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('contacts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalContacts}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Contacts</span>
              <div className="mt-3">
                <i className="ki-duotone ki-profile-circle fs-3x text-primary">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('leads')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalLeads}</span>
                <span className="badge badge-light-success fs-base">
                  {stats.qualifiedLeads} Qualified
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Active Leads</span>
              <div className="mt-3">
                <i className="ki-duotone ki-badge fs-3x text-info">
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
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('deals')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalDeals}</span>
                <span className="badge badge-light-success fs-base">
                  {stats.wonDeals} Won
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Deals</span>
              <div className="mt-3">
                <i className="ki-duotone ki-cheque fs-3x text-warning">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                  <span className="path5"></span>
                  <span className="path6"></span>
                  <span className="path7"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('activities')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalActivities}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Activities</span>
              <div className="mt-3">
                <i className="ki-duotone ki-notification-bing fs-3x text-danger">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Conversion */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-success me-2">{formatCurrency(stats.wonValue)}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Revenue (Won Deals)</span>
              <div className="mt-3 text-gray-600">
                Pipeline Value: {formatCurrency(stats.dealValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-primary me-2">{conversionRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Lead to Deal Conversion</span>
              <div className="mt-3 text-gray-600">
                {stats.wonDeals} deals from {stats.totalLeads} leads
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-info me-2">{winRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Deal Win Rate</span>
              <div className="mt-3 text-gray-600">
                {stats.wonDeals} won / {stats.totalDeals} total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="row g-5 g-xl-8">
        <div className="col-xl-6">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Lead Pipeline</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalLeads} total leads</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.leadsPerStage).map(([stage, count]) => (
                <div key={stage} className="d-flex align-items-center mb-7">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-gray-800 fw-bold fs-6 me-2">{stage}</span>
                      <span className="badge badge-light">{count}</span>
                    </div>
                    <div className="progress h-6px">
                      <div
                        className={`progress-bar ${
                          stage === 'Qualified' ? 'bg-success' :
                          stage === 'Contacted' ? 'bg-info' :
                          stage === 'Unqualified' ? 'bg-danger' : 'bg-primary'
                        }`}
                        style={{ width: `${stats.totalLeads > 0 ? (count / stats.totalLeads * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Deal Pipeline</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{formatCurrency(stats.dealValue)} total value</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.dealsPerStage).map(([stage, count]) => (
                <div key={stage} className="d-flex align-items-center mb-7">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-gray-800 fw-bold fs-6 me-2">{stage}</span>
                      <span className="badge badge-light">{count}</span>
                    </div>
                    <div className="progress h-6px">
                      <div
                        className={`progress-bar ${
                          stage === 'Won' ? 'bg-success' :
                          stage === 'Lost' ? 'bg-danger' :
                          stage === 'Invoice' ? 'bg-warning' : 'bg-primary'
                        }`}
                        style={{ width: `${stats.totalDeals > 0 ? (count / stats.totalDeals * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
