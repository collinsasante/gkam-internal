import { useState, useEffect } from 'react';
import { discoveryCallService, designDraftsService, completedLabelFormsService } from '../../services/airtable.service';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function CreativesDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalLabelForms: 0,
    totalDiscoveryCalls: 0,
    totalDesignDrafts: 0,
    labelFormsByStatus: {
      'Not Started': 0,
      'In Progress': 0,
      'Submitted': 0,
      'Approved': 0,
    },
    discoveryCallsByStatus: {
      'Reached': 0,
      'Unreachable': 0,
    },
    designDraftsByStatus: {
      'Incomplete Information': 0,
      'Unreachable': 0,
      'Design': 0,
      'Revision': 0,
      'Production': 0,
      'Final Handoff': 0,
    },
    designDraftsByType: {} as Record<string, number>,
    avgRevisionsUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Fetch data with error handling for tables that might not be accessible
      const results = await Promise.allSettled([
        completedLabelFormsService.getAll(),
        discoveryCallService.getAll(),
        designDraftsService.getAll(),
      ]);

      const labelForms = results[0].status === 'fulfilled' ? results[0].value : [];
      const discoveryCalls = results[1].status === 'fulfilled' ? results[1].value : [];
      const designDrafts = results[2].status === 'fulfilled' ? results[2].value : [];

      // Calculate label forms by status
      const labelFormsByStatus = {
        'Not Started': labelForms.filter(f => f.fields['Artwork Status'] === 'Not Started').length,
        'In Progress': labelForms.filter(f => f.fields['Artwork Status'] === 'In Progress').length,
        'Submitted': labelForms.filter(f => f.fields['Artwork Status'] === 'Submitted').length,
        'Approved': labelForms.filter(f => f.fields['Artwork Status'] === 'Approved').length,
      };

      // Calculate discovery calls by status
      const discoveryCallsByStatus = {
        'Reached': discoveryCalls.filter(c => c.fields['Discovery Status'] === 'Reached').length,
        'Unreachable': discoveryCalls.filter(c => c.fields['Discovery Status'] === 'Unreachable').length,
      };

      // Calculate design drafts by status
      const designDraftsByStatus = {
        'Incomplete Information': designDrafts.filter(d => d.fields['Status'] === 'Incomplete Information').length,
        'Unreachable': designDrafts.filter(d => d.fields['Status'] === 'Unreachable').length,
        'Design': designDrafts.filter(d => d.fields['Status'] === 'Design').length,
        'Revision': designDrafts.filter(d => d.fields['Status'] === 'Revision').length,
        'Production': designDrafts.filter(d => d.fields['Status'] === 'Production').length,
        'Final Handoff': designDrafts.filter(d => d.fields['Status'] === 'Final Handoff').length,
      };

      // Calculate design drafts by type
      const designDraftsByType: Record<string, number> = {};
      designDrafts.forEach(d => {
        const type = d.fields['Project Type'] || 'Unknown';
        designDraftsByType[type] = (designDraftsByType[type] || 0) + 1;
      });

      // Calculate average revisions used
      const totalRevisionsUsed = designDrafts.reduce((sum, d) => {
        const revisionsLeft = d.fields['Revisions Left'] ?? 3;
        return sum + (3 - revisionsLeft);
      }, 0);
      const avgRevisionsUsed = designDrafts.length > 0 ? totalRevisionsUsed / designDrafts.length : 0;

      setStats({
        totalLabelForms: labelForms.length,
        totalDiscoveryCalls: discoveryCalls.length,
        totalDesignDrafts: designDrafts.length,
        labelFormsByStatus,
        discoveryCallsByStatus,
        designDraftsByStatus,
        designDraftsByType,
        avgRevisionsUsed,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
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

  const approvalRate = stats.totalLabelForms > 0 ? (stats.labelFormsByStatus['Approved'] / stats.totalLabelForms * 100).toFixed(1) : '0.0';
  const discoverySuccessRate = stats.totalDiscoveryCalls > 0 ? (stats.discoveryCallsByStatus['Reached'] / stats.totalDiscoveryCalls * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-6">
        <h1 className="mb-0">Creatives Dashboard</h1>
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
        <div className="col-xl-4">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('completed-label-forms')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalLabelForms}</span>
                <span className="badge badge-light-success fs-base">
                  {stats.labelFormsByStatus['Approved']} Approved
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Label Forms</span>
              <div className="mt-3">
                <i className="ki-duotone ki-document fs-3x text-primary">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('discovery-calls')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalDiscoveryCalls}</span>
                <span className="badge badge-light-success fs-base">
                  {stats.discoveryCallsByStatus['Reached']} Reached
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Discovery Calls</span>
              <div className="mt-3">
                <i className="ki-duotone ki-call fs-3x text-info">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                  <span className="path5"></span>
                  <span className="path6"></span>
                  <span className="path7"></span>
                  <span className="path8"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('design-drafts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalDesignDrafts}</span>
                <span className="badge badge-light-warning fs-base">
                  {stats.designDraftsByStatus['Revision']} In Revision
                </span>
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

      {/* Performance Metrics */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-success me-2">{approvalRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Label Approval Rate</span>
              <div className="mt-3 text-gray-600">
                {stats.labelFormsByStatus['Approved']} approved / {stats.totalLabelForms} total
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-primary me-2">{discoverySuccessRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Discovery Success Rate</span>
              <div className="mt-3 text-gray-600">
                {stats.discoveryCallsByStatus['Reached']} reached / {stats.totalDiscoveryCalls} total
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-info me-2">{stats.avgRevisionsUsed.toFixed(1)}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Avg Revisions Used</span>
              <div className="mt-3 text-gray-600">
                Out of 3 allowed revisions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="row g-5 g-xl-8">
        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Label Form Status</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalLabelForms} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.labelFormsByStatus).map(([status, count]) => (
                <div key={status} className="d-flex align-items-center mb-7">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-gray-800 fw-bold fs-6 me-2">{status}</span>
                      <span className="badge badge-light">{count}</span>
                    </div>
                    <div className="progress h-6px">
                      <div
                        className={`progress-bar ${
                          status === 'Approved' ? 'bg-success' :
                          status === 'Submitted' ? 'bg-warning' :
                          status === 'In Progress' ? 'bg-primary' : 'bg-secondary'
                        }`}
                        style={{ width: `${stats.totalLabelForms > 0 ? (count / stats.totalLabelForms * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Design Status</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalDesignDrafts} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.designDraftsByStatus).map(([status, count]) => (
                <div key={status} className="d-flex align-items-center mb-5">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-gray-800 fw-bold fs-7 me-2">{status}</span>
                      <span className="badge badge-light">{count}</span>
                    </div>
                    <div className="progress h-6px">
                      <div
                        className={`progress-bar ${
                          status === 'Final Handoff' ? 'bg-success' :
                          status === 'Production' ? 'bg-success' :
                          status === 'Revision' ? 'bg-info' :
                          status === 'Design' ? 'bg-primary' : 'bg-warning'
                        }`}
                        style={{ width: `${stats.totalDesignDrafts > 0 ? (count / stats.totalDesignDrafts * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card card-flush h-100">
            <div className="card-header pt-7">
              <h3 className="card-title align-items-start flex-column">
                <span className="card-label fw-bold text-gray-800">Design Project Types</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalDesignDrafts} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.designDraftsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="d-flex align-items-center mb-7">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <span className="text-gray-800 fw-bold fs-6 me-2">{type}</span>
                        <span className="badge badge-light">{count}</span>
                      </div>
                      <div className="progress h-6px">
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${stats.totalDesignDrafts > 0 ? (count / stats.totalDesignDrafts * 100) : 0}%` }}
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
