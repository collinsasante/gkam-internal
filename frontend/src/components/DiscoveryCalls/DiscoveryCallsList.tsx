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
      // Use Airtable's default sort order
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
      call.fields['Order ID']?.toLowerCase().includes(searchTerm.toLowerCase());

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

    Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-call fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
          <span class="path3"></span>
          <span class="path4"></span>
        </i>
        <span>${call.fields['Discovery Call Name'] || 'Discovery Call Details'}</span>
      </div>`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
          <!-- Customer & Contact Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-primary">
              <h6 class="card-title mb-0 text-primary">
                <i class="ki-duotone ki-profile-circle fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Customer & Contact Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Order ID</label>
                  <div class="text-gray-800 fw-bold">${call.fields['Order ID'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Company Name</label>
                  <div class="text-gray-800 fw-bold">${call.fields['Company Name'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Contact Email</label>
                  <div class="text-gray-800">${call.fields['Contact Email'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Contact Phone</label>
                  <div class="text-gray-800">${call.fields['Contact Phone'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Call Date</label>
                  <div class="text-gray-800">${call.fields['Call Date'] ? new Date(call.fields['Call Date']).toLocaleString() : 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Call Owner</label>
                  <div class="text-gray-800">${getOwnerName(call.fields['Discovery Call Owner'])}</div>
                </div>
                <div class="col-12">
                  <label class="text-muted fs-7 fw-semibold">Status</label>
                  <div>
                    <span class="badge ${call.fields['Discovery Status'] === 'Reached' ? 'badge-light-success' : 'badge-light-danger'} fs-7">
                      ${call.fields['Discovery Status'] || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Details -->
          ${call.fields['Project/Topic'] || call.fields['Project Description/Notes'] || call.fields['Key Questions Asked'] ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-info">
                <h6 class="card-title mb-0 text-info">
                  <i class="ki-duotone ki-abstract-26 fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Project Details
                </h6>
              </div>
              <div class="card-body">
                ${call.fields['Project/Topic'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Project/Topic</label>
                    <div class="text-gray-800">${call.fields['Project/Topic']}</div>
                  </div>
                ` : ''}
                ${call.fields['Project Description/Notes'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Project Description/Notes</label>
                    <div class="text-gray-800">${call.fields['Project Description/Notes']}</div>
                  </div>
                ` : ''}
                ${call.fields['Key Questions Asked'] ? `
                  <div>
                    <label class="text-muted fs-7 fw-semibold">Key Questions Asked</label>
                    <div class="text-gray-800">${call.fields['Key Questions Asked']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Customer Insights -->
          ${call.fields['Customer Pain Points'] || call.fields['Desired Outcomes'] || call.fields['Next Steps'] ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-warning">
                <h6 class="card-title mb-0 text-warning">
                  <i class="ki-duotone ki-messages fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                    <span class="path5"></span>
                  </i>
                  Customer Insights
                </h6>
              </div>
              <div class="card-body">
                ${call.fields['Customer Pain Points'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Pain Points</label>
                    <div class="text-gray-800">${call.fields['Customer Pain Points']}</div>
                  </div>
                ` : ''}
                ${call.fields['Desired Outcomes'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Desired Outcomes</label>
                    <div class="text-gray-800">${call.fields['Desired Outcomes']}</div>
                  </div>
                ` : ''}
                ${call.fields['Next Steps'] ? `
                  <div>
                    <label class="text-muted fs-7 fw-semibold">Next Steps</label>
                    <div class="text-gray-800">${call.fields['Next Steps']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- AI Insights -->
          ${call.fields['Discovery Call Summary (AI)'] || call.fields['Action Items (AI)'] ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-success">
                <h6 class="card-title mb-0 text-success">
                  <i class="ki-duotone ki-abstract-26 fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  AI-Generated Insights
                </h6>
              </div>
              <div class="card-body">
                ${call.fields['Discovery Call Summary (AI)'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">AI Summary</label>
                    <div class="text-gray-800">${call.fields['Discovery Call Summary (AI)']}</div>
                  </div>
                ` : ''}
                ${call.fields['Action Items (AI)'] ? `
                  <div>
                    <label class="text-muted fs-7 fw-semibold">AI Action Items</label>
                    <div class="text-gray-800">${call.fields['Action Items (AI)']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Recordings & Files -->
          ${call.fields['Call Recording'] || (call.fields['Files/Attachments'] && call.fields['Files/Attachments'].length > 0) ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-dark">
                <h6 class="card-title mb-0 text-dark">
                  <i class="ki-duotone ki-folder fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Recordings & Attachments
                </h6>
              </div>
              <div class="card-body">
                ${call.fields['Call Recording'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Call Recording</label>
                    <div class="mt-2">
                      <a href="${call.fields['Call Recording']}" target="_blank" class="btn btn-sm btn-light-primary">
                        <i class="ki-duotone ki-headset fs-3 me-2">
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
                  <div>
                    <label class="text-muted fs-7 fw-semibold">Attached Files</label>
                    <div class="mt-2">
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

  const handleEditCall = async (call: DiscoveryCallRecord) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Discovery Call</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-call fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
                <span class="path4"></span>
              </i>
              Discovery Call Name
            </label>
            <input
              id="callName"
              type="text"
              class="form-control form-control-solid"
              value="${call.fields['Discovery Call Name'] || ''}"
              placeholder="Enter call name"
            >
          </div>

          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-abstract-21 fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              class="form-control form-control-solid"
              value="${call.fields['Company Name'] || ''}"
              placeholder="Enter company name"
            >
          </div>

          <div class="row g-3 mb-5">
            <div class="col-6">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-sms fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                class="form-control form-control-solid"
                value="${call.fields['Contact Email'] || ''}"
                placeholder="email@example.com"
              >
            </div>
            <div class="col-6">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-phone fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Contact Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                class="form-control form-control-solid"
                value="${call.fields['Contact Phone'] || ''}"
                placeholder="+234 XXX XXX XXXX"
              >
            </div>
          </div>

          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-status fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
                <span class="path4"></span>
              </i>
              Discovery Status
            </label>
            <select id="status" class="form-select form-select-solid">
              <option value="Reached" ${call.fields['Discovery Status'] === 'Reached' ? 'selected' : ''}>✅ Reached</option>
              <option value="Unreachable" ${call.fields['Discovery Status'] === 'Unreachable' ? 'selected' : ''}>❌ Unreachable</option>
            </select>
            <div class="form-text">Update the call status based on the outcome</div>
          </div>

          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-abstract-26 fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Project/Topic
            </label>
            <textarea
              id="projectTopic"
              class="form-control form-control-solid"
              rows="2"
              placeholder="What is this project about?"
            >${call.fields['Project/Topic'] || ''}</textarea>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-arrow-right fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Next Steps
            </label>
            <textarea
              id="nextSteps"
              class="form-control form-control-solid"
              rows="3"
              placeholder="What are the next steps for this call?"
            >${call.fields['Next Steps'] || ''}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ki-duotone ki-check fs-2"></i> Save Changes',
      cancelButtonText: '<i class="ki-duotone ki-cross fs-2"></i> Cancel',
      width: 700,
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light me-3',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      },
      preConfirm: () => {
        const callName = (document.getElementById('callName') as HTMLInputElement).value;
        const companyName = (document.getElementById('companyName') as HTMLInputElement).value;
        const contactEmail = (document.getElementById('contactEmail') as HTMLInputElement).value;
        const contactPhone = (document.getElementById('contactPhone') as HTMLInputElement).value;
        const status = (document.getElementById('status') as HTMLSelectElement).value;
        const projectTopic = (document.getElementById('projectTopic') as HTMLTextAreaElement).value;
        const nextSteps = (document.getElementById('nextSteps') as HTMLTextAreaElement).value;

        if (!callName.trim()) {
          Swal.showValidationMessage('Call name is required');
          return false;
        }
        if (!status) {
          Swal.showValidationMessage('Please select a status');
          return false;
        }

        return { callName, companyName, contactEmail, contactPhone, status, projectTopic, nextSteps };
      },
    });

    if (formValues) {
      try {
        const updateData: any = {};

        if (formValues.callName) {
          updateData['Discovery Call Name'] = formValues.callName;
        }
        if (formValues.companyName) {
          updateData['Company Name'] = formValues.companyName;
        }
        if (formValues.contactEmail) {
          updateData['Contact Email'] = formValues.contactEmail;
        }
        if (formValues.contactPhone) {
          updateData['Contact Phone'] = formValues.contactPhone;
        }
        if (formValues.status) {
          updateData['Discovery Status'] = formValues.status;
        }
        if (formValues.projectTopic) {
          updateData['Project/Topic'] = formValues.projectTopic;
        }
        if (formValues.nextSteps) {
          updateData['Next Steps'] = formValues.nextSteps;
        }

        await discoveryCallService.update(call.id, updateData);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Discovery call has been updated successfully.',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'btn btn-success'
          }
        });
        loadCalls();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update discovery call. Please try again.',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'btn btn-danger'
          }
        });
        console.error(error);
      }
    }
  };

  const handleCardClick = (call: DiscoveryCallRecord) => {
    handleViewDetails(call);
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
            <i className="bi bi-search fs-3 position-absolute ms-5"></i>
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
              className="form-select form-select-solid w-150px"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Reached">Reached</option>
              <option value="Unreachable">Unreachable</option>
            </select>

            <button className="btn btn-primary" onClick={loadCalls}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card-body py-4">
        <div className="row g-6 g-xl-9">
          {filteredCalls.length === 0 ? (
            <div className="col-12 text-center py-10">
              <div className="text-gray-600">No discovery calls found</div>
            </div>
          ) : (
            filteredCalls.map((call) => (
              <div key={call.id} className="col-md-6 col-xl-4">
                <div
                  className="card border border-2 border-gray-300 border-hover h-100 cursor-pointer"
                  onClick={() => handleCardClick(call)}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <div className="card-header border-0 pt-9">
                    <div className="card-title m-0">
                      <div className="symbol symbol-50px w-50px bg-light">
                        <i className="bi bi-telephone-fill fs-2x text-primary"></i>
                      </div>
                    </div>

                    <div className="card-toolbar">
                      {call.fields['Discovery Status'] === 'Reached' ? (
                        <span className="badge badge-light-success fw-bold me-auto px-4 py-3">
                          Reached
                        </span>
                      ) : (
                        <span className="badge badge-light-danger fw-bold me-auto px-4 py-3">
                          Unreachable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-body p-9">
                    <div className="fs-3 fw-bold text-gray-900 mb-3">
                      {call.fields['Discovery Call Name'] || 'Untitled Call'}
                    </div>

                    <div className="d-flex flex-wrap mb-5">
                      <div className="border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-7 mb-3">
                        <div className="fs-6 text-gray-800 fw-bold">
                          {call.fields['Order ID'] || 'N/A'}
                        </div>
                        <div className="fw-semibold text-gray-500">Order ID</div>
                      </div>

                      <div className="border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 mb-3">
                        <div className="fs-6 text-gray-800 fw-bold">
                          {call.fields['Call Date']
                            ? new Date(call.fields['Call Date']).toLocaleDateString()
                            : 'N/A'}
                        </div>
                        <div className="fw-semibold text-gray-500">Call Date</div>
                      </div>
                    </div>

                    <div className="mb-7">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-building me-2 fs-5"></i>
                        <span className="fw-bold text-gray-700">
                          {call.fields['Company Name'] || 'N/A'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-envelope me-2 fs-5"></i>
                        <span className="text-gray-600">
                          {call.fields['Contact Email'] || 'N/A'}
                        </span>
                      </div>

                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-telephone me-2 fs-5"></i>
                        <span className="text-gray-600">
                          {call.fields['Contact Phone'] || 'N/A'}
                        </span>
                      </div>

                      {call.fields['Discovery Call Owner'] && (
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle me-2 fs-5"></i>
                          <span className="text-gray-600">
                            {getOwnerName(call.fields['Discovery Call Owner'])}
                          </span>
                        </div>
                      )}
                    </div>

                    {call.fields['Project/Topic'] && (
                      <div className="mb-5">
                        <div className="fw-bold text-gray-700 mb-2">
                          <i className="bi bi-lightbulb me-1"></i>
                          Project/Topic
                        </div>
                        <div className="text-gray-600 fs-7">
                          {call.fields['Project/Topic']}
                        </div>
                      </div>
                    )}

                    {call.fields['Discovery Call Summary (AI)'] && typeof call.fields['Discovery Call Summary (AI)'] === 'string' && (
                      <div className="mb-5">
                        <div className="fw-bold text-gray-700 mb-2">
                          <i className="bi bi-stars me-1"></i>
                          AI Summary
                        </div>
                        <div className="text-gray-600 fs-7">
                          {call.fields['Discovery Call Summary (AI)'].substring(0, 150)}
                          {call.fields['Discovery Call Summary (AI)'].length > 150 ? '...' : ''}
                        </div>
                      </div>
                    )}

                    {call.fields['Customer Pain Points'] && typeof call.fields['Customer Pain Points'] === 'string' && (
                      <div className="mb-5">
                        <div className="fw-bold text-gray-700 mb-2">
                          <i className="bi bi-exclamation-circle me-1"></i>
                          Pain Points
                        </div>
                        <div className="text-gray-600 fs-7">
                          {call.fields['Customer Pain Points'].substring(0, 100)}
                          {call.fields['Customer Pain Points'].length > 100 ? '...' : ''}
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-7">
                      <button
                        className="btn btn-sm btn-light-primary flex-grow-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(call);
                        }}
                      >
                        <i className="bi bi-eye fs-5"></i>
                        View Details
                      </button>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCall(call);
                        }}
                      >
                        <i className="bi bi-pencil fs-5"></i>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Showing {filteredCalls.length} of {calls.length} discovery calls
          </div>
        </div>
      </div>
    </div>
  );
}
