import { useState, useEffect, useRef } from 'react';
import { customerContactService, teamMemberService, accountService, interactionService, taskService, leadsService } from '../../services/airtable.service';
import type { CustomerContact, TeamMember } from '../../types/airtable.types';
import { authService } from '../../services/auth.service';
import { toTitleCase } from '../../utils/stringUtils';
import Modal from '../Common/Modal';

// Declare jQuery and DataTables types
declare const $: any;


export default function CustomerContactsList() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLTableElement>(null);
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'Customer ID',
    direction: 'asc'
  });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddInteractionModalOpen, setIsAddInteractionModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  // Forms State
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    source: '',
    createdById: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    source: '',
    accountManager: ''
  });

  const [accountForm, setAccountForm] = useState({
    name: '',
    industry: '',
    size: ''
  });

  const [interactionForm, setInteractionForm] = useState({
    name: '',
    type: '',
    datetime: '',
    teamMember: '',
    notes: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: '',
    status: 'To do',
    dueDate: '',
    assignedTo: ''
  });

  const [leadForm, setLeadForm] = useState({
    company: '',
    email: '',
    phone: '',
    title: '',
    status: 'New Lead'
  });

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSortedContacts = [...contacts]
    .filter(contact => {
      const search = searchTerm.toLowerCase();
      return contact.fields['Contact Name']?.toLowerCase().includes(search) ||
        contact.fields['Phone']?.toLowerCase().includes(search) ||
        contact.fields['Customer ID']?.toLowerCase().includes(search) ||
        (contact.fields['Discovery Source'] || '').toLowerCase().includes(search);
    })
    .sort((a, b) => {
      let valA: any = a.fields[sortConfig.key as keyof typeof a.fields] || '';
      let valB: any = b.fields[sortConfig.key as keyof typeof b.fields] || '';

      if (sortConfig.key === 'Customer ID') {
        const numA = parseInt(valA.replace(/\D/g, '')) || 0;
        const numB = parseInt(valB.replace(/\D/g, '')) || 0;
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedContacts.length / itemsPerPage);
  const paginatedContacts = filteredAndSortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const startTime = Date.now();
      // Load both contacts and team members
      const [contactsData, teamMembersData] = await Promise.all([
        customerContactService.getAll(),
        teamMemberService.getAll(),
      ]);

      // Ensure loading state lasts at least 600ms for animation visibility
      const duration = Date.now() - startTime;
      if (duration < 600) {
        await new Promise(resolve => setTimeout(resolve, 600 - duration));
      }

      setContacts(contactsData);
      setTeamMembers(teamMembersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    const currentUser = authService.getCurrentUser();
    const employeeId = teamMembers.find(tm => tm.fields['Email']?.toLowerCase() === currentUser?.email?.toLowerCase())?.id;

    setCreateForm({
      name: '',
      phone: '',
      source: '',
      createdById: employeeId || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!createForm.name || !createForm.phone || !createForm.source) {
      showFeedback('error', 'Please fill in all required fields');
      return;
    }

    try {
      // Generate a unique Customer ID
      const customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await customerContactService.create({
        'Customer ID': customerId,
        'Contact Name': createForm.name,
        'Phone': createForm.phone,
        'Discovery Source': createForm.source as any,
        'Created by': createForm.createdById ? [createForm.createdById] : undefined,
      });

      setIsCreateModalOpen(false);
      loadData();
      showFeedback('success', 'Customer contact has been created');
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to create customer contact');
    }
  };

  const handleRowClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setEditForm({
      name: contact.fields['Contact Name'] || '',
      phone: contact.fields['Phone'] || '',
      source: contact.fields['Discovery Source'] || '',
      accountManager: contact.fields['Account Manager']?.[0] || ''
    });
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedContact) return;

    if (!editForm.name || !editForm.phone || !editForm.source) {
      showFeedback('error', 'Please fill in all required fields');
      return;
    }

    try {
      await customerContactService.update(selectedContact.id, {
        'Contact Name': editForm.name,
        'Phone': editForm.phone,
        'Discovery Source': editForm.source as any,
        'Account Manager': editForm.accountManager ? [editForm.accountManager] : [],
      });

      setIsEditModalOpen(false);
      setIsDetailsModalOpen(true); // Reopen details

      // Update local state temporarily
      const updatedContact: CustomerContact = {
        ...selectedContact,
        fields: {
          ...selectedContact.fields,
          'Contact Name': editForm.name,
          'Phone': editForm.phone,
          'Discovery Source': editForm.source as any,
          'Account Manager': editForm.accountManager ? [editForm.accountManager] : []
        }
      };
      setSelectedContact(updatedContact);
      setContacts(current => current.map(c => c.id === updatedContact.id ? updatedContact : c));

      showFeedback('success', 'Contact has been updated');
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to update contact');
    }
  };

  const handleAddAccountClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setAccountForm({ name: '', industry: '', size: '' });
    setIsDetailsModalOpen(false);
    setIsAddAccountModalOpen(true);
  };

  const handleAddAccountSubmit = async () => {
    if (!accountForm.name) {
      showFeedback('error', 'Account name is required');
      return;
    }

    try {
      await accountService.create({
        'Account Name': accountForm.name,
        'Industry': accountForm.industry as any || undefined,
        'Size': accountForm.size as any || undefined,
      });
      setIsAddAccountModalOpen(false);
      setIsDetailsModalOpen(true);
      showFeedback('success', 'Account created successfully');
      loadData();
    } catch (err) {
      showFeedback('error', 'Failed to create account');
    }
  };

  const handleAddInteractionClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setInteractionForm({ name: '', type: '', datetime: '', teamMember: '', notes: '' });
    setIsDetailsModalOpen(false);
    setIsAddInteractionModalOpen(true);
  };

  const handleAddInteractionSubmit = async () => {
    if (!interactionForm.name) {
      showFeedback('error', 'Interaction name is required');
      return;
    }

    try {
      await interactionService.create({
        'Name': interactionForm.name,
        'Type': interactionForm.type as any || undefined,
        'Date & Time': interactionForm.datetime || undefined,
        'Team Member': interactionForm.teamMember ? [interactionForm.teamMember] : undefined,
        'Notes': interactionForm.notes || undefined,
      });
      setIsAddInteractionModalOpen(false);
      setIsDetailsModalOpen(true);
      showFeedback('success', 'Interaction created successfully');
      loadData();
    } catch (err) {
      showFeedback('error', 'Failed to create interaction');
    }
  };

  const handleAddTaskClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setTaskForm({ title: '', description: '', priority: '', status: 'To do', dueDate: '', assignedTo: '' });
    setIsDetailsModalOpen(false);
    setIsAddTaskModalOpen(true);
  };

  const handleAddTaskSubmit = async () => {
    if (!taskForm.title) {
      showFeedback('error', 'Task title is required');
      return;
    }

    try {
      await taskService.create({
        'Task Title': taskForm.title,
        'Task Description': taskForm.description || undefined,
        'Priority': taskForm.priority as any || undefined,
        'Status': taskForm.status as any || 'To do',
        'Task Deadline': taskForm.dueDate || undefined,
        'Task Owner': taskForm.assignedTo ? [taskForm.assignedTo] : undefined,
        'Customer Contact': selectedContact ? [selectedContact.id] : undefined,
      });
      setIsAddTaskModalOpen(false);
      setIsDetailsModalOpen(true);
      showFeedback('success', 'Task created successfully');
      loadData();
    } catch (err) {
      showFeedback('error', 'Failed to create task');
    }
  };

  const handleAddLeadClick = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setLeadForm({
      company: '',
      email: '',
      phone: contact.fields['Phone'] || '',
      title: '',
      status: 'New Lead'
    });
    setIsDetailsModalOpen(false);
    setIsAddLeadModalOpen(true);
  };

  const handleAddLeadSubmit = async () => {
    if (!selectedContact) return;

    try {
      const currentUser = authService.getCurrentUser();
      const employeeId = teamMembers.find(tm => tm.fields['Email']?.toLowerCase() === currentUser?.email?.toLowerCase())?.id;

      await leadsService.create({
        'Contact': [selectedContact.fields['Contact Name'] || 'Unknown'],
        'Lead': [selectedContact.id],
        'Company': leadForm.company || undefined,
        'Email': leadForm.email || undefined,
        'Phone': leadForm.phone || undefined,
        'Title': leadForm.title || undefined,
        'Status': leadForm.status as any,
        'Owner': employeeId ? [employeeId] : undefined
      });

      setIsAddLeadModalOpen(false);
      setIsDetailsModalOpen(true);
      showFeedback('success', 'Lead created successfully');
      loadData();
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to create lead');
    }
  };

  const handleDelete = (contact: CustomerContact) => {
    setSelectedContact(contact);
    setIsDetailsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedContact) return;
    try {
      await customerContactService.delete(selectedContact.id);
      showFeedback('success', 'Contact has been deleted.');
      setIsDeleteModalOpen(false);
      loadData();
    } catch (err) {
      showFeedback('error', 'Failed to delete contact');
      console.error(err);
    }
  };



  const getSourceBadgeClass = (source?: string) => {
    switch (source) {
      case 'WhatsApp': return 'badge-light-success';
      case 'Facebook': return 'badge-light-primary';
      case 'Instagram': return 'badge-light-danger';
      case 'TikTok': return 'badge-light-info';
      case 'Call': return 'badge-light-warning';
      case 'Walk-In': return 'badge-light-dark';
      case 'Lead': return 'badge-light-secondary';
      default: return 'badge-light';
    }
  };

  const getTeamMemberName = (memberId?: string) => {
    if (!memberId) return 'Unassigned';
    const member = teamMembers.find(tm => tm.id === memberId);
    return member?.fields['Name'] || memberId;
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
        {/* Card Header */}
        <div className="card-header border-0 pt-6">
          <div className="card-title">
            <h2 className="fw-bold">Customer Contacts</h2>
          </div>
          <div className="card-toolbar">
            <div className="d-flex justify-content-end gap-2" data-kt-customer-table-toolbar="base">
              <button className="btn btn-primary" onClick={handleCreateClick}>
                <i className="ki-duotone ki-plus fs-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Add Customer
              </button>
              <button className="btn btn-icon btn-custom btn-active-color-primary" onClick={loadData} disabled={loading} title="Refresh">
                <i className={`ki-duotone ki-arrows-circle fs-1 ${loading ? 'rotate' : ''}`}>
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
              </button>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body py-4">
          {/* Search Bar */}
          <div className="d-flex align-items-center position-relative mb-5 gap-3">
            <div className="position-relative">
              <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5 top-50 translate-middle-y">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              <input
                type="text"
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="form-select form-select-solid w-200px"
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                setCurrentPage(1);
              }}
            >
              <option value="Customer ID-asc">ID (Low-High)</option>
              <option value="Customer ID-desc">ID (High-Low)</option>
              <option value="Contact Name-asc">Name (A-Z)</option>
              <option value="Contact Name-desc">Name (Z-A)</option>
            </select>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table
              ref={tableRef}
              id="kt_customers_table"
              className="table align-middle table-row-dashed fs-6 gy-5"
            >
              <thead>
                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                  <th className="min-w-125px">Customer ID</th>
                  <th className="min-w-125px">Contact Name</th>
                  <th className="min-w-125px">Phone</th>
                  <th className="min-w-125px">Source</th>
                  <th className="min-w-125px">Account Manager</th>
                  <th className="min-w-100px">Tags</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 fw-semibold">
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-gray-600 fs-4 mb-3">No customer contacts found</div>
                      <button className="btn btn-primary" onClick={handleCreateClick}>
                        <i className="ki-duotone ki-plus fs-2">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        Add Your First Customer
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(contact)}
                      className="table-row-hover"
                    >
                      <td>
                        <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                          {contact.fields['Customer ID']}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-800 text-hover-primary mb-1 fw-bold">
                          {contact.fields['Contact Name'] ? toTitleCase(contact.fields['Contact Name']) : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-800 mb-1">
                          {contact.fields['Phone'] || 'N/A'}
                        </span>
                      </td>
                      <td>
                        {contact.fields['Discovery Source'] && (
                          <span className={`badge ${getSourceBadgeClass(contact.fields['Discovery Source'])}`}>
                            {contact.fields['Discovery Source']}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-gray-800">
                          {getTeamMemberName(contact.fields['Account Manager']?.[0])}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          {Array.isArray(contact.fields['Tag']) && contact.fields['Tag'].map((tag, index) => (
                            <span key={index} className="badge badge-light-warning">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="row mt-5">
              <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                <div className="text-gray-700 fs-7 fw-bold">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedContacts.length)} of {filteredAndSortedContacts.length} records
                </div>
              </div>
              <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                <ul className="pagination">
                  <li className={`page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                      <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link px-4" onClick={() => handlePageChange(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                      <i className="ki-duotone ki-arrow-right fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* View Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedContact?.fields['Contact Name'] ? toTitleCase(selectedContact.fields['Contact Name']) : 'Contact Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2 text-start">
            <button className="btn btn-danger me-auto" onClick={() => selectedContact && handleDelete(selectedContact)}>Delete</button>
            <button className="btn btn-light" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
          </div>
        }
      >
        {selectedContact && (
          <div className="d-flex flex-column gap-4">
            {/* Action Buttons */}
            <div className="d-flex gap-2 flex-wrap border-bottom pb-4 mb-2">
              <button className="btn btn-sm btn-primary" onClick={() => handleEditClick(selectedContact)}>
                <i className="ki-duotone ki-pencil fs-6 me-1"><span className="path1"></span><span className="path2"></span></i> Edit
              </button>
              <button className="btn btn-sm btn-light" onClick={() => handleAddAccountClick(selectedContact)}>
                <i className="ki-duotone ki-shop fs-6 me-1"><span className="path1"></span><span className="path2"></span></i> Add Account
              </button>
              <button className="btn btn-sm btn-light" onClick={() => handleAddInteractionClick(selectedContact)}>
                <i className="ki-duotone ki-message-text-2 fs-6 me-1"><span className="path1"></span><span className="path2"></span></i> Add Interaction
              </button>
              <button className="btn btn-sm btn-light" onClick={() => handleAddTaskClick(selectedContact)}>
                <i className="ki-duotone ki-calendar-tick fs-6 me-1"><span className="path1"></span><span className="path2"></span></i> Add Task
              </button>
              <button className="btn btn-sm btn-light" onClick={() => handleAddLeadClick(selectedContact)}>
                <i className="ki-duotone ki-badge fs-6 me-1"><span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span><span className="path5"></span></i> Add Lead
              </button>
            </div>

            <div className="row g-3 text-start">
              <h5 className="text-primary mb-2">Contact Info</h5>
              <div className="col-md-6">
                <label className="text-muted fw-bold small">Customer ID</label>
                <div className="fw-bold">{selectedContact.fields['Customer ID']}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small">Phone</label>
                <div className="fw-bold">{selectedContact.fields['Phone']}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small">Discovery Source</label>
                <div><span className={`badge ${getSourceBadgeClass(selectedContact.fields['Discovery Source'])}`}>{selectedContact.fields['Discovery Source']}</span></div>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small">Account Manager</label>
                <div className="fw-bold">{getTeamMemberName(selectedContact.fields['Account Manager']?.[0])}</div>
              </div>
            </div>

            <div className="border-top pt-4 mt-2 text-start">
              <h5 className="text-primary mb-2">Activity & Tags</h5>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="text-muted fw-bold small d-block mb-1">Tags</label>
                  <div>
                    {Array.isArray(selectedContact.fields['Tag']) && selectedContact.fields['Tag'].length > 0
                      ? selectedContact.fields['Tag'].map((tag, i) => <span key={i} className="badge badge-light me-1">{tag}</span>)
                      : <span className="text-muted">No tags</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted fw-bold small">Last Interaction</label>
                  <div>{selectedContact.fields['Last Interaction'] || 'Never'}</div>
                </div>
                <div className="col-md-6">
                  <label className="text-muted fw-bold small">Created By</label>
                  <div>{getTeamMemberName(selectedContact.fields['Created by']?.[0])}</div>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <p>Are you sure you want to delete <strong>{selectedContact?.fields['Contact Name']}</strong>? This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Customer"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Create Customer</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Contact Name</label>
            <input className="form-control" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
          </div>
          <div>
            <label className="form-label required">Phone</label>
            <input className="form-control" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="form-label required">Discovery Source</label>
            <select className="form-select" value={createForm.source} onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}>
              <option value="">Select source...</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Call">Call</option>
              <option value="Walk-In">Walk-In</option>
              <option value="Lead">Lead</option>
            </select>
          </div>
          {/* Created By is now automated */}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsEditModalOpen(false); setIsDetailsModalOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Contact Name</label>
            <input className="form-control" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="form-label required">Phone</label>
            <input className="form-control" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="form-label required">Discovery Source</label>
            <select className="form-select" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}>
              <option value="">Select source...</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Call">Call</option>
              <option value="Walk-In">Walk-In</option>
              <option value="Lead">Lead</option>
            </select>
          </div>
          <div>
            <label className="form-label">Account Manager</label>
            <select className="form-select" value={editForm.accountManager} onChange={(e) => setEditForm({ ...editForm, accountManager: e.target.value })}>
              <option value="">Unassigned</option>
              {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        isOpen={isAddAccountModalOpen}
        onClose={() => { setIsAddAccountModalOpen(false); setIsDetailsModalOpen(true); }}
        title={`Add Account for ${selectedContact?.fields['Contact Name']}`}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsAddAccountModalOpen(false); setIsDetailsModalOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddAccountSubmit}>Create Account</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Account Name</label>
            <input className="form-control" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="Enter account name" />
          </div>
          <div>
            <label className="form-label">Industry</label>
            <select className="form-select" value={accountForm.industry} onChange={(e) => setAccountForm({ ...accountForm, industry: e.target.value })}>
              <option value="">Select industry...</option>
              <option value="Technology">Technology</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Company Size</label>
            <select className="form-select" value={accountForm.size} onChange={(e) => setAccountForm({ ...accountForm, size: e.target.value })}>
              <option value="">Select size...</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-100">51-100 employees</option>
              <option value="101-500">101-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000-5000">1000-5000 employees</option>
              <option value="10,000+">10,000+ employees</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Add Interaction Modal */}
      <Modal
        isOpen={isAddInteractionModalOpen}
        onClose={() => { setIsAddInteractionModalOpen(false); setIsDetailsModalOpen(true); }}
        title={`Add Interaction for ${selectedContact?.fields['Contact Name']}`}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsAddInteractionModalOpen(false); setIsDetailsModalOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddInteractionSubmit}>Create Interaction</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Interaction Name</label>
            <input className="form-control" value={interactionForm.name} onChange={(e) => setInteractionForm({ ...interactionForm, name: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={interactionForm.type} onChange={(e) => setInteractionForm({ ...interactionForm, type: e.target.value })}>
              <option value="">Select type...</option>
              <option value="Discovery">Discovery</option>
              <option value="Label discussion">Label discussion</option>
              <option value="Price Discussion">Price Discussion</option>
              <option value="Custom Solution">Custom Solution</option>
              <option value="Weekly Check-in">Weekly Check-in</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date & Time</label>
            <input type="datetime-local" className="form-control" value={interactionForm.datetime} onChange={(e) => setInteractionForm({ ...interactionForm, datetime: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Team Member</label>
            <select className="form-select" value={interactionForm.teamMember} onChange={(e) => setInteractionForm({ ...interactionForm, teamMember: e.target.value })}>
              <option value="">Select team member...</option>
              {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={3} value={interactionForm.notes} onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}></textarea>
          </div>
        </div>
      </Modal>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddLeadModalOpen}
        onClose={() => { setIsAddLeadModalOpen(false); setIsDetailsModalOpen(true); }}
        title={`Add Lead for ${selectedContact?.fields['Contact Name'] ? toTitleCase(selectedContact.fields['Contact Name']) : 'Contact'}`}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsAddLeadModalOpen(false); setIsDetailsModalOpen(true); }}>Cancel</button>
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

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => { setIsAddTaskModalOpen(false); setIsDetailsModalOpen(true); }}
        title={`Add Task for ${selectedContact?.fields['Contact Name'] ? toTitleCase(selectedContact.fields['Contact Name']) : 'Contact'}`}
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => { setIsAddTaskModalOpen(false); setIsDetailsModalOpen(true); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddTaskSubmit}>Create Task</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Task Title</label>
            <input className="form-control" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}></textarea>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="">Select priority...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
              <option value="To do">To do</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-control" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Assigned To</label>
            <select className="form-select" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
              <option value="">Select team member...</option>
              {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
};
