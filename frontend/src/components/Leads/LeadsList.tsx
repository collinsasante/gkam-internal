
import { useState, useEffect } from 'react';
import { leadsService, teamMemberService, contactService } from '../../services/airtable.service';
import type { Lead, TeamMember } from '../../types/airtable.types';
import SkeletonLoader from '../Common/SkeletonLoader';
import Modal from '../Common/Modal';



type LeadStatus = 'New Lead' | 'Attempted to Contact' | 'Contacted' | 'Qualified' | 'Unqualified';

export default function LeadsList() {
  console.log('✅ LeadsList Component Version: REFACK-MODAL-V1');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'Created on', direction: 'desc' });

  // Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [tempOwnerId, setTempOwnerId] = useState<string>('');

  // Status/Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const handleDeleteClick = (leadId: string) => {
    setLeadToDelete(leadId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (leadToDelete) {
      try {
        await leadsService.delete(leadToDelete);
        loadData();
        setShowDeleteConfirm(false);
        setLeadToDelete(null);
        setIsDetailsModalOpen(false);
        showFeedback('success', 'Lead has been deleted successfully.');
      } catch (error) {
        console.error(error);
        showFeedback('error', 'Failed to delete lead.');
      }
    }
  };

  // Edit Form State
  const [editForm, setEditForm] = useState({
    company: '',
    email: '',
    phone: '',
    title: ''
  });

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
      showFeedback('success', 'Lead status updated.');
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to update lead status.');
    }
  };

  const handleAssignOwner = (leadId: string, currentOwner?: string[]) => {
    setAssignLeadId(leadId);
    setTempOwnerId(currentOwner && currentOwner[0] ? currentOwner[0] : '');
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (assignLeadId && tempOwnerId) {
      try {
        await leadsService.update(assignLeadId, { Owner: [tempOwnerId] });
        showFeedback('success', 'Lead owner has been assigned.');
        setIsAssignModalOpen(false);
        loadData();
      } catch (error) {
        console.error(error);
        showFeedback('error', 'Failed to assign lead owner.');
      }
    }
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({
      company: lead.fields['Company'] || '',
      email: lead.fields['Email'] || '',
      phone: lead.fields['Phone'] || '',
      title: lead.fields['Title'] || ''
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false); // Close details if open
  };

  const handleDeleteLeadFromDetails = async () => {
    if (selectedLead) {
      handleDeleteClick(selectedLead.id);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;

    try {
      const updateData: Partial<Lead['fields']> = {
        Company: editForm.company,
        Email: editForm.email,
        Phone: editForm.phone,
        Title: editForm.title
      };

      await leadsService.update(selectedLead.id, updateData);

      // Update local state
      const updatedLead = { ...selectedLead, fields: { ...selectedLead.fields, ...updateData } };
      setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
      setSelectedLead(updatedLead);

      setIsEditModalOpen(false);
      setIsDetailsModalOpen(true); // Re-open details
      showFeedback('success', 'Lead has been updated successfully.');
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to update lead.');
    }
  };

  const handleViewContact = async (lead: Lead) => {
    // Check if lead has a linked contact
    if (!lead.fields['Lead'] || !Array.isArray(lead.fields['Lead']) || lead.fields['Lead'].length === 0) {
      showFeedback('error', 'This lead is not linked to a contact record.');
      return;
    }

    try {
      // Fetch the linked contact
      const contactId = lead.fields['Lead'][0];
      const contact = await contactService.getById(contactId);
      setSelectedContact(contact);
      setIsContactModalOpen(true);
    } catch (error) {
      console.error('Error fetching contact:', error);
      showFeedback('error', 'Failed to load contact details.');
    }
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
    let filtered = leads.filter(lead => {
      const matchesStatus = lead.fields['Status'] === status;
      const matchesSearch = searchTerm === '' ||
        (Array.isArray(lead.fields['Contact']) && lead.fields['Contact'].some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        lead.fields['Company']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.fields['Email']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.fields['Phone']?.toLowerCase().includes(searchTerm.toLowerCase());

      const createdOn = lead.fields['Created on'] || '';
      const matchesDate = (!dateFilter.start || createdOn >= dateFilter.start) &&
        (!dateFilter.end || createdOn <= dateFilter.end);

      return matchesStatus && matchesSearch && matchesDate;
    });

    // Sort leads
    filtered = [...filtered].sort((a, b) => {
      let valA = a.fields[sortConfig.key as keyof typeof a.fields] || '';
      let valB = b.fields[sortConfig.key as keyof typeof b.fields] || '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
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
    <>
      {/* Feedback Alert */}
      {feedback.type && (
        <div
          className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-5`}
          style={{ zIndex: 9999, minWidth: '300px' }}
        >
          {feedback.message}
        </div>
      )}

      <div className="card">
        <div className="card-header border-0 pt-6">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center position-relative my-1">
              <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              <input
                type="text"
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <input
                type="date"
                className="form-control form-control-solid w-150px"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                title="Start Date"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                className="form-control form-control-solid w-150px"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                title="End Date"
              />
            </div>
            <select
              className="form-select w-150px"
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
              }}
            >
              <option value="Created on-desc">Newest First</option>
              <option value="Created on-asc">Oldest First</option>
              <option value="Company-asc">Company (A-Z)</option>
              <option value="Contact-asc">Name (A-Z)</option>
            </select>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-3">
            <button className="btn btn-sm btn-light" onClick={loadData} disabled={loading}>
              <i className={`ki-duotone ki-arrows-circle fs-2 ${loading ? 'rotate' : ''}`}>
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
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
                                handleEditClick(lead);
                              }}
                              title="Edit Lead"
                            >
                              <i className="ki-duotone ki-pencil fs-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                              </i>
                            </button>
                            <button
                              className="btn btn-sm btn-light-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(lead.id);
                              }}
                              title="Delete Lead"
                            >
                              <i className="ki-duotone ki-trash fs-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedLead ? (Array.isArray(selectedLead.fields['Contact']) && selectedLead.fields['Contact'].length > 0 ? selectedLead.fields['Contact'][0] : 'Lead Details') : 'Lead Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            {selectedLead && (
              <>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteLeadFromDetails}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleEditClick(selectedLead)}
                >
                  Edit
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedLead && (
          <div className="p-2">
            {/* Contact Information */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-primary min-h-40px px-4 py-2">
                <h6 className="card-title mb-0 text-primary fs-6">
                  <i className="ki-duotone ki-profile-circle fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  Contact Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Company</label>
                    <div className="text-gray-800 fw-bold">{selectedLead.fields['Company'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Title</label>
                    <div className="text-gray-800">{selectedLead.fields['Title'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Email</label>
                    <div className="text-gray-800">{selectedLead.fields['Email'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Phone</label>
                    <div className="text-gray-800">{selectedLead.fields['Phone'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Assignment */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-info min-h-40px px-4 py-2">
                <h6 className="card-title mb-0 text-info fs-6">
                  <i className="ki-duotone ki-status fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                  Status & Assignment
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Status</label>
                    <div>
                      <span className="badge badge-light-primary fs-7">{selectedLead.fields['Status'] || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Owner</label>
                    <div className="text-gray-800">{getOwnerName(selectedLead.fields['Owner'])}</div>
                  </div>
                  {selectedLead.fields['Last Interaction'] && (
                    <div className="col-12">
                      <label className="text-muted fs-7 fw-semibold">Last Interaction</label>
                      <div className="text-gray-800">{new Date(selectedLead.fields['Last Interaction']).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="card shadow-sm">
              <div className="card-header bg-light-success min-h-40px px-4 py-2">
                <h6 className="card-title mb-0 text-success fs-6">
                  <i className="ki-duotone ki-chart-simple fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                  Activity Summary
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Activities</label>
                    <div className="text-gray-800 fw-bold fs-4">{Array.isArray(selectedLead.fields['Activities']) ? selectedLead.fields['Activities'].length : 0}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold">Deals</label>
                    <div className="text-gray-800 fw-bold fs-4">{Array.isArray(selectedLead.fields['Deals']) ? selectedLead.fields['Deals'].length : 0}</div>
                  </div>
                  {selectedLead.fields['Created on'] && (
                    <div className="col-12">
                      <label className="text-muted fs-7 fw-semibold">Created On</label>
                      <div className="text-gray-800">{new Date(selectedLead.fields['Created on']).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Deletion"
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </button>
          </div>
        }
      >
        <div className="p-2">
          <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Assign Owner Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Lead Owner"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmAssign}
            >
              Assign
            </button>
          </div>
        }
      >
        <div className="p-2">
          <label className="form-label fw-bold fs-6 mb-2">Select Owner</label>
          <select
            className="form-select"
            value={tempOwnerId}
            onChange={(e) => setTempOwnerId(e.target.value)}
          >
            <option value="">-- Select Owner --</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.fields['Name'] || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lead"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEdit}
            >
              Save Changes
            </button>
          </div>
        }
      >
        <div className="p-2">
          <div className="mb-5">
            <label className="form-label fw-bold fs-6 mb-2">
              Company
            </label>
            <input
              className="form-control"
              value={editForm.company}
              onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="row g-3 mb-5">
            <div className="col-6">
              <label className="form-label fw-bold fs-6 mb-2">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-bold fs-6 mb-2">
                Phone
              </label>
              <input
                className="form-control"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+234 XXX XXX XXXX"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold fs-6 mb-2">
              Job Title
            </label>
            <input
              className="form-control"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Enter job title"
            />
          </div>
        </div>
      </Modal>

      {/* Contact Details Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={selectedContact ? (selectedContact.fields['Name'] || 'Contact Details') : 'Contact Details'}
        size="lg"
        footer={
          <button className="btn btn-light" onClick={() => setIsContactModalOpen(false)}>Close</button>
        }
      >
        {selectedContact && (
          <div className="text-start">
            <p><strong>Phone:</strong> {selectedContact.fields['Phone'] || 'N/A'}</p>
            <p><strong>Email:</strong> {selectedContact.fields['Email'] || 'N/A'}</p>
            <p><strong>Contact ID:</strong> {selectedContact.fields['Contact ID'] || 'N/A'}</p>
            <p><strong>Created:</strong> {selectedContact.fields['Created on'] ? new Date(selectedContact.fields['Created on']).toLocaleDateString() : 'N/A'}</p>
            {selectedContact.fields['Lead Status'] && Array.isArray(selectedContact.fields['Lead Status']) && (
              <p><strong>Status:</strong> {selectedContact.fields['Lead Status'].join(', ')}</p>
            )}
            <p><strong>Activities:</strong> {Array.isArray(selectedContact.fields['Activities']) ? selectedContact.fields['Activities'].length : 0}</p>
            <p><strong>Deals:</strong> {Array.isArray(selectedContact.fields['Deals']) ? selectedContact.fields['Deals'].length : 0}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
