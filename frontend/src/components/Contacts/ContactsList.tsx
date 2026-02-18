import { useState, useEffect } from 'react';
import { contactService, activityService, dealsService, teamMemberService, leadsService } from '../../services/airtable.service';
import { authService } from '../../services/auth.service';
import type { Contact, Deal, TeamMember, Activity } from '../../types/airtable.types';
import { toTitleCase } from '../../utils/stringUtils';
import Modal from '../Common/Modal';



export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'Created on',
    direction: 'desc'
  });

  // Dropdown data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isCreateDealInActivity, setIsCreateDealInActivity] = useState(false);
  const [newDealData, setNewDealData] = useState({
    title: '',
    value: '',
    stage: 'New' as const,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});
  const [leadForm, setLeadForm] = useState({
    company: '',
    email: '',
    phone: '',
    title: '',
    status: 'New Lead'
  });

  useEffect(() => {
    loadContacts();
    loadDependencies();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      const data = await contactService.getAll();

      // Ensure loading state lasts at least 600ms for animation visibility
      const duration = Date.now() - startTime;
      if (duration < 600) {
        await new Promise(resolve => setTimeout(resolve, 600 - duration));
      }

      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [membersData, dealsData] = await Promise.all([
        teamMemberService.getAll(),
        dealsService.getAll()
      ]);
      setTeamMembers(membersData);
      setDeals(dealsData);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  // --- Handlers ---

  const openCreateModal = () => {
    setFormData({ phone: '', name: '', email: '', createdBy: '' });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.phone) {
      showFeedback('error', 'Phone number is required');
      return;
    }

    try {
      const contactData: Partial<Contact['fields']> & { Phone: string } = {
        Phone: formData.phone,
      };

      if (formData.name) contactData.Name = formData.name;
      if (formData.email) contactData.Email = formData.email;
      const currentUser = authService.getCurrentUser();
      if (currentUser?.id) contactData['Created by'] = [currentUser.id];

      await contactService.create(contactData as Contact['fields']);
      showFeedback('success', 'Contact has been created successfully.');
      loadContacts();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to create contact');
    }
  };

  const openViewModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      phone: contact.fields['Phone'] || '',
      name: contact.fields['Name'] || '',
      email: contact.fields['Email'] || ''
    });
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedContact) return;
    if (!formData.phone) {
      showFeedback('error', 'Phone number is required');
      return;
    }

    try {
      await contactService.update(selectedContact.id, {
        Phone: formData.phone,
        Name: formData.name || undefined,
        Email: formData.email || undefined,
      });

      showFeedback('success', 'Contact has been updated successfully.');
      loadContacts();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to update contact');
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;
    try {
      await contactService.delete(selectedContact.id);
      showFeedback('success', 'Contact has been deleted.');
      loadContacts();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showFeedback('error', 'Failed to delete contact');
    }
  };

  const openActivityModal = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      activity: '',
      activityType: '',
      activitySummary: '',
      activityStatus: 'Open',
      relatedDeals: '',
      owner: '',
      createdOn: new Date().toISOString().split('T')[0]
    });
    setIsViewModalOpen(false);
    setIsActivityModalOpen(true);
    setIsCreateDealInActivity(false); // Reset this state
    setNewDealData({ title: '', value: '', stage: 'New' }); // Reset new deal data
  };

  const handleActivitySubmit = async () => {
    if (!selectedContact) return;
    if (!formData.activity || !formData.activityType) {
      showFeedback('error', 'Activity description and type are required');
      return;
    }

    try {
      setLoading(true);

      // Handle new deal creation if requested
      let dealId = formData.relatedDeals;
      if (isCreateDealInActivity && newDealData.title) {
        const deal = await dealsService.create({
          'Deal Name': newDealData.title,
          'Amount': newDealData.value ? parseFloat(newDealData.value) : 0,
          'Stage': newDealData.stage,
          'Contact': [selectedContact.id],
          'Deal Owner': formData.owner ? [formData.owner] : undefined,
        });
        dealId = deal.id;
      }

      const activityData: any = {
        'Activity': formData.activity, // Description
        'Activity Type': formData.activityType,
        'Status': formData.activityStatus,
        'Owner': formData.owner ? [formData.owner] : [],
        'Contact': [selectedContact.id],
        'Related Deals': dealId ? [dealId] : [],
        'Created on': formData.createdOn || new Date().toISOString(),
      };

      if (formData.createdOn) {
        try {
          const parsedDate = new Date(formData.createdOn);
          if (!isNaN(parsedDate.getTime())) {
            activityData['Start time'] = parsedDate.toISOString();
          }
        } catch (e) {
          console.warn('Invalid date format:', e);
        }
      }

      await activityService.create(activityData as Activity['fields']);
      showFeedback('success', 'Activity has been added.');
      setIsActivityModalOpen(false);
      loadContacts();
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const openAddLeadModal = (contact: Contact) => {
    setSelectedContact(contact);
    setLeadForm({
      company: '',
      email: contact.fields['Email'] || '',
      phone: contact.fields['Phone'] || '',
      title: '',
      status: 'New Lead'
    });
    setIsViewModalOpen(false);
    setIsAddLeadModalOpen(true);
  };

  const handleAddLeadSubmit = async () => {
    if (!selectedContact) return;
    try {
      await leadsService.create({
        'Contact': [selectedContact.fields['Name'] || ''],
        'Lead': [selectedContact.id],
        'Company': leadForm.company,
        'Email': leadForm.email,
        'Phone': leadForm.phone,
        'Title': leadForm.title,
        'Status': leadForm.status as any,
      });
      showFeedback('success', 'Lead has been created successfully.');
      setIsAddLeadModalOpen(false);
      loadContacts();
    } catch (error) {
      console.error(error);
      showFeedback('error', 'Failed to create lead.');
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

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aValue: any = a.fields[sortConfig.key as keyof Contact['fields']];
    let bValue: any = b.fields[sortConfig.key as keyof Contact['fields']];

    if (sortConfig.key === 'ID') {
      // Sort by the sequential index which is index + 1
      const aIdx = contacts.findIndex(c => c.id === a.id);
      const bIdx = contacts.findIndex(c => c.id === b.id);
      return sortConfig.direction === 'asc' ? aIdx - bIdx : bIdx - aIdx;
    }

    if (!aValue) return 1;
    if (!bValue) return -1;

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
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
          <div className="card-title">
            <div className="d-flex align-items-center position-relative my-1 me-5">
              <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              <input
                type="text"
                className="form-control w-250px ps-13"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="form-select w-150px me-5"
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                setCurrentPage(1);
              }}
            >
              <option value="Created on-desc">Newest First</option>
              <option value="Created on-asc">Oldest First</option>
              <option value="Name-asc">Name (A-Z)</option>
              <option value="ID-asc">ID (Low-High)</option>
            </select>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <select
                className="form-select w-200px"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="New Lead">New Lead</option>
                <option value="Attempted to Contact">Attempted to Contact</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Unqualified">Unqualified</option>
              </select>

              <button className="btn btn-icon btn-custom btn-active-color-primary" onClick={loadContacts} disabled={loading} title="Refresh">
                <i className={`ki-duotone ki-arrows-circle fs-1 ${loading ? 'rotate' : ''}`}>
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </button>

              <button className="btn btn-primary" onClick={openCreateModal}>
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
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-gray-600">No contacts found</div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact) => {
                    const originalIndex = contacts.findIndex(c => c.id === contact.id);
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => openViewModal(contact)}
                        style={{ cursor: 'pointer' }}
                        className="hover-bg-light-primary"
                      >
                        <td>
                          <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                            CT{originalIndex + 1}
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
                                {contact.fields['Name'] ? toTitleCase(contact.fields['Name']) : 'N/A'}
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
                            {Array.isArray(contact.fields['Phone']) ? contact.fields['Phone'][0] : contact.fields['Phone'] || 'N/A'}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center flex-wrap pt-10">
              <div className="fs-6 fw-bold text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedContacts.length)} of {sortedContacts.length} entries
              </div>
              <div className="dataTables_paginate paging_simple_numbers">
                <ul className="pagination">
                  <li className={`paginate_button page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                    <a
                      href="#"
                      className="page-link"
                      onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                    >
                      <i className="ki-outline ki-left fs-2"></i>
                    </a>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`paginate_button page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <a
                        href="#"
                        className="page-link px-4"
                        onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
                      >
                        {i + 1}
                      </a>
                    </li>
                  ))}
                  <li className={`paginate_button page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <a
                      href="#"
                      className="page-link"
                      onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                    >
                      <i className="ki-outline ki-right fs-2"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Contact"
        footer={
          <>
            <button type="button" className="btn btn-light me-3" onClick={() => setIsCreateModalOpen(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleCreateSubmit}>Create Contact</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">
            <i className="ki-duotone ki-phone fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Phone Number
          </label>
          <input
            type="text"
            className="form-control form-control-solid"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">
            <i className="ki-duotone ki-profile-circle fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            Full Name
          </label>
          <input
            type="text"
            className="form-control form-control-solid"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">
            <i className="ki-duotone ki-sms fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Email Address
          </label>
          <input
            type="email"
            className="form-control form-control-solid"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        {/* Created By is now automated */}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          <div className="d-flex align-items-center">
            <i className="ki-duotone ki-pencil fs-2 text-primary me-3">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            <span>Edit Contact</span>
          </div>
        }
        footer={
          <>
            <button type="button" className="btn btn-light me-3" onClick={() => setIsEditModalOpen(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleEditSubmit}>Update Contact</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">Phone Number</label>
          <input
            type="text"
            className="form-control form-control-solid"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control form-control-solid"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-control form-control-solid"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedContact?.fields['Name'] ? toTitleCase(selectedContact.fields['Name']) : 'Contact Details'}
        size="lg"
      >
        {selectedContact && (
          <>
            {/* Action Buttons */}
            <div className="d-flex justify-content-end mb-5">
              <button className="btn btn-primary me-2" onClick={() => openActivityModal(selectedContact)}>
                <i className="ki-duotone ki-calendar-add fs-2">
                  <span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span>
                </i>
                Add Activity
              </button>
              <button className="btn btn-primary me-2" onClick={() => openAddLeadModal(selectedContact)}>
                <i className="ki-duotone ki-plus fs-2"></i>
                Add Lead
              </button>
              <button className="btn btn-light me-2" onClick={() => openEditModal(selectedContact)}>
                <i className="ki-duotone ki-pencil fs-2"><span className="path1"></span><span className="path2"></span></i>
                Edit
              </button>
              <button className="btn btn-secondary" onClick={() => handleDeleteContact(selectedContact)}>
                <i className="ki-duotone ki-trash fs-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                Delete
              </button>
            </div>

            {/* Contact Info */}
            <div className="mb-5">
              <h4 className="border-bottom pb-2 mb-4">
                <i className="ki-duotone ki-profile-circle fs-2 me-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
                Contact Information
              </h4>
              <div className="row g-5">
                <div className="col-md-6">
                  <label className="fw-bold text-muted d-block mb-1">Contact ID</label>
                  <span className="fw-bolder fs-6 text-gray-800">{selectedContact.fields['Contact ID'] || 'N/A'}</span>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted d-block mb-1">Phone Number</label>
                  <span className="fw-bolder fs-6 text-gray-800">
                    {Array.isArray(selectedContact.fields['Phone']) ? selectedContact.fields['Phone'][0] : selectedContact.fields['Phone'] || 'N/A'}
                  </span>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted d-block mb-1">Email Address</label>
                  <span className="fw-bolder fs-6 text-gray-800">{selectedContact.fields['Email'] || 'N/A'}</span>
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted d-block mb-1">Created On</label>
                  <span className="fw-bolder fs-6 text-gray-800">
                    {selectedContact.fields['Created on'] ? new Date(selectedContact.fields['Created on']).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Status */}
            {selectedContact.fields['Lead Status'] && (
              <div className="mb-0">
                <h4 className="border-bottom pb-2 mb-4">
                  <i className="ki-duotone ki-chart-simple fs-2 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                  Lead Status
                </h4>
                <div>
                  {Array.isArray(selectedContact.fields['Lead Status']) && selectedContact.fields['Lead Status'].map((status, i) => (
                    <span key={i} className={`badge badge-primary me-2 mb-2 fs-7`}>{status}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Add Activity Modal */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title={
          <div className="d-flex align-items-center">
            <i className="ki-duotone ki-calendar-add fs-2 text-primary me-3">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
              <span className="path5"></span>
              <span className="path6"></span>
            </i>
            <span>Add Activity for {selectedContact?.fields['Name'] || 'Contact'}</span>
          </div>
        }
        footer={
          <>
            <button type="button" className="btn btn-light me-3" onClick={() => setIsActivityModalOpen(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleActivitySubmit}>Add Activity</button>
          </>
        }
        size="lg"
      >
        <div>
          <label className="form-label required fw-bold fs-6 mb-2 text-muted">
            <i className="ki-duotone ki-note-2 fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
            </i>
            Activity Summary
          </label>
          <div className="form-control form-control-solid bg-light text-muted">
            {formData.activity || 'Activity description will be summarized...'}
          </div>
        </div>
        <div>
          <label className="form-label required fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-abstract-26 fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Activity Description
          </label>
          <textarea
            className="form-control form-control-solid"
            placeholder="Describe what happened..."
            rows={3}
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label required fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-category fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
            </i>
            Activity Type
          </label>
          <select
            className="form-select"
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
          >
            <option value="">Select type...</option>
            <option value="Meeting">Meeting</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Call Summary">Call Summary</option>
            <option value="WhatsApp Chat">WhatsApp Chat</option>
          </select>
        </div>
        <div>
          <label className="form-label fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-check-circle fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Status
          </label>
          <select
            className="form-select form-select-solid"
            value={formData.activityStatus}
            onChange={(e) => setFormData({ ...formData, activityStatus: e.target.value })}
          >
            <option value="Open">Open</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <label className="form-label fw-bold fs-6 mb-0">
              <i className="ki-duotone ki-double-check fs-4 me-2">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
                <span className="path4"></span>
                <span className="path5"></span>
                <span className="path6"></span>
              </i>
              Related Deals
            </label>
            <button
              type="button"
              className={`btn btn-sm ${isCreateDealInActivity ? 'btn-light-danger' : 'btn-light-primary'}`}
              onClick={() => setIsCreateDealInActivity(!isCreateDealInActivity)}
            >
              {isCreateDealInActivity ? 'Cancel New Deal' : 'Create New Deal'}
            </button>
          </div>

          {!isCreateDealInActivity ? (
            <select
              className="form-select form-select-solid"
              value={formData.relatedDeals}
              onChange={(e) => setFormData({ ...formData, relatedDeals: e.target.value })}
            >
              <option value="">Select existing deal...</option>
              {deals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.fields['Deal Name']} {deal.fields['Amount'] ? `- $${deal.fields['Amount']}` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="card shadow-none border p-4 bg-light">
              <div className="mb-3">
                <label className="form-label fs-7 fw-bold">Deal Title</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Enter deal name"
                  value={newDealData.title}
                  onChange={(e) => setNewDealData({ ...newDealData, title: e.target.value })}
                />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label fs-7 fw-bold">Amount</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="0.00"
                    value={newDealData.value}
                    onChange={(e) => setNewDealData({ ...newDealData, value: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fs-7 fw-bold">Stage</label>
                  <select
                    className="form-select form-select-sm"
                    value={newDealData.stage}
                    onChange={(e) => setNewDealData({ ...newDealData, stage: e.target.value as any })}
                  >
                    <option value="New">New</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Prospective">Prospective</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="form-label fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-user-tick fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            Owner
          </label>
          <select
            className="form-select form-select-solid"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
          >
            <option value="">Select owner...</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.fields['Name']}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-calendar fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Created on
          </label>
          <input
            type="date"
            className="form-control form-control-solid"
            value={formData.createdOn}
            onChange={(e) => setFormData({ ...formData, createdOn: e.target.value })}
          />
        </div>
        <div>
          <label className="form-label fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-text-align-left fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
            </i>
            Activity Summary
          </label>
          <textarea
            className="form-control form-control-solid"
            rows={4}
            value={formData.activitySummary}
            onChange={(e) => setFormData({ ...formData, activitySummary: e.target.value })}
          ></textarea>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>Delete</button>
          </div>
        }
      >
        <div className="p-2 text-start">
          <p>Are you sure you want to delete contact <strong>{selectedContact?.fields['Name'] || selectedContact?.fields['Phone']}</strong>? This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddLeadModalOpen}
        onClose={() => { setIsAddLeadModalOpen(false); setIsViewModalOpen(true); }}
        title={`Add Lead for ${selectedContact?.fields['Name'] ? toTitleCase(selectedContact.fields['Name']) : 'Contact'}`}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsAddLeadModalOpen(false); setIsViewModalOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddLeadSubmit}>Create Lead</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label">Company</label>
            <input className="form-control" value={leadForm.company} onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })} placeholder="Enter company name" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-control" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone number" />
          </div>
          <div>
            <label className="form-label">Job Title</label>
            <input className="form-control" value={leadForm.title} onChange={(e) => setLeadForm({ ...leadForm, title: e.target.value })} placeholder="Enter job title" />
          </div>
          <div>
            <label className="form-label required">Status</label>
            <select className="form-select" value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as any })}>
              <option value="New Lead">New Lead</option>
              <option value="Attempted to Contact">Attempted to Contact</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Unqualified">Unqualified</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
