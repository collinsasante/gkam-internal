import { useState, useEffect } from 'react';
import { customerContactService, accountService, taskService, interactionService } from '../../services/airtable.service';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function CustomerSuccessDashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalInteractions: 0,
    customersBySource: {} as Record<string, number>,
    tasksByStatus: {
      'To do': 0,
      'In progress': 0,
      'Done': 0,
    },
    interactionsByType: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [customers, accounts, tasks, interactions] = await Promise.all([
        customerContactService.getAll(),
        accountService.getAll(),
        taskService.getAll(),
        interactionService.getAll(),
      ]);

      // Calculate customers by source
      const customersBySource: Record<string, number> = {};
      customers.forEach(c => {
        const source = c.fields['Discovery Source'] || 'Unknown';
        customersBySource[source] = (customersBySource[source] || 0) + 1;
      });

      // Calculate tasks by status
      const tasksByStatus = {
        'To do': tasks.filter(t => t.fields['Status'] === 'To do').length,
        'In progress': tasks.filter(t => t.fields['Status'] === 'In progress').length,
        'Done': tasks.filter(t => t.fields['Status'] === 'Done').length,
      };

      // Calculate interactions by type
      const interactionsByType: Record<string, number> = {};
      interactions.forEach(i => {
        const type = i.fields['Type'] || 'Unknown';
        interactionsByType[type] = (interactionsByType[type] || 0) + 1;
      });

      const activeAccounts = accounts.filter(a => a.fields['Account Status'] === 'Active').length;

      setStats({
        totalCustomers: customers.length,
        totalAccounts: accounts.length,
        activeAccounts,
        totalTasks: tasks.length,
        pendingTasks: tasks.filter(t => t.fields['Status'] !== 'Done').length,
        completedTasks: tasks.filter(t => t.fields['Status'] === 'Done').length,
        totalInteractions: interactions.length,
        customersBySource,
        tasksByStatus,
        interactionsByType,
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

  const taskCompletionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100).toFixed(1) : '0.0';
  const accountActivityRate = stats.totalAccounts > 0 ? (stats.activeAccounts / stats.totalAccounts * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-6">
        <h1 className="mb-0">Customer Success Dashboard</h1>
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
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('customer-contacts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalCustomers}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Customers</span>
              <div className="mt-3">
                <i className="ki-duotone ki-user fs-3x text-primary">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3">
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('accounts')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalAccounts}</span>
                <span className="badge badge-light-success fs-base">
                  {stats.activeAccounts} Active
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Accounts</span>
              <div className="mt-3">
                <i className="ki-duotone ki-shop fs-3x text-info">
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
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('tasks')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalTasks}</span>
                <span className="badge badge-light-warning fs-base">
                  {stats.pendingTasks} Pending
                </span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Tasks</span>
              <div className="mt-3">
                <i className="ki-duotone ki-notepad fs-3x text-warning">
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
          <div className="card card-flush h-100" style={{ cursor: 'pointer' }} onClick={() => onNavigate('interactions')}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-gray-800 me-2">{stats.totalInteractions}</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Total Interactions</span>
              <div className="mt-3">
                <i className="ki-duotone ki-message-text-2 fs-3x text-danger">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="row g-5 g-xl-8 mb-5">
        <div className="col-xl-6">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-success me-2">{taskCompletionRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Task Completion Rate</span>
              <div className="mt-3 text-gray-600">
                {stats.completedTasks} completed / {stats.totalTasks} total
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card card-flush h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <span className="fs-2hx fw-bold text-primary me-2">{accountActivityRate}%</span>
              </div>
              <span className="fs-6 fw-semibold text-gray-400">Account Activity Rate</span>
              <div className="mt-3 text-gray-600">
                {stats.activeAccounts} active / {stats.totalAccounts} total
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
                <span className="card-label fw-bold text-gray-800">Customer Sources</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalCustomers} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.customersBySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="d-flex align-items-center mb-7">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <span className="text-gray-800 fw-bold fs-6 me-2">{source}</span>
                        <span className="badge badge-light">{count}</span>
                      </div>
                      <div className="progress h-6px">
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${stats.totalCustomers > 0 ? (count / stats.totalCustomers * 100) : 0}%` }}
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
                <span className="card-label fw-bold text-gray-800">Task Status</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalTasks} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                <div key={status} className="d-flex align-items-center mb-7">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className="text-gray-800 fw-bold fs-6 me-2">{status}</span>
                      <span className="badge badge-light">{count}</span>
                    </div>
                    <div className="progress h-6px">
                      <div
                        className={`progress-bar ${
                          status === 'Done' ? 'bg-success' :
                          status === 'In progress' ? 'bg-warning' : 'bg-info'
                        }`}
                        style={{ width: `${stats.totalTasks > 0 ? (count / stats.totalTasks * 100) : 0}%` }}
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
                <span className="card-label fw-bold text-gray-800">Interaction Types</span>
                <span className="text-gray-400 mt-1 fw-semibold fs-6">{stats.totalInteractions} total</span>
              </h3>
            </div>
            <div className="card-body pt-6">
              {Object.entries(stats.interactionsByType)
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
                          className="progress-bar bg-info"
                          style={{ width: `${stats.totalInteractions > 0 ? (count / stats.totalInteractions * 100) : 0}%` }}
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
