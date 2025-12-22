import { useState, useEffect } from 'react';
import { discoveryCallService, teamMemberService } from '../../services/airtable.service';
import type { DiscoveryCallRecord, TeamMember } from '../../types/airtable.types';

declare const Swal: any;

export default function DiscoveryCallsList() {
  const [calls, setCalls] = useState<DiscoveryCallRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadCalls();
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      const data = await teamMemberService.getAll();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const loadCalls = async () => {
    try {
      setLoading(true);
      const data = await discoveryCallService.getAll();
      setCalls(data);
      setError(null);
    } catch (err) {
      setError('Failed to load discovery calls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = searchTerm === '' ||
      call.fields['Discovery Call Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.fields['Company Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.fields['Order ID']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (call.fields['Customer Name (from Customer Name)'] &&
        (Array.isArray(call.fields['Customer Name (from Customer Name)'])
          ? call.fields['Customer Name (from Customer Name)'][0]?.toLowerCase().includes(searchTerm.toLowerCase())
          : call.fields['Customer Name (from Customer Name)'].toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

    const matchesStatus = filterStatus === '' || call.fields['Discovery Status'] === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getOwnerName = (ownerId?: string[]) => {
    if (!ownerId || ownerId.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerId[0]);
    return owner?.fields['Name'] || ownerId[0];
  };

  const handleViewDetails = (call: DiscoveryCallRecord) => {
    if (typeof Swal === 'undefined') return;

    // Helper function to extract text from AI-generated fields
    const extractAIText = (data: any): string => {
      if (!data) return '';
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && data.value) return data.value;
      return '';
    };

    // Helper function to format AI text with line breaks
    const formatAIText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/(\d+\.\s)/g, '<br/>$1')
        .trim()
        .replace(/^<br\/>/, '');
    };

    const filesHtml = call.fields['Files/Attachments'] && call.fields['Files/Attachments'].length > 0
      ? call.fields['Files/Attachments'].map(file => `
          <div class="d-flex align-items-center p-3 mb-2 bg-light rounded">
            <i class="ki-duotone ki-file fs-2x text-primary me-3">
              <span class="path1"></span>
              <span class="path2"></span>
            </i>
            <div class="flex-grow-1">
              <a href="${file.url}" target="_blank" class="text-gray-800 text-hover-primary fw-bold fs-6">
                ${file.filename}
              </a>
              <div class="text-muted fs-7">${(file.size / 1024).toFixed(2)} KB</div>
            </div>
            <a href="${file.url}" target="_blank" class="btn btn-sm btn-icon btn-light-primary">
              <i class="ki-duotone ki-arrow-down fs-3"></i>
            </a>
          </div>
        `).join('')
      : '<div class="text-center py-5 text-muted">No files attached</div>';

    const aiSummaryText = extractAIText(call.fields['Discovery Call Summary (AI)']);
    const aiActionsText = extractAIText(call.fields['Action Items (AI)']);

    Swal.fire({
      title: `${call.fields['Discovery Call Name'] || 'Discovery Call Details'}`,
      html: `
          <div class="modal-section">
            <div class="modal-section-title">
              <i class="ki-duotone ki-profile-circle fs-4">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Customer & Contact Information
            </div>
            <div class="modal-info-grid">
              <div class="modal-info-item">
                <div class="modal-info-label">Order Number</div>
                <div class="modal-info-value">${call.fields['Order ID'] || call.fields['Order Number'] || 'Not specified'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Customer Name</div>
                <div class="modal-info-value">${call.fields['Customer Name (from Customer Name)'] ? (Array.isArray(call.fields['Customer Name (from Customer Name)']) ? call.fields['Customer Name (from Customer Name)'][0] : call.fields['Customer Name (from Customer Name)']) : 'Not specified'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Discovery Call Name</div>
                <div class="modal-info-value">${call.fields['Discovery Call Name'] || 'Not specified'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Call Date</div>
                <div class="modal-info-value">${call.fields['Call Date'] ? new Date(call.fields['Call Date']).toLocaleString() : 'Not specified'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Call Owner</div>
                <div class="modal-info-value">${getOwnerName(call.fields['Discovery Call Owner'])}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Status</div>
                <div class="modal-info-value">
                  <span class="badge ${call.fields['Discovery Status'] === 'Reached' ? 'badge-primary' : 'badge-secondary'}">
                    ${call.fields['Discovery Status'] || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          ${call.fields['Project/Topic'] || call.fields['Project Description/Notes'] || call.fields['Key Questions Asked'] ? `
            <div class="modal-section">
              <div class="modal-section-title">
                <i class="ki-duotone ki-abstract-26 fs-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Project Details
              </div>
              <div class="modal-info-grid">
                ${call.fields['Project/Topic'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Project/Topic</div>
                    <div class="modal-info-value">${call.fields['Project/Topic']}</div>
                  </div>
                ` : ''}
                ${call.fields['Project Description/Notes'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Project Description/Notes</div>
                    <div class="modal-info-value">${call.fields['Project Description/Notes']}</div>
                  </div>
                ` : ''}
                ${call.fields['Key Questions Asked'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Key Questions Asked</div>
                    <div class="modal-info-value">${call.fields['Key Questions Asked']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${call.fields['Customer Pain Points'] || call.fields['Desired Outcomes'] || call.fields['Next Steps'] ? `
            <div class="modal-section">
              <div class="modal-section-title">
                <i class="ki-duotone ki-messages fs-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                </i>
                Customer Insights
              </div>
              <div class="modal-info-grid">
                ${call.fields['Customer Pain Points'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Pain Points</div>
                    <div class="modal-info-value">${call.fields['Customer Pain Points']}</div>
                  </div>
                ` : ''}
                ${call.fields['Desired Outcomes'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Desired Outcomes</div>
                    <div class="modal-info-value">${call.fields['Desired Outcomes']}</div>
                  </div>
                ` : ''}
                ${call.fields['Next Steps'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Next Steps</div>
                    <div class="modal-info-value">${call.fields['Next Steps']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${aiSummaryText || aiActionsText ? `
            <div class="modal-section">
              <div class="modal-section-title">
                <i class="ki-duotone ki-abstract-26 fs-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                AI-Generated Insights
              </div>
              <div class="modal-info-grid">
                ${aiSummaryText ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">AI Summary</div>
                    <div class="modal-info-value">${aiSummaryText}</div>
                  </div>
                ` : ''}
                ${aiActionsText ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">AI Action Items</div>
                    <div class="modal-info-value">${formatAIText(aiActionsText)}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          ${call.fields['Call Recording'] || (call.fields['Files/Attachments'] && call.fields['Files/Attachments'].length > 0) ? `
            <div class="modal-section">
              <div class="modal-section-title">
                <i class="ki-duotone ki-folder fs-4">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Recordings & Attachments
              </div>
              <div class="modal-info-grid">
                ${call.fields['Call Recording'] ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Call Recording</div>
                    <div class="modal-info-value">
                      <a href="${call.fields['Call Recording']}" target="_blank" class="btn btn-sm btn-primary">
                        <i class="ki-duotone ki-headset fs-3">
                          <span class="path1"></span>
                          <span class="path2"></span>
                          <span class="path3"></span>
                        </i>
                        Listen to Recording
                      </a>
                    </div>
                  </div>
                ` : ''}
                ${call.fields['Files/Attachments'] && call.fields['Files/Attachments'].length > 0 ? `
                  <div class="modal-info-item" style="grid-column: 1 / -1;">
                    <div class="modal-info-label">Attached Files (${call.fields['Files/Attachments'].length})</div>
                    <div class="modal-info-value">
                      ${filesHtml}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      width: 900,
      showCloseButton: true,
      confirmButtonText: 'Close',
      customClass: {
        container: 'swal-custom-container',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      }
    });
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

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button className="btn btn-sm btn-primary ms-3" onClick={loadCalls}>
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
              placeholder="Search discovery calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-toolbar">
          <div className="d-flex justify-content-end align-items-center gap-3">
            <select
              className="form-select form-select-solid w-200px"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Reached">Reached</option>
              <option value="Unreachable">Unreachable</option>
            </select>

            <button className="btn btn-primary btn-sm" onClick={loadCalls}>
              <i className="ki-duotone ki-arrows-circle fs-3">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        <table className="table align-middle table-row-dashed fs-6 gy-5">
          <thead>
            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
              <th className="min-w-200px">Discovery Call Name</th>
              <th className="min-w-125px">Order ID</th>
              <th className="min-w-150px">Customer</th>
              <th className="min-w-125px">Call Date</th>
              <th className="min-w-125px">Owner</th>
              <th className="min-w-100px">Status</th>
              <th className="text-end min-w-100px">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10">
                  <div className="text-gray-600">No discovery calls found</div>
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => (
                <tr
                  key={call.id}
                  className="cursor-pointer"
                  onClick={() => handleViewDetails(call)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="d-flex flex-column">
                      <span className="text-gray-800 fw-bold">{call.fields['Discovery Call Name'] || 'Untitled Call'}</span>
                      {call.fields['Project/Topic'] && (
                        <span className="text-muted fs-7">{call.fields['Project/Topic']}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="text-gray-800">{call.fields['Order ID'] || 'N/A'}</span>
                  </td>
                  <td>
                    <span className="text-gray-800">
                      {call.fields['Customer Name (from Customer Name)']
                        ? (Array.isArray(call.fields['Customer Name (from Customer Name)'])
                            ? call.fields['Customer Name (from Customer Name)'][0]
                            : call.fields['Customer Name (from Customer Name)'])
                        : 'Not specified'}
                    </span>
                  </td>
                  <td>
                    {call.fields['Call Date']
                      ? new Date(call.fields['Call Date']).toLocaleDateString()
                      : 'Not specified'}
                  </td>
                  <td>
                    <span className="text-gray-800">{getOwnerName(call.fields['Discovery Call Owner'])}</span>
                  </td>
                  <td>
                    {call.fields['Discovery Status'] === 'Reached' ? (
                      <span className="badge badge-light-success fw-bold">
                        Reached
                      </span>
                    ) : (
                      <span className="badge badge-light-danger fw-bold">
                        Unreachable
                      </span>
                    )}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-light btn-active-light-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(call);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Showing {filteredCalls.length} of {calls.length} discovery calls
          </div>
        </div>
      </div>
    </div>
  );
}
