import { useState, useEffect } from 'react';
import { completedLabelFormsService } from '../../services/airtable.service';
import type { CompletedLabelForm } from '../../types/airtable.types';

export default function CompletedLabelFormsList() {
  const [forms, setForms] = useState<CompletedLabelForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const formsData = await completedLabelFormsService.getAll();
      setForms(formsData);
      setError(null);
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusValue = (status?: string[] | string): string => {
    if (!status) return 'Not Started';
    if (Array.isArray(status)) {
      return (status[0] || 'Not Started').trim();
    }
    return status.trim();
  };

  const getStatusBadgeClass = (status?: string) => {
    const normalizedStatus = status?.trim();
    switch (normalizedStatus) {
      case 'Final Handoff':
        return 'badge-light-success';
      case 'Revision':
        return 'badge-light-warning';
      case 'Unreachable':
        return 'badge-light-danger';
      case 'Incomplete Information':
        return 'badge-light-info';
      case 'Not Started':
        return 'badge-light-secondary';
      default:
        return 'badge-light';
    }
  };


  const searchFilteredForms = forms.filter(form => {
    if (searchTerm === '') return true;
    return (
      (form.fields['Customer Name'] && form.fields['Customer Name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.fields['Product Name'] && form.fields['Product Name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.fields['Order Number'] && form.fields['Order Number'].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const filteredForms = searchFilteredForms.filter(form => {
    const statusMatch = statusFilter === 'all' ||
      (Array.isArray(form.fields['Status']) && form.fields['Status'].some(s => s.trim() === statusFilter)) ||
      (typeof form.fields['Status'] === 'string' && form.fields['Status'].trim() === statusFilter);
    return statusMatch;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button className="btn btn-sm btn-light ms-3" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header border-0 pt-6">
        <div className="card-title">
          <div className="d-flex align-items-center position-relative my-1">
            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            <input
              type="text"
              className="form-control form-control-solid w-250px ps-13"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="card-toolbar">
          <div className="d-flex align-items-center gap-3">
            <select
              className="form-select w-200px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status ({searchFilteredForms.length})</option>
              <option value="Not Started">Not Started</option>
              <option value="Final Handoff">Final Handoff</option>
              <option value="Revision">Revision</option>
              <option value="Unreachable">Unreachable</option>
              <option value="Incomplete Information">Incomplete Information</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        <table className="table align-middle table-row-dashed fs-6 gy-5">
          <thead>
            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
              <th className="min-w-125px">Order Number</th>
              <th className="min-w-125px">Customer</th>
              <th className="min-w-150px">Product Name</th>
              <th className="min-w-125px">Label Type</th>
              <th className="min-w-100px">Status</th>
              <th className="min-w-100px">Submission</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {filteredForms.map((form) => {
              const statusValue = getStatusValue(form.fields['Status']);

              return (
                <tr key={form.id}>
                  <td>
                    <span className="text-gray-800 fw-bold">{form.fields['Order Number'] || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="text-gray-800">{form.fields['Customer Name'] || 'N/A'}</span>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="text-gray-800 fw-bold">{form.fields['Product Name'] || 'N/A'}</span>
                      {form.fields['Dimensions'] && (
                        <span className="text-muted fs-7">{form.fields['Dimensions']}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span title={form.fields['Label Type'] || 'N/A'}>
                      {form.fields['Label Type'] || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(statusValue)}`}>
                      {statusValue}
                    </span>
                  </td>
                  <td>
                    {form.fields['Submission Date']
                      ? new Date(form.fields['Submission Date']).toLocaleDateString()
                      : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
