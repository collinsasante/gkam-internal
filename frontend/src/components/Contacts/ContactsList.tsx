import { useState, useEffect } from 'react';
import { contactService, activityService, dealsService, teamMemberService } from '../../services/airtable.service';
import type { Contact, Deal, TeamMember, Activity } from '../../types/airtable.types';
import Modal from '../Common/Modal';

declare const Swal: any;

export default function ContactsList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Dropdown data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadContacts();
    loadDependencies();
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
      Swal.fire({ icon: 'error', title: 'Error', text: 'Phone number is required' });
      return;
    }

    try {
      const contactData: Partial<Contact['fields']> & { Phone: string } = {
        Phone: formData.phone,
      };

      if (formData.name) contactData.Name = formData.name;
      if (formData.email) contactData.Email = formData.email;
      if (formData.createdBy) contactData['Created by'] = [formData.createdBy];

      await contactService.create(contactData as Contact['fields']);
      Swal.fire('Created!', 'Contact has been created successfully.', 'success');
      loadContacts();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to create contact', 'error');
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
      Swal.fire('Error', 'Phone number is required', 'error');
      return;
    }

    try {
      await contactService.update(selectedContact.id, {
        Phone: formData.phone,
        Name: formData.name || undefined,
        Email: formData.email || undefined,
      });

      Swal.fire('Updated!', 'Contact has been updated successfully.', 'success');
      loadContacts();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to update contact', 'error');
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    setIsViewModalOpen(false);

    const result = await Swal.fire({
      title: 'Are you sure?',
      html: `Do you want to delete contact <strong>${contact.fields['Name'] || contact.fields['Phone']}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f1416c',
    });

    if (result.isConfirmed) {
      try {
        await contactService.delete(contact.id);
        Swal.fire('Deleted!', 'Contact has been deleted.', 'success');
        loadContacts();
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Failed to delete contact', 'error');
      }
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
  };

  const handleActivitySubmit = async () => {
    if (!selectedContact) return;
    if (!formData.activity || !formData.activityType) {
      Swal.fire('Error', 'Activity description and type are required', 'error');
      return;
    }

    try {
      const activityNumber = `ACT-${Date.now()}`;
      const activityData: Partial<Activity['fields']> & { 'Activity Number': string } = {
        'Activity Number': activityNumber,
        'Activity': formData.activity,
        'Activity Type': formData.activityType,
        'Status': formData.activityStatus,
        'Contact 2': [selectedContact.id],
      };

      if (formData.activitySummary) activityData['Activity Summary (Activity)'] = formData.activitySummary;
      if (formData.relatedDeals) activityData['Related Deals'] = [formData.relatedDeals];
      if (formData.owner) activityData['Owner'] = [formData.owner];
      if (formData.createdOn) {
        try {
          const parsedDate = new Date(formData.createdOn);
          if (!isNaN(parsedDate.getTime())) {
            activityData['Start time'] = parsedDate.toISOString();
          }
        } catch (e) {
          console.warn(e);
        }
      }

      await activityService.create(activityData as Activity['fields']);
      Swal.fire('Added!', 'Activity has been added successfully.', 'success');
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to add activity', 'error');
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
    <>
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
                      onClick={() => openViewModal(contact)}
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
        <div className="fv-row mb-5">
          <label className="form-label">
            <i className="ki-duotone ki-user-tick fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            Created By
          </label>
          <select
            className="form-select form-select-solid"
            value={formData.createdBy}
            onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
          >
            <option value="">Select creator...</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.fields['Name']}</option>
            ))}
          </select>
        </div>
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
        title={selectedContact?.fields['Name'] || 'Contact Details'}
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
                  <span className="fw-bolder fs-6 text-gray-800">{selectedContact.fields['Phone'] || 'N/A'}</span>
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
        <div className="fv-row mb-5">
          <label className="form-label required fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-note-2 fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
              <span className="path4"></span>
            </i>
            Activity
          </label>
          <input
            className="form-control form-control-solid"
            placeholder="Enter activity description"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label required fw-bold fs-6 mb-2">
            <i className="ki-duotone ki-abstract-26 fs-4 me-2">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Activity Type
          </label>
          <select
            className="form-select form-select-solid"
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
          >
            <option value="">Select type...</option>
            <option value="Meeting">📅 Meeting</option>
            <option value="Phone Call">📞 Phone Call</option>
            <option value="Call Summary">📝 Call Summary</option>
            <option value="WhatsApp Chat">💬 WhatsApp Chat</option>
          </select>
        </div>
        <div className="fv-row mb-5">
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
        <div className="fv-row mb-5">
          <label className="form-label fw-bold fs-6 mb-2">
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
          <select
            className="form-select form-select-solid"
            value={formData.relatedDeals}
            onChange={(e) => setFormData({ ...formData, relatedDeals: e.target.value })}
          >
            <option value="">Select deal...</option>
            {deals.map(deal => (
              <option key={deal.id} value={deal.id}>
                {deal.fields['Deal Name']} {deal.fields['Amount'] ? `- $${deal.fields['Amount']}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="fv-row mb-5">
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
        <div className="fv-row mb-5">
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
        <div className="fv-row mb-5">
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
    </>
  );
}
