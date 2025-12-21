import { useState, useEffect } from 'react';
import { contactService, activityService, dealsService, teamMemberService } from '../../services/airtable.service';
import type { Contact, Deal, TeamMember, Activity } from '../../types/airtable.types';

declare const Swal: any;

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await contactService.getAll();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    if (typeof Swal === 'undefined') return;

    try {
      // Fetch team members for the Created by dropdown
      const teamMembers = await teamMemberService.getAll();

      const { value: formValues } = await Swal.fire({
        title: 'Create New Contact',
        html: `
          <div class="modal-form-section">
            <div class="modal-form-group">
              <label class="modal-form-label required">
                <i class="ki-duotone ki-phone fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Phone Number
              </label>
              <input
                id="phone"
                class="form-control form-control-solid"
                placeholder="Enter phone number"
                required
              />
            </div>
            <div class="modal-form-group">
              <label class="modal-form-label">
                <i class="ki-duotone ki-profile-circle fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Full Name
              </label>
              <input
                id="name"
                class="form-control form-control-solid"
                placeholder="Enter full name"
              />
            </div>
            <div class="modal-form-group">
              <label class="modal-form-label">
                <i class="ki-duotone ki-sms fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                class="form-control form-control-solid"
                placeholder="Enter email address"
              />
            </div>
            <div class="modal-form-group">
              <label class="modal-form-label">
                <i class="ki-duotone ki-user-tick fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Created By
              </label>
              <select id="createdBy" class="form-select form-select-solid">
                <option value="">Select creator...</option>
                ${teamMembers.map((member: TeamMember) =>
                  `<option value="${member.id}">${member.fields['Name']}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Contact',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light me-3',
          popup: 'rounded',
          title: 'fs-4',
          htmlContainer: 'p-0'
        },
        width: 600,
        preConfirm: () => {
          const phone = (document.getElementById('phone') as HTMLInputElement).value;
          const name = (document.getElementById('name') as HTMLInputElement).value;
          const email = (document.getElementById('email') as HTMLInputElement).value;
          const createdBy = (document.getElementById('createdBy') as HTMLSelectElement).value;

          if (!phone) {
            Swal.showValidationMessage('Phone number is required');
            return false;
          }

          return { phone, name, email, createdBy };
        },
      });

      if (formValues) {
        // Build contact data object
        const contactData: Partial<Contact['fields']> & { Phone: string } = {
          Phone: formValues.phone,
        };

        // Add optional fields only if they have values
        if (formValues.name) {
          contactData.Name = formValues.name;
        }

        if (formValues.email) {
          contactData.Email = formValues.email;
        }

        if (formValues.createdBy) {
          contactData['Created by'] = [formValues.createdBy];
        }

        await contactService.create(contactData as Contact['fields']);

        await Swal.fire('Created!', 'Contact has been created successfully.', 'success');
        loadContacts();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to create contact', 'error');
      console.error(error);
    }
  };

  const handleContactClick = async (contact: Contact) => {
    if (typeof Swal === 'undefined') return;

    await Swal.fire({
      title: `${contact.fields['Name'] || 'Contact Details'}`,
      html: `
        <!-- Action Buttons Bar -->
        <div class="modal-actions-bar">
          <button class="btn btn-primary" data-action="add-activity">
            <i class="ki-duotone ki-calendar-add fs-5 me-1">
              <span class="path1"></span>
              <span class="path2"></span>
              <span class="path3"></span>
              <span class="path4"></span>
            </i>
            Add Activity
          </button>
          <button class="btn btn-light" data-action="edit">
            <i class="ki-duotone ki-pencil fs-5 me-1"><span class="path1"></span><span class="path2"></span></i>
            Edit
          </button>
          <button class="btn btn-secondary" data-action="delete">
            <i class="ki-duotone ki-trash fs-5 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
            Delete
          </button>
        </div>

        <!-- Contact Information Section -->
        <div class="modal-section">
          <div class="modal-section-title">
            <i class="ki-duotone ki-profile-circle fs-4">
              <span class="path1"></span>
              <span class="path2"></span>
              <span class="path3"></span>
            </i>
            Contact Information
          </div>
          <div class="modal-info-grid">
            <div class="modal-info-item">
              <div class="modal-info-label">Contact ID</div>
              <div class="modal-info-value">${contact.fields['Contact ID'] || 'N/A'}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Phone Number</div>
              <div class="modal-info-value">${contact.fields['Phone'] || 'N/A'}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Email Address</div>
              <div class="modal-info-value">${contact.fields['Email'] || 'N/A'}</div>
            </div>
            <div class="modal-info-item">
              <div class="modal-info-label">Created On</div>
              <div class="modal-info-value">${contact.fields['Created on'] ? new Date(contact.fields['Created on']).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Lead Status Section -->
        ${contact.fields['Lead Status'] && Array.isArray(contact.fields['Lead Status']) && contact.fields['Lead Status'].length > 0 ? `
        <div class="modal-section">
          <div class="modal-section-title">
            <i class="ki-duotone ki-chart-simple fs-4">
              <span class="path1"></span>
              <span class="path2"></span>
              <span class="path3"></span>
              <span class="path4"></span>
            </i>
            Lead Status
          </div>
          <div class="modal-info-grid">
            <div class="modal-info-item">
              <div class="modal-info-label">Status</div>
              <div class="modal-info-value">
                ${contact.fields['Lead Status'].map(status => {
                  return `<span class="badge badge-primary me-1 mb-1">${status}</span>`;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
        ` : ''}
      `,
      showConfirmButton: false,
      showCloseButton: true,
      buttonsStyling: false,
      customClass: {
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      },
      width: 900,
      didOpen: () => {
        // Add event listeners to action buttons
        document.querySelector('[data-action="add-activity"]')?.addEventListener('click', () => {
          Swal.close();
          handleAddActivity(contact);
        });
        document.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
          Swal.close();
          handleEditContact(contact);
        });
        document.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
          Swal.close();
          handleDeleteContact(contact);
        });
      },
    });
  };

  const handleAddActivity = async (contact: Contact) => {
    if (typeof Swal === 'undefined') return;

    try {
      // Fetch deals and team members for dropdowns
      const [deals, teamMembers] = await Promise.all([
        dealsService.getAll(),
        teamMemberService.getAll(),
      ]);

      // Create current date
      const currentDate = new Date();

      const { value: formValues } = await Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-calendar-add fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
            <span class="path4"></span>
            <span class="path5"></span>
            <span class="path6"></span>
          </i>
          <span>Add Activity for ${contact.fields['Name'] || 'Contact'}</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-note-2 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Activity
              </label>
              <input
                id="activity"
                class="form-control form-control-solid"
                placeholder="Enter activity description"
                required
              />
            </div>
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-abstract-26 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Activity Type
              </label>
              <select id="activityType" class="form-select form-select-solid">
                <option value="">Select type...</option>
                <option value="Meeting">📅 Meeting</option>
                <option value="Phone Call">📞 Phone Call</option>
                <option value="Call Summary">📝 Call Summary</option>
                <option value="WhatsApp Chat">💬 WhatsApp Chat</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-check-circle fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Status
              </label>
              <select id="activityStatus" class="form-select form-select-solid">
                <option value="Open" selected>Open</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-double-check fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                  <span class="path6"></span>
                </i>
                Related Deals
              </label>
              <select id="relatedDeals" class="form-select form-select-solid">
                <option value="">Select deal...</option>
                ${deals.map((deal: Deal) =>
                  `<option value="${deal.id}">${deal.fields['Deal Name']} ${deal.fields['Amount'] ? `- $${deal.fields['Amount']}` : ''}</option>`
                ).join('')}
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-user-tick fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Owner
              </label>
              <select id="owner" class="form-select form-select-solid">
                <option value="">Select owner...</option>
                ${teamMembers.map((member: TeamMember) =>
                  `<option value="${member.id}">${member.fields['Name']}</option>`
                ).join('')}
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Created on
              </label>
              <input
                id="createdOn"
                type="date"
                class="form-control form-control-solid"
                value="${currentDate.toISOString().split('T')[0]}"
              />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-text-align-left fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Activity Summary
              </label>
              <textarea
                id="activitySummary"
                class="form-control form-control-solid"
                rows="4"
                placeholder="Enter additional details..."
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Activity',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light me-3',
          popup: 'rounded',
          title: 'fs-4',
          htmlContainer: 'p-0'
        },
        width: 700,
        preConfirm: () => {
          const activity = (document.getElementById('activity') as HTMLInputElement).value;
          const activityType = (document.getElementById('activityType') as HTMLSelectElement).value;
          const activitySummary = (document.getElementById('activitySummary') as HTMLTextAreaElement).value;
          const activityStatus = (document.getElementById('activityStatus') as HTMLSelectElement).value;
          const relatedDeals = (document.getElementById('relatedDeals') as HTMLSelectElement).value;
          const owner = (document.getElementById('owner') as HTMLSelectElement).value;
          const createdOn = (document.getElementById('createdOn') as HTMLInputElement).value;

          if (!activity) {
            Swal.showValidationMessage('Activity description is required');
            return false;
          }

          if (!activityType) {
            Swal.showValidationMessage('Activity type is required');
            return false;
          }

          return {
            activity,
            activityType,
            activitySummary,
            activityStatus,
            relatedDeals,
            owner,
            createdOn
          };
        },
      });

      if (formValues) {
        // Generate activity number
        const activityNumber = `ACT-${Date.now()}`;

        // Build activity data object with proper typing
        const activityData: Partial<Activity['fields']> & { 'Activity Number': string } = {
          'Activity Number': activityNumber,
          'Activity': formValues.activity,
          'Activity Type': formValues.activityType as 'Meeting' | 'Phone Call' | 'Call Summary' | 'WhatsApp Chat',
          'Status': formValues.activityStatus as 'Open' | 'Done',
          'Contact 2': [contact.id],
        };

        // Add optional fields only if they have values
        if (formValues.activitySummary) {
          activityData['Activity Summary (Activity)'] = formValues.activitySummary;
        }

        if (formValues.relatedDeals) {
          activityData['Related Deals'] = [formValues.relatedDeals];
        }

        if (formValues.owner) {
          activityData['Owner'] = [formValues.owner];
        }

        if (formValues.createdOn) {
          // Parse the date and convert to ISO format for Airtable
          try {
            const parsedDate = new Date(formValues.createdOn);
            if (!isNaN(parsedDate.getTime())) {
              activityData['Start time'] = parsedDate.toISOString();
            }
          } catch (e) {
            console.warn('Could not parse date:', e);
          }
        }

        await activityService.create(activityData as Activity['fields']);

        await Swal.fire('Added!', 'Activity has been added successfully.', 'success');
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to add activity', 'error');
      console.error(error);
    }
  };

  const handleEditContact = async (contact: Contact) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Contact</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-phone fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Phone Number
            </label>
            <input
              id="phone"
              class="form-control form-control-solid"
              value="${contact.fields['Phone']}"
              placeholder="Enter phone number"
              required
            />
          </div>
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-profile-circle fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Name
            </label>
            <input
              id="name"
              class="form-control form-control-solid"
              value="${contact.fields['Name'] || ''}"
              placeholder="Enter name"
            />
          </div>
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-sms fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Email
            </label>
            <input
              id="email"
              type="email"
              class="form-control form-control-solid"
              value="${contact.fields['Email'] || ''}"
              placeholder="Enter email address"
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Contact',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-light me-3',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      },
      width: 600,
      preConfirm: () => {
        const phone = (document.getElementById('phone') as HTMLInputElement).value;
        const name = (document.getElementById('name') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;

        if (!phone) {
          Swal.showValidationMessage('Phone number is required');
          return false;
        }

        return { phone, name, email };
      },
    });

    if (formValues) {
      try {
        await contactService.update(contact.id, {
          Phone: formValues.phone,
          Name: formValues.name || undefined,
          Email: formValues.email || undefined,
        });

        await Swal.fire('Updated!', 'Contact has been updated successfully.', 'success');
        loadContacts();
      } catch (error) {
        Swal.fire('Error', 'Failed to update contact', 'error');
        console.error(error);
      }
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      html: `Do you want to delete contact <strong>${contact.fields['Name'] || contact.fields['Phone']}</strong>?<br/><br/>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f1416c',
    });

    if (result.isConfirmed) {
      try {
        await contactService.delete(contact.id);
        await Swal.fire('Deleted!', 'Contact has been deleted successfully.', 'success');
        loadContacts();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete contact', 'error');
        console.error(error);
      }
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = searchTerm === '' ||
      contact.fields['Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.fields['Email']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.fields['Phone']?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === '' ||
      contact.fields['Lead Status']?.includes(filterStatus as never);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'New Lead': 'badge-light-primary',
      'Attempted to Contact': 'badge-light-warning',
      'Contacted': 'badge-light-info',
      'Qualified': 'badge-light-success',
      'Unqualified': 'badge-light-danger',
    };
    return statusMap[status] || 'badge-light-secondary';
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadContacts}>
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
              placeholder="Search contacts..."
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
              <option value="New Lead">New Lead</option>
              <option value="Attempted to Contact">Attempted to Contact</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>

            <button className="btn btn-light" onClick={loadContacts}>
              <i className="ki-duotone ki-arrows-circle fs-2">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Refresh
            </button>

            <button className="btn btn-primary" onClick={handleCreateContact}>
              <i className="ki-duotone ki-plus fs-2"></i>
              Create Contact
            </button>
          </div>
        </div>
      </div>

      <div className="card-body py-4">
        <div className="table-responsive">
          <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
            <thead>
              <tr className="fw-bold text-muted">
                <th className="min-w-100px">Contact ID</th>
                <th className="min-w-150px">Name</th>
                <th className="min-w-150px">Email</th>
                <th className="min-w-120px">Phone</th>
                <th className="min-w-150px">Lead Status</th>
                <th className="min-w-120px">Created On</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="text-gray-600">No contacts found</div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => handleContactClick(contact)}
                    style={{ cursor: 'pointer' }}
                    className="hover-bg-light-primary"
                  >
                    <td>
                      <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                        {contact.fields['Contact ID'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="symbol symbol-45px me-5">
                          <div className="symbol-label fs-3 bg-light-primary text-primary">
                            {contact.fields['Name']?.[0]?.toUpperCase() || '?'}
                          </div>
                        </div>
                        <div className="d-flex justify-content-start flex-column">
                          <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                            {contact.fields['Name'] || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-900 fw-bold d-block fs-6">
                        {contact.fields['Email'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-900 fw-bold d-block fs-6">
                        {contact.fields['Phone'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {Array.isArray(contact.fields['Lead Status']) && contact.fields['Lead Status'].map((status, index) => (
                          <span key={index} className={`badge ${getStatusBadgeClass(status)}`}>
                            {status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-600">
                        {contact.fields['Created on']
                          ? new Date(contact.fields['Created on']).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </div>
      </div>
    </div>
  );
}
