import { useState, useEffect } from 'react';
import { designDraftsService } from '../../services/airtable.service';
import type { DesignDraft } from '../../types/airtable.types';

declare const Swal: any;

type DesignStatus = 'Incomplete Information' | 'Unreachable' | 'Design' | 'Revision' | 'Production' | 'Final Handoff';

export default function DesignDraftsList() {
  const [designs, setDesigns] = useState<DesignDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const designsData = await designDraftsService.getAll();
      setDesigns(designsData);
      setError(null);
    } catch (err) {
      setError('Failed to load design drafts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (design: DesignDraft) => {
    if (typeof Swal === 'undefined') return;

    const revisionsLeft = design.fields['Revisions Left'] ?? 3;
    const revisionsUsed = 3 - revisionsLeft;

    const result = await Swal.fire({
      title: design.fields['Name'] || 'Design Details',
      html: `
        <div class="text-start">
          <p><strong>Project Type:</strong> ${design.fields['Project Type'] || 'N/A'}</p>
          <p><strong>Status:</strong> <span class="badge ${getStatusBadgeClass(design.fields['Status'])}">${design.fields['Status'] || 'Design'}</span></p>
          <p><strong>Customer:</strong> ${design.fields['Customer Name'] || 'N/A'}</p>
          <p><strong>Phone:</strong> ${design.fields['Phone Number'] || 'N/A'}</p>
          <p><strong>Order Number:</strong> ${design.fields['Order Number'] || 'N/A'}</p>
          <p><strong>Revisions:</strong> ${revisionsUsed}/3 used (${revisionsLeft} left)</p>
          ${design.fields['Design Name'] ? `<p><strong>Design Name:</strong> ${design.fields['Design Name']}</p>` : ''}
          ${design.fields['Created on'] ? `<p><strong>Created on:</strong> ${new Date(design.fields['Created on']).toLocaleDateString()}</p>` : ''}
          ${design.fields['Latest Update'] ? `<p><strong>Latest Update:</strong> ${new Date(design.fields['Latest Update']).toLocaleString()}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="ki-duotone ki-eye fs-2"></i> View Details',
      denyButtonText: '<i class="ki-duotone ki-pencil fs-2"></i> Edit',
      cancelButtonText: 'Close',
      denyButtonColor: '#009ef7',
      width: 600,
    });

    if (result.isConfirmed) {
      handleViewDetails(design);
    } else if (result.isDenied) {
      handleEditDesign(design);
    }
  };

  const handleViewDetails = (design: DesignDraft) => {
    if (typeof Swal === 'undefined') return;

    const revisionsLeft = design.fields['Revisions Left'] ?? 3;
    const revisionsUsed = 3 - revisionsLeft;

    const revisions: string[] = [];
    const feedback: string[] = [];

    // Collect revisions
    for (let i = 1; i <= 3; i++) {
      const revField = `Revision ${i}` as keyof DesignDraft['fields'];
      const notesField = `Revision ${i} Notes` as keyof DesignDraft['fields'];

      if (design.fields[revField]) {
        const notes = design.fields[notesField] as string;
        revisions.push(`
          <div class="mb-3 p-4 border border-dashed border-primary rounded bg-light-primary">
            <div class="d-flex align-items-center mb-2">
              <i class="ki-duotone ki-abstract-26 fs-2 text-primary me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              <strong class="text-primary">Revision ${i}</strong>
            </div>
            ${notes ? `<p class="mb-0 text-gray-700">${notes}</p>` : '<p class="text-muted mb-0">No notes provided</p>'}
          </div>
        `);
      }
    }

    // Collect feedback
    for (let i = 1; i <= 4; i++) {
      const feedbackField = `Feedback Rev ${i}` as keyof DesignDraft['fields'];
      const commentsField = `Total Comments Rev ${i}` as keyof DesignDraft['fields'];

      if (design.fields[feedbackField]) {
        const feedbackText = design.fields[feedbackField] as string;
        const comments = design.fields[commentsField] as number;

        feedback.push(`
          <div class="mb-3 p-4 border border-dashed border-info rounded bg-light-info">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="d-flex align-items-center">
                <i class="ki-duotone ki-message-text fs-2 text-info me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                <strong class="text-info">Revision ${i} Feedback</strong>
              </div>
              <span class="badge badge-info">${comments || 0} comments</span>
            </div>
            <p class="mb-0 text-gray-700">${feedbackText}</p>
          </div>
        `);
      }
    }

    const filesHtml = design.fields['Files Uploaded'] && design.fields['Files Uploaded'].length > 0
      ? design.fields['Files Uploaded'].map(file => `
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
      : '<div class="text-center py-5 text-muted">No files uploaded</div>';

    Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-colors-square fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
          <span class="path3"></span>
          <span class="path4"></span>
        </i>
        <span>${design.fields['Name'] || 'Design Details'}</span>
      </div>`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
          <!-- Project Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-primary">
              <h6 class="card-title mb-0 text-primary">
                <i class="ki-duotone ki-abstract-26 fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Project Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Project Type</label>
                  <div class="text-gray-800 fw-bold">${design.fields['Project Type'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Status</label>
                  <div>
                    <span class="badge ${getStatusBadgeClass(design.fields['Status'])} fs-7">
                      ${design.fields['Status'] || 'Design'}
                    </span>
                  </div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Customer Name</label>
                  <div class="text-gray-800">${design.fields['Customer Name'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Phone Number</label>
                  <div class="text-gray-800">${design.fields['Phone Number'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Order Number</label>
                  <div class="text-gray-800">${design.fields['Order Number'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Revisions</label>
                  <div class="text-gray-800">
                    <span class="badge badge-light-warning">${revisionsUsed}/3 used</span>
                    <span class="text-muted ms-2">(${revisionsLeft} left)</span>
                  </div>
                </div>
                ${design.fields['Design Name'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Design Name</label>
                    <div class="text-gray-800">${design.fields['Design Name']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Product Details -->
          ${design.fields['Ingredients'] || design.fields['Weight/Volume'] || design.fields['Color'] ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-info">
                <h6 class="card-title mb-0 text-info">
                  <i class="ki-duotone ki-abstract-41 fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Product Details
                </h6>
              </div>
              <div class="card-body">
                ${design.fields['Ingredients'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Ingredients</label>
                    <div class="text-gray-800">${design.fields['Ingredients']}</div>
                  </div>
                ` : ''}
                ${design.fields['Weight/Volume'] ? `
                  <div class="mb-3">
                    <label class="text-muted fs-7 fw-semibold">Weight/Volume</label>
                    <div class="text-gray-800">${design.fields['Weight/Volume']}</div>
                  </div>
                ` : ''}
                ${design.fields['Color'] ? `
                  <div>
                    <label class="text-muted fs-7 fw-semibold">Color</label>
                    <div class="text-gray-800">${design.fields['Color']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Revision History -->
          ${revisions.length > 0 ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-warning">
                <h6 class="card-title mb-0 text-warning">
                  <i class="ki-duotone ki-notepad fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                    <span class="path5"></span>
                  </i>
                  Revision History
                </h6>
              </div>
              <div class="card-body">
                ${revisions.join('')}
              </div>
            </div>
          ` : ''}

          <!-- Client Feedback -->
          ${feedback.length > 0 ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-success">
                <h6 class="card-title mb-0 text-success">
                  <i class="ki-duotone ki-messages fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                    <span class="path5"></span>
                  </i>
                  Client Feedback
                </h6>
              </div>
              <div class="card-body">
                ${feedback.join('')}
              </div>
            </div>
          ` : ''}

          <!-- Files -->
          ${design.fields['Files Uploaded'] && design.fields['Files Uploaded'].length > 0 ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-dark">
                <h6 class="card-title mb-0 text-dark">
                  <i class="ki-duotone ki-folder fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Uploaded Files
                </h6>
              </div>
              <div class="card-body">
                ${filesHtml}
              </div>
            </div>
          ` : ''}

          <!-- Timestamps -->
          ${design.fields['Created on'] || design.fields['Latest Update'] ? `
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light">
                <h6 class="card-title mb-0 text-gray-800">
                  <i class="ki-duotone ki-time fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Timeline
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  ${design.fields['Created on'] ? `
                    <div class="col-6">
                      <label class="text-muted fs-7 fw-semibold">Created On</label>
                      <div class="text-gray-800">${new Date(design.fields['Created on']).toLocaleDateString()}</div>
                    </div>
                  ` : ''}
                  ${design.fields['Latest Update'] ? `
                    <div class="col-6">
                      <label class="text-muted fs-7 fw-semibold">Latest Update</label>
                      <div class="text-gray-800">${new Date(design.fields['Latest Update']).toLocaleString()}</div>
                    </div>
                  ` : ''}
                </div>
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

  const handleEditDesign = async (design: DesignDraft) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Design Draft</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-status fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
                <span class="path4"></span>
              </i>
              Design Status
            </label>
            <select id="status" class="form-select form-select-solid">
              <option value="Incomplete Information" ${design.fields['Status'] === 'Incomplete Information' ? 'selected' : ''}>⚠️ Incomplete Information</option>
              <option value="Unreachable" ${design.fields['Status'] === 'Unreachable' ? 'selected' : ''}>❌ Unreachable</option>
              <option value="Design" ${design.fields['Status'] === 'Design' ? 'selected' : ''}>🎨 Design</option>
              <option value="Revision" ${design.fields['Status'] === 'Revision' ? 'selected' : ''}>✏️ Revision</option>
              <option value="Production" ${design.fields['Status'] === 'Production' ? 'selected' : ''}>⚙️ Production</option>
              <option value="Final Handoff" ${design.fields['Status'] === 'Final Handoff' ? 'selected' : ''}>✅ Final Handoff</option>
            </select>
            <div class="form-text">Update the current stage of the design project</div>
          </div>

          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-design fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Design Name
            </label>
            <input
              id="designName"
              type="text"
              class="form-control form-control-solid"
              value="${design.fields['Design Name'] || ''}"
              placeholder="Enter design name"
            >
          </div>

          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-profile-circle fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Customer Name
            </label>
            <input
              id="customerName"
              type="text"
              class="form-control form-control-solid"
              value="${design.fields['Customer Name'] || ''}"
              placeholder="Enter customer name"
            >
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-phone fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              class="form-control form-control-solid"
              value="${design.fields['Phone Number'] || ''}"
              placeholder="+234 XXX XXX XXXX"
            >
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ki-duotone ki-check fs-2"></i> Save Changes',
      cancelButtonText: '<i class="ki-duotone ki-cross fs-2"></i> Cancel',
      width: 600,
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light me-3',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      },
      preConfirm: () => {
        const status = (document.getElementById('status') as HTMLSelectElement).value;
        const designName = (document.getElementById('designName') as HTMLInputElement).value;
        const customerName = (document.getElementById('customerName') as HTMLInputElement).value;
        const phoneNumber = (document.getElementById('phoneNumber') as HTMLInputElement).value;

        if (!status) {
          Swal.showValidationMessage('Please select a status');
          return false;
        }

        return { status, designName, customerName, phoneNumber };
      },
    });

    if (formValues) {
      try {
        const updateData: any = {
          'Status': formValues.status,
        };

        if (formValues.designName) {
          updateData['Design Name'] = formValues.designName;
        }
        if (formValues.customerName) {
          updateData['Customer Name'] = formValues.customerName;
        }
        if (formValues.phoneNumber) {
          updateData['Phone Number'] = formValues.phoneNumber;
        }

        await designDraftsService.update(design.id, updateData);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Design has been updated successfully.',
          confirmButtonText: 'OK',
          buttonsStyling: false,
          customClass: {
            confirmButton: 'btn btn-success'
          }
        });
        loadData();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update design. Please try again.',
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

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'Incomplete Information': return 'badge-light-warning';
      case 'Unreachable': return 'badge-light-danger';
      case 'Design': return 'badge-light-primary';
      case 'Revision': return 'badge-light-info';
      case 'Production': return 'badge-light-success';
      case 'Final Handoff': return 'badge-light-dark';
      default: return 'badge-light';
    }
  };

  const getColumnColor = (status?: DesignStatus) => {
    switch (status) {
      case 'Incomplete Information': return '#ffc700';
      case 'Unreachable': return '#f1416c';
      case 'Design': return '#009ef7';
      case 'Revision': return '#7239ea';
      case 'Production': return '#50cd89';
      case 'Final Handoff': return '#3f4254';
      default: return '#e4e6ef';
    }
  };

  const getProjectTypeIcon = (type?: string) => {
    switch (type) {
      case 'Logo Design': return 'ki-abstract-26';
      case 'Label Design': return 'ki-tag';
      case 'Poly Bag Design': return 'ki-purchase';
      case 'Paper Bag Design': return 'ki-basket';
      case 'Flier': return 'ki-document';
      case 'Banner': return 'ki-flag';
      default: return 'ki-design';
    }
  };

  const columns: { status: DesignStatus; title: string }[] = [
    { status: 'Incomplete Information', title: 'Incomplete Info' },
    { status: 'Unreachable', title: 'Unreachable' },
    { status: 'Design', title: 'Design' },
    { status: 'Revision', title: 'Revision' },
    { status: 'Production', title: 'Production' },
    { status: 'Final Handoff', title: 'Final Handoff' },
  ];

  const getDesignsByStatus = (status: DesignStatus): DesignDraft[] => {
    return designs.filter(design => {
      const designStatus = design.fields['Status'] || 'Design';
      const matchesStatus = designStatus === status;

      if (!searchTerm) {
        return matchesStatus;
      }

      const name = design.fields['Name'];
      const customerName = design.fields['Customer Name'];
      const designName = design.fields['Design Name'];

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (typeof name === 'string' && name.toLowerCase().includes(searchLower)) ||
        (typeof customerName === 'string' && customerName.toLowerCase().includes(searchLower)) ||
        (typeof designName === 'string' && designName.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  };

  const getStatusCount = (status: DesignStatus): number => {
    return getDesignsByStatus(status).length;
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
              className="form-control form-control-solid w-300px ps-13"
              placeholder="Search designs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-toolbar">
          <div className="d-flex justify-content-end align-items-center gap-3">
            <button className="btn btn-sm btn-light" onClick={loadData}>
              <i className="ki-duotone ki-arrows-circle fs-2">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card-body py-4">
        <div className="d-flex gap-5 overflow-auto pb-5" style={{ minHeight: '600px' }}>
          {columns.map(({ status, title }) => {
            const columnDesigns = getDesignsByStatus(status);
            const count = getStatusCount(status);

            return (
              <div key={status} className="flex-shrink-0" style={{ width: '320px' }}>
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle me-2"
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: getColumnColor(status),
                        }}
                      ></div>
                      <h3 className="fs-5 fw-bold mb-0">{title}</h3>
                    </div>
                    <span className="badge badge-light-primary">{count}</span>
                  </div>
                  <div className="separator separator-dashed mb-4"></div>
                </div>

                <div className="d-flex flex-column gap-3">
                  {columnDesigns.map((design) => {
                    const revisionsLeft = design.fields['Revisions Left'] ?? 3;

                    return (
                      <div
                        key={design.id}
                        className="card card-flush cursor-pointer hover-elevate-up"
                        onClick={() => handleCardClick(design)}
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <div className="card-body p-5">
                          {/* Project Name */}
                          <div className="mb-3">
                            <h4 className="fs-6 fw-bold text-gray-800 mb-1">
                              {design.fields['Name'] || 'Untitled Design'}
                            </h4>
                            {design.fields['Design Name'] && (
                              <span className="text-muted fs-7">{design.fields['Design Name']}</span>
                            )}
                          </div>

                          {/* Project Type */}
                          <div className="mb-3">
                            <div className="d-flex align-items-center">
                              <i className={`ki-duotone ${getProjectTypeIcon(design.fields['Project Type'])} fs-4 text-gray-500 me-2`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                              </i>
                              <span className="text-gray-700 fs-7">
                                {design.fields['Project Type'] || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Customer Name */}
                          {design.fields['Customer Name'] && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center">
                                <i className="ki-duotone ki-user fs-4 text-gray-500 me-2">
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                </i>
                                <span className="text-gray-700 fs-7">
                                  {design.fields['Customer Name']}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Order Number */}
                          {design.fields['Order Number'] && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center">
                                <i className="ki-duotone ki-barcode fs-4 text-gray-500 me-2">
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                  <span className="path3"></span>
                                  <span className="path4"></span>
                                  <span className="path5"></span>
                                  <span className="path6"></span>
                                  <span className="path7"></span>
                                  <span className="path8"></span>
                                </i>
                                <span className="text-gray-700 fs-7">
                                  {design.fields['Order Number']}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Revisions */}
                          <div className="separator separator-dashed my-3"></div>

                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-gray-600 fs-7">Revisions</span>
                            <span className={`badge ${revisionsLeft === 0 ? 'badge-danger' : revisionsLeft === 1 ? 'badge-warning' : 'badge-success'}`}>
                              {revisionsLeft} left
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnDesigns.length === 0 && (
                    <div className="text-center py-10 text-muted">
                      No designs in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Total: {designs.length} design{designs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
