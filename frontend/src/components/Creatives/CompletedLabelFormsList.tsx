import { useState, useEffect } from 'react';
import { completedLabelFormsService } from '../../services/airtable.service';
import type { CompletedLabelForm } from '../../types/airtable.types';

declare const Swal: any;

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

  const handleViewDetails = (form: CompletedLabelForm) => {
    if (typeof Swal === 'undefined') return;

    const filesHtml = form.fields['Files Attached'] && form.fields['Files Attached'].length > 0
      ? form.fields['Files Attached'].map(file => `
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
        <i class="ki-duotone ki-document fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Submission: ${form.fields['Form ID'] || 'N/A'}</span>
      </div>`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
          <!-- Customer Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-primary">
              <h6 class="card-title mb-0 text-primary">
                <i class="ki-duotone ki-profile-circle fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Customer Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-12">
                  <label class="text-muted fs-7 fw-semibold">Customer Name</label>
                  <div class="text-gray-800 fw-bold">${form.fields['Customer Name'] || 'N/A'}</div>
                </div>
                ${form.fields['Contact'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Contact</label>
                    <div class="text-gray-800">${form.fields['Contact']}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-info">
              <h6 class="card-title mb-0 text-info">
                <i class="ki-duotone ki-cube-2 fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Product Details
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Product Name</label>
                  <div class="text-gray-800 fw-bold">${form.fields['Product Name'] || 'N/A'}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Label Type</label>
                  <div class="text-gray-800">${getLabelTypeIcon(form.fields['Label Type'])} ${form.fields['Label Type'] || 'N/A'}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Dimensions</label>
                  <div class="text-gray-800">${form.fields['Dimensions'] || 'N/A'}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Quantity</label>
                  <div class="text-gray-800 fw-bold">${form.fields['Quantity'] ? form.fields['Quantity'].toLocaleString() : 'N/A'}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Material</label>
                  <div class="text-gray-800">${form.fields['Material'] || 'N/A'}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Finish</label>
                  <div class="text-gray-800">${form.fields['Finish'] || 'N/A'}</div>
                </div>
                <div class="col-12">
                  <label class="text-muted fs-7 fw-semibold">Colors</label>
                  <div class="text-gray-800">${form.fields['Colors'] || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-warning">
              <h6 class="card-title mb-0 text-warning">
                <i class="ki-duotone ki-information-4 fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Additional Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="text-muted fs-7 fw-semibold">Barcode Required</label>
                  <div class="text-gray-800">${form.fields['Barcode Required'] ? '<span class="badge badge-light-success">Yes</span>' : '<span class="badge badge-light-secondary">No</span>'}</div>
                </div>
                ${form.fields['Barcode Type'] ? `
                  <div class="col-md-6">
                    <label class="text-muted fs-7 fw-semibold">Barcode Type</label>
                    <div class="text-gray-800">${form.fields['Barcode Type']}</div>
                  </div>
                ` : ''}
                ${form.fields['Ingredients'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Ingredients</label>
                    <div class="text-gray-800">${form.fields['Ingredients']}</div>
                  </div>
                ` : ''}
                ${form.fields['Regulatory Info'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Regulatory Info</label>
                    <div class="text-gray-800">${form.fields['Regulatory Info']}</div>
                  </div>
                ` : ''}
                ${form.fields['Special Instructions'] ? `
                  <div class="col-12">
                    <div class="alert alert-info d-flex align-items-center">
                      <i class="ki-duotone ki-information-5 fs-2x text-info me-3">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                      </i>
                      <div>
                        <div class="fw-bold">Special Instructions</div>
                        <div class="text-gray-700">${form.fields['Special Instructions']}</div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Status & Dates -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-success">
              <h6 class="card-title mb-0 text-success">
                <i class="ki-duotone ki-calendar-tick fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                  <span class="path6"></span>
                </i>
                Status & Dates
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="text-muted fs-7 fw-semibold">Current Status</label>
                  <div><span class="badge ${getStatusBadgeClass(form.fields['Artwork Status'])}">${form.fields['Artwork Status'] || 'Not Started'}</span></div>
                </div>
                <div class="col-md-4">
                  <label class="text-muted fs-7 fw-semibold">Submission Date</label>
                  <div class="text-gray-800">${form.fields['Submission Date'] ? new Date(form.fields['Submission Date']).toLocaleDateString() : 'N/A'}</div>
                </div>
                ${form.fields['Approval Date'] ? `
                  <div class="col-md-4">
                    <label class="text-muted fs-7 fw-semibold">Approval Date</label>
                    <div class="text-gray-800">${new Date(form.fields['Approval Date']).toLocaleDateString()}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Attached Files -->
          <div class="card shadow-sm">
            <div class="card-header bg-light-dark">
              <h6 class="card-title mb-0">
                <i class="ki-duotone ki-folder fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Attached Files
              </h6>
            </div>
            <div class="card-body">
              ${filesHtml}
            </div>
          </div>
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

  const handleEditForm = async (form: CompletedLabelForm) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Submission</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-profile-circle fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Customer Name
            </label>
            <input
              id="customerName"
              class="form-control form-control-solid"
              value="${form.fields['Customer Name'] || ''}"
              placeholder="Enter customer name"
            >
          </div>

          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-cube-2 fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Product Name
            </label>
            <input
              id="productName"
              class="form-control form-control-solid"
              value="${form.fields['Product Name'] || ''}"
              placeholder="Enter product name"
            >
          </div>

          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-tag fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Label Type
            </label>
            <select id="labelType" class="form-select form-select-solid">
              <option value="">Select label type...</option>
              <option value="Sticker Label" ${form.fields['Label Type'] === 'Sticker Label' ? 'selected' : ''}>🏷️ Sticker Label</option>
              <option value="Shrink Sleeve" ${form.fields['Label Type'] === 'Shrink Sleeve' ? 'selected' : ''}>📦 Shrink Sleeve</option>
              <option value="Wrap Around" ${form.fields['Label Type'] === 'Wrap Around' ? 'selected' : ''}>🔄 Wrap Around</option>
              <option value="Front & Back" ${form.fields['Label Type'] === 'Front & Back' ? 'selected' : ''}>📄 Front & Back</option>
              <option value="Custom" ${form.fields['Label Type'] === 'Custom' ? 'selected' : ''}>⚙️ Custom</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-status fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
                <span class="path4"></span>
              </i>
              Artwork Status
            </label>
            <select id="artworkStatus" class="form-select form-select-solid">
              <option value="Not Started" ${form.fields['Artwork Status'] === 'Not Started' ? 'selected' : ''}>
                <span class="badge badge-light-secondary">Not Started</span>
              </option>
              <option value="In Progress" ${form.fields['Artwork Status'] === 'In Progress' ? 'selected' : ''}>
                <span class="badge badge-light-primary">In Progress</span>
              </option>
              <option value="Submitted" ${form.fields['Artwork Status'] === 'Submitted' ? 'selected' : ''}>
                <span class="badge badge-light-warning">Submitted</span>
              </option>
              <option value="Approved" ${form.fields['Artwork Status'] === 'Approved' ? 'selected' : ''}>
                <span class="badge badge-light-success">Approved</span>
              </option>
            </select>
            <div class="form-text">Update the current status of this artwork submission</div>
          </div>
        </div>
      `,
      width: 600,
      showCancelButton: true,
      confirmButtonText: '<i class="ki-duotone ki-check fs-2"></i> Save Changes',
      cancelButtonText: '<i class="ki-duotone ki-cross fs-2"></i> Cancel',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light me-3',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      },
      preConfirm: () => {
        const customerName = (document.getElementById('customerName') as HTMLInputElement).value;
        const productName = (document.getElementById('productName') as HTMLInputElement).value;
        const labelType = (document.getElementById('labelType') as HTMLSelectElement).value;
        const artworkStatus = (document.getElementById('artworkStatus') as HTMLSelectElement).value;

        if (!customerName.trim()) {
          Swal.showValidationMessage('Customer name is required');
          return false;
        }
        if (!productName.trim()) {
          Swal.showValidationMessage('Product name is required');
          return false;
        }
        if (!labelType) {
          Swal.showValidationMessage('Please select a label type');
          return false;
        }
        if (!artworkStatus) {
          Swal.showValidationMessage('Please select an artwork status');
          return false;
        }

        return { customerName, productName, labelType, artworkStatus };
      },
    });

    if (formValues) {
      try {
        await completedLabelFormsService.update(form.id, {
          'Customer Name': formValues.customerName,
          'Product Name': formValues.productName,
          'Label Type': formValues.labelType as any,
          'Artwork Status': formValues.artworkStatus as any,
        });
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Submission has been updated successfully.',
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
          text: 'Failed to update submission. Please try again.',
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
      case 'Not Started':
        return 'badge-light-secondary';
      case 'In Progress':
        return 'badge-light-primary';
      case 'Submitted':
        return 'badge-light-warning';
      case 'Approved':
        return 'badge-light-success';
      default:
        return 'badge-light';
    }
  };

  const getLabelTypeIcon = (type?: string) => {
    switch (type) {
      case 'Sticker Label':
        return '🏷️';
      case 'Shrink Sleeve':
        return '📦';
      case 'Wrap Around':
        return '🔄';
      case 'Front & Back':
        return '📄';
      case 'Custom':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const filteredForms = forms.filter(form => {
    const statusMatch = statusFilter === 'all' || form.fields['Artwork Status'] === statusFilter;
    const searchMatch = searchTerm === '' ||
      (form.fields['Customer Name'] && form.fields['Customer Name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.fields['Product Name'] && form.fields['Product Name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.fields['Form ID'] && form.fields['Form ID'].toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchMatch;
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
              className="form-select form-select-solid w-200px"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status ({forms.length})</option>
              <option value="Not Started">Not Started ({forms.filter(f => f.fields['Artwork Status'] === 'Not Started').length})</option>
              <option value="In Progress">In Progress ({forms.filter(f => f.fields['Artwork Status'] === 'In Progress').length})</option>
              <option value="Submitted">Submitted ({forms.filter(f => f.fields['Artwork Status'] === 'Submitted').length})</option>
              <option value="Approved">Approved ({forms.filter(f => f.fields['Artwork Status'] === 'Approved').length})</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        <table className="table align-middle table-row-dashed fs-6 gy-5">
          <thead>
            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
              <th className="min-w-125px">Form ID</th>
              <th className="min-w-125px">Customer</th>
              <th className="min-w-150px">Product Name</th>
              <th className="min-w-125px">Label Type</th>
              <th className="min-w-100px">Quantity</th>
              <th className="min-w-100px">Status</th>
              <th className="min-w-100px">Submission</th>
              <th className="text-end min-w-100px">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {filteredForms.map((form) => (
              <tr
                key={form.id}
                className="cursor-pointer"
                onClick={() => handleViewDetails(form)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <span className="text-gray-800 fw-bold">{form.fields['Form ID'] || 'N/A'}</span>
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
                    {getLabelTypeIcon(form.fields['Label Type'])} {form.fields['Label Type'] || 'N/A'}
                  </span>
                </td>
                <td>
                  <span className="text-gray-800">
                    {form.fields['Quantity'] ? form.fields['Quantity'].toLocaleString() : 'N/A'}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge ${getStatusBadgeClass(form.fields['Artwork Status'])}`}
                  >
                    {form.fields['Artwork Status'] || 'Not Started'}
                  </span>
                </td>
                <td>
                  {form.fields['Submission Date']
                    ? new Date(form.fields['Submission Date']).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-light btn-active-light-primary me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(form);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-light-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditForm(form);
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
