import { useState, useEffect } from 'react';
import { leadsService, teamMemberService, contactService } from '../../services/airtable.service';
import type { Lead, TeamMember } from '../../types/airtable.types';
import SkeletonLoader from '../Common/SkeletonLoader';

declare const Swal: any;

type LeadStatus = 'New Lead' | 'Attempted to Contact' | 'Contacted' | 'Qualified' | 'Unqualified';

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsData, teamMembersData] = await Promise.all([
        leadsService.getAll(),
        teamMemberService.getAll(),
      ]);
      setLeads(leadsData);
      setTeamMembers(teamMembersData);
      setError(null);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await leadsService.update(leadId, { Status: newStatus });
      loadData();
    } catch (error) {
      if (typeof Swal !== 'undefined') {
        Swal.fire('Error', 'Failed to update lead status', 'error');
      }
      console.error(error);
    }
  };

  const handleAssignOwner = async (leadId: string, currentOwner?: string[]) => {
    if (typeof Swal === 'undefined') return;

    const teamMemberOptions = teamMembers.reduce((acc, member) => {
      acc[member.id] = member.fields['Name'] || 'Unknown';
      return acc;
    }, {} as Record<string, string>);

    const { value: ownerId } = await Swal.fire({
      title: 'Assign Lead Owner',
      input: 'select',
      inputOptions: {
        '': '-- Select Owner --',
        ...teamMemberOptions,
      },
      inputValue: currentOwner && currentOwner[0] ? currentOwner[0] : '',
      showCancelButton: true,
      confirmButtonText: 'Assign',
    });

    if (ownerId !== undefined && ownerId !== '') {
      try {
        await leadsService.update(leadId, { Owner: [ownerId] });
        await Swal.fire('Assigned!', 'Lead owner has been assigned.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Failed to assign lead owner', 'error');
        console.error(error);
      }
    }
  };

  const handleCardClick = async (lead: Lead) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-profile-user fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
          <span class="path3"></span>
          <span class="path4"></span>
        </i>
        <span>${Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].length > 0 ? lead.fields['Contact'][0] : 'Lead Details'}</span>
      </div>`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
          <!-- Contact Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-primary">
              <h6 class="card-title mb-0 text-primary">
                <i class="ki-duotone ki-profile-circle fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Contact Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Company</label>
                  <div class="text-gray-800 fw-bold">${lead.fields['Company'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Title</label>
                  <div class="text-gray-800">${lead.fields['Title'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Email</label>
                  <div class="text-gray-800">${lead.fields['Email'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Phone</label>
                  <div class="text-gray-800">${lead.fields['Phone'] || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lead Status & Assignment -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-info">
              <h6 class="card-title mb-0 text-info">
                <i class="ki-duotone ki-status fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Status & Assignment
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Status</label>
                  <div>
                    <span class="badge badge-light-primary fs-7">${lead.fields['Status'] || 'N/A'}</span>
                  </div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Owner</label>
                  <div class="text-gray-800">${getOwnerName(lead.fields['Owner'])}</div>
                </div>
                ${lead.fields['Last Interaction'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Last Interaction</label>
                    <div class="text-gray-800">${new Date(lead.fields['Last Interaction']).toLocaleDateString()}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Activity Summary -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-success">
              <h6 class="card-title mb-0 text-success">
                <i class="ki-duotone ki-chart-simple fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Activity Summary
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Activities</label>
                  <div class="text-gray-800 fw-bold fs-4">${Array.isArray(lead.fields['Activities']) ? lead.fields['Activities'].length : 0}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Deals</label>
                  <div class="text-gray-800 fw-bold fs-4">${Array.isArray(lead.fields['Deals']) ? lead.fields['Deals'].length : 0}</div>
                </div>
                ${lead.fields['Created on'] ? `
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Created On</label>
                    <div class="text-gray-800">${new Date(lead.fields['Created on']).toLocaleDateString()}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="ki-duotone ki-pencil fs-2"></i> Edit',
      denyButtonText: '<i class="ki-duotone ki-trash fs-2"></i> Delete',
      cancelButtonText: 'Close',
      denyButtonColor: '#f1416c',
      width: 900,
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-primary',
        denyButton: 'btn btn-danger',
        cancelButton: 'btn btn-light me-3',
        popup: 'rounded',
        title: 'fs-4',
        htmlContainer: 'p-0'
      }
    });

    if (result.isConfirmed) {
      // Edit (confirm button)
      handleEditLead(lead);
    } else if (result.isDenied) {
      // Delete (deny button)
      handleDeleteLead(lead);
    }
    // else: Close (cancel button) - do nothing
  };

  const handleEditLead = async (lead: Lead) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Lead</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-abstract-21 fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Company
            </label>
            <input
              id="company"
              class="form-control form-control-solid"
              value="${lead.fields['Company'] || ''}"
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
                Email
              </label>
              <input
                id="email"
                type="email"
                class="form-control form-control-solid"
                value="${lead.fields['Email'] || ''}"
                placeholder="email@example.com"
              >
            </div>
            <div class="col-6">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-phone fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Phone
              </label>
              <input
                id="phone"
                class="form-control form-control-solid"
                value="${lead.fields['Phone'] || ''}"
                placeholder="+234 XXX XXX XXXX"
              >
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-badge fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
                <span class="path4"></span>
                <span class="path5"></span>
              </i>
              Job Title
            </label>
            <input
              id="title"
              class="form-control form-control-solid"
              value="${lead.fields['Title'] || ''}"
              placeholder="Enter job title"
            >
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="ki-duotone ki-check fs-2"></i> Update Lead',
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
        const company = (document.getElementById('company') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const phone = (document.getElementById('phone') as HTMLInputElement).value;
        const title = (document.getElementById('title') as HTMLInputElement).value;

        return { company, email, phone, title };
      },
    });

    if (formValues) {
      try {
        const updateData: Partial<Lead['fields']> = {};

        if (formValues.company) updateData.Company = formValues.company;
        if (formValues.email) updateData.Email = formValues.email;
        if (formValues.phone) updateData.Phone = formValues.phone;
        if (formValues.title) updateData.Title = formValues.title;

        await leadsService.update(lead.id, updateData);
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Lead has been updated successfully.',
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
          text: 'Failed to update lead. Please try again.',
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

  const handleDeleteLead = async (lead: Lead) => {
    if (typeof Swal === 'undefined') return;

    const contactName = Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].length > 0
      ? lead.fields['Contact'][0]
      : 'this lead';

    const result = await Swal.fire({
      title: 'Are you sure?',
      html: `Do you want to delete <strong>${contactName}</strong>?<br/><br/>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f1416c',
    });

    if (result.isConfirmed) {
      try {
        await leadsService.delete(lead.id);
        await Swal.fire('Deleted!', 'Lead has been deleted successfully.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete lead', 'error');
        console.error(error);
      }
    }
  };

  const handleViewContact = async (lead: Lead) => {
    if (typeof Swal === 'undefined') return;

    // Check if lead has a linked contact
    if (!lead.fields['Lead'] || !Array.isArray(lead.fields['Lead']) || lead.fields['Lead'].length === 0) {
      Swal.fire('No Contact', 'This lead is not linked to a contact record.', 'info');
      return;
    }

    try {
      // Fetch the linked contact
      const contactId = lead.fields['Lead'][0];
      const contact = await contactService.getById(contactId);

      Swal.fire({
        title: contact.fields['Name'] || 'Contact Details',
        html: `
          <div class="text-start">
            <p><strong>Phone:</strong> ${contact.fields['Phone'] || 'N/A'}</p>
            <p><strong>Email:</strong> ${contact.fields['Email'] || 'N/A'}</p>
            <p><strong>Contact ID:</strong> ${contact.fields['Contact ID'] || 'N/A'}</p>
            <p><strong>Created:</strong> ${contact.fields['Created on'] ? new Date(contact.fields['Created on']).toLocaleDateString() : 'N/A'}</p>
            ${contact.fields['Lead Status'] && Array.isArray(contact.fields['Lead Status']) ? `
              <p><strong>Status:</strong> ${contact.fields['Lead Status'].join(', ')}</p>
            ` : ''}
            <p><strong>Activities:</strong> ${Array.isArray(contact.fields['Activities']) ? contact.fields['Activities'].length : 0}</p>
            <p><strong>Deals:</strong> ${Array.isArray(contact.fields['Deals']) ? contact.fields['Deals'].length : 0}</p>
          </div>
        `,
        width: 600,
      });
    } catch (error) {
      console.error('Error fetching contact:', error);
      Swal.fire('Error', 'Failed to load contact details', 'error');
    }
  };

  const handleViewDetails = (lead: Lead) => {
    if (typeof Swal === 'undefined') return;

    Swal.fire({
      title: Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].length > 0
        ? lead.fields['Contact'][0]
        : 'Lead Details',
      html: `
        <div class="text-start">
          <p><strong>Company:</strong> ${lead.fields['Company'] || 'N/A'}</p>
          <p><strong>Email:</strong> ${lead.fields['Email'] || 'N/A'}</p>
          <p><strong>Phone:</strong> ${lead.fields['Phone'] || 'N/A'}</p>
          <p><strong>Title:</strong> ${lead.fields['Title'] || 'N/A'}</p>
          <p><strong>Status:</strong> ${lead.fields['Status'] || 'N/A'}</p>
          <p><strong>Owner:</strong> ${getOwnerName(lead.fields['Owner'])}</p>
          <p><strong>Last Interaction:</strong> ${lead.fields['Last Interaction'] ? new Date(lead.fields['Last Interaction']).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Activities:</strong> ${Array.isArray(lead.fields['Activities']) ? lead.fields['Activities'].length : 0}</p>
          <p><strong>Deals:</strong> ${Array.isArray(lead.fields['Deals']) ? lead.fields['Deals'].length : 0}</p>
        </div>
      `,
      width: 600,
    });
  };

  const getOwnerName = (ownerIds?: string[]) => {
    if (!ownerIds || ownerIds.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerIds[0]);
    return owner?.fields['Name'] || 'Unknown';
  };

  const getColumnColor = (status: LeadStatus) => {
    switch (status) {
      case 'New Lead':
        return '#009ef7';      // Blue
      case 'Attempted to Contact':
        return '#ffc700';      // Yellow
      case 'Contacted':
        return '#7239ea';      // Purple
      case 'Qualified':
        return '#50cd89';      // Green
      case 'Unqualified':
        return '#f1416c';      // Red
      default:
        return '#e4e6ef';      // Light gray
    }
  };

  const columns: { status: LeadStatus; title: string }[] = [
    { status: 'New Lead', title: 'New Lead' },
    { status: 'Attempted to Contact', title: 'Attempted to Contact' },
    { status: 'Contacted', title: 'Contacted' },
    { status: 'Qualified', title: 'Qualified' },
    { status: 'Unqualified', title: 'Unqualified' },
  ];

  const getLeadsByStatus = (status: LeadStatus) => {
    const filtered = leads.filter(lead => {
      const matchesStatus = lead.fields['Status'] === status;
      const matchesSearch = searchTerm === '' ||
        (Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        lead.fields['Company']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.fields['Email']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.fields['Phone']?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    return filtered;
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header border-0 pt-6">
          <div className="card-title">
            <div style={{ height: '40px', width: '300px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
          </div>
          <div className="card-toolbar">
            <div style={{ height: '40px', width: '120px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="card-body py-4">
          <SkeletonLoader type="kanban" />
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
              placeholder="Search leads..."
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
        {columns.map((column) => {
          const columnLeads = getLeadsByStatus(column.status);
          return (
            <div key={column.status} className="flex-shrink-0" style={{ width: '320px' }}>
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle me-2"
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getColumnColor(column.status),
                      }}
                    ></div>
                    <h3 className="fs-5 fw-bold mb-0">{column.title}</h3>
                  </div>
                  <span className="badge badge-light-primary">{columnLeads.length}</span>
                </div>
                <div className="separator separator-dashed mb-4"></div>
              </div>

              {/* Column Cards */}
              <div className="d-flex flex-column gap-3">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="card card-flush cursor-pointer hover-elevate-up"
                    onClick={() => handleCardClick(lead)}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div className="card-body p-5">
                      {/* Contact Name */}
                      <div className="d-flex align-items-center mb-3">
                        <div className="symbol symbol-40px me-3">
                          <div className="symbol-label fs-5 fw-bold bg-light-primary text-primary">
                            {Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].length > 0
                              ? lead.fields['Contact'][0][0]?.toUpperCase()
                              : '?'}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <span className="text-gray-900 fw-bold d-block fs-6">
                            {Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].length > 0
                              ? lead.fields['Contact'][0]
                              : 'N/A'}
                          </span>
                          {lead.fields['Title'] && (
                            <span className="text-muted fs-7">{lead.fields['Title']}</span>
                          )}
                        </div>
                      </div>

                      {/* Company */}
                      {lead.fields['Company'] && (
                        <div className="mb-2">
                          <i className="ki-duotone ki-shop fs-6 text-gray-500 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          <span className="text-gray-700 fs-7">{lead.fields['Company']}</span>
                        </div>
                      )}

                      {/* Email */}
                      {lead.fields['Email'] && (
                        <div className="mb-2">
                          <i className="ki-duotone ki-sms fs-6 text-gray-500 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          <span className="text-gray-700 fs-7">{lead.fields['Email']}</span>
                        </div>
                      )}

                      {/* Phone */}
                      {lead.fields['Phone'] && (
                        <div className="mb-3">
                          <i className="ki-duotone ki-phone fs-6 text-gray-500 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          <span className="text-gray-700 fs-7">{lead.fields['Phone']}</span>
                        </div>
                      )}

                      {/* Owner */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span
                          className="text-gray-600 fs-7 cursor-pointer text-hover-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignOwner(lead.id, lead.fields['Owner']);
                          }}
                          title="Click to assign owner"
                        >
                          <i className="ki-duotone ki-user fs-6 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          {getOwnerName(lead.fields['Owner'])}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2">
                        {column.status !== 'Qualified' && (
                          <button
                            className="btn btn-sm btn-light-success flex-grow-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewContact(lead);
                            }}
                          >
                            <i className="ki-duotone ki-arrow-right fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                            View Contact
                          </button>
                        )}
                        {column.status !== 'Unqualified' && (
                          <button
                            className="btn btn-sm btn-light-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(lead.id, 'Unqualified');
                            }}
                            title="Mark as Unqualified"
                          >
                            <i className="ki-duotone ki-cross fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-light"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(lead);
                          }}
                          title="View Details"
                        >
                          <i className="ki-duotone ki-eye fs-5">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                          </i>
                        </button>
                      </div>

                      {/* Created Date */}
                      <div className="text-muted fs-8 mt-3">
                        {lead.fields['Created on']
                          ? new Date(lead.fields['Created on']).toLocaleDateString()
                          : ''}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {columnLeads.length === 0 && (
                  <div className="text-center py-10 text-muted">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Total: {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
