import { useState, useEffect } from 'react';
import { accountService, interactionService, taskService, teamMemberService } from '../../services/airtable.service';
import type { Account, TeamMember } from '../../types/airtable.types';
import Modal from '../Common/Modal';



export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAccounts();
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

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const openCreateModal = () => {
    setFormData({
      accountName: '', industry: '', size: '', status: '', location: '', city: '',
      website: '', social: '', platform: '', accountOwner: '', notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.accountName) {
      showFeedback('error', 'Account Name is required');
      return;
    }

    try {
      await accountService.create({
        'Account Name': formData.accountName,
        'Industry': formData.industry || undefined,
        'Size': formData.size || undefined,
        'Account Status': formData.status || undefined,
        'Location': formData.location || undefined,
        'City': formData.city || undefined,
        'Company Website': formData.website || undefined,
        'Social Media Handle': formData.social || undefined,
        'Platform': formData.platform || undefined,
        'Account owner': formData.accountOwner ? [formData.accountOwner] : undefined,
        'Notes': formData.notes || undefined,
      });
      showFeedback('success', 'Account has been created.');
      loadAccounts();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to create account');
    }
  };

  const handleRowClick = (account: Account) => {
    setSelectedAccount(account);
    setIsViewModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setSelectedAccount(account);
    setFormData({
      accountName: account.fields['Account Name'] || '',
      industry: account.fields['Industry'] || '',
      location: account.fields['Location'] || '',
      city: account.fields['City'] || '',
      status: account.fields['Account Status'] || '',
      website: account.fields['Company Website'] || '',
      social: account.fields['Social Media Handle'] || '',
      notes: account.fields['Notes'] || ''
    });
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedAccount) return;
    if (!formData.accountName) {
      showFeedback('error', 'Account name is required');
      return;
    }

    try {
      await accountService.update(selectedAccount.id, {
        'Account Name': formData.accountName,
        'Industry': formData.industry || undefined,
        'Location': formData.location || undefined,
        'City': formData.city || undefined,
        'Account Status': formData.status as 'Active' | 'Inactive',
        'Company Website': formData.website || undefined,
        'Social Media Handle': formData.social || undefined,
        'Notes': formData.notes || undefined,
      });
      showFeedback('success', 'Account has been updated.');
      loadAccounts();
      setIsEditModalOpen(false);
    } catch (err) {
      showFeedback('error', 'Failed to update account');
    }
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return;
    try {
      await accountService.delete(selectedAccount.id);
      showFeedback('success', 'Account has been deleted.');
      loadAccounts();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showFeedback('error', 'Failed to delete account');
    }
  };

  const openInteractionModal = (account: Account) => {
    setSelectedAccount(account);
    setFormData({ name: '', type: '', datetime: '', notes: '' });
    setIsViewModalOpen(false);
    setIsInteractionModalOpen(true);
  };

  const handleInteractionSubmit = async () => {
    if (!selectedAccount) return;
    if (!formData.name) {
      showFeedback('error', 'Interaction Name is required');
      return;
    }

    try {
      await interactionService.create({
        'Name': formData.name,
        'Type': formData.type || undefined,
        'Date & Time': formData.datetime || undefined,
        'Notes': formData.notes || undefined,
        'Account': [selectedAccount.id],
      });
      showFeedback('success', 'Interaction has been added.');
      setIsInteractionModalOpen(false);
    } catch (err) {
      showFeedback('error', 'Failed to add interaction');
    }
  };

  const openTaskModal = (account: Account) => {
    setSelectedAccount(account);
    setFormData({ title: '', description: '', status: 'To do', priority: '', deadline: '' });
    setIsViewModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async () => {
    if (!selectedAccount) return;
    if (!formData.title) {
      showFeedback('error', 'Task Title is required');
      return;
    }

    try {
      await taskService.create({
        'Task Title': formData.title,
        'Task Description': formData.description || undefined,
        'Status': formData.status || 'To do',
        'Priority': formData.priority || undefined,
        'Task Deadline': formData.deadline || undefined,
        'Accounts': [selectedAccount.id],
      });
      showFeedback('success', 'Task has been added.');
      setIsTaskModalOpen(false);
    } catch (err) {
      showFeedback('error', 'Failed to add task');
    }
  };

  const filteredAccounts = accounts
    .filter((account) => {
      const matchesSearch = searchTerm === '' ||
        account.fields['Account Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.fields['Location']?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesIndustry = filterIndustry === '' || account.fields['Industry'] === filterIndustry;
      const matchesStatus = filterStatus === '' || account.fields['Account Status'] === filterStatus;

      return matchesSearch && matchesIndustry && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = a.fields['Account Name'] || '';
      const nameB = b.fields['Account Name'] || '';
      const startsWithNumberA = /^\d/.test(nameA);
      const startsWithNumberB = /^\d/.test(nameB);

      if (startsWithNumberA && startsWithNumberB) {
        const numA = parseInt(nameA.match(/^(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(nameB.match(/^(\d+)/)?.[1] || '0', 10);
        return numA - numB;
      } else if (startsWithNumberA) {
        return -1;
      } else if (startsWithNumberB) {
        return 1;
      } else {
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      }
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadAccounts}>
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
        {/* Header and filters ... same as before */}
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
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <select
                className="form-select form-select-solid w-150px"
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
              >
                <option value="">All Industries</option>
                <option value="Beverage">Beverage</option>
                <option value="Food">Food</option>
                <option value="Skincare">Skincare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="FMCG">FMCG</option>
              </select>

              <select
                className="form-select form-select-solid w-150px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button className="btn btn-light" onClick={loadAccounts}>
                <i className="ki-duotone ki-arrows-circle fs-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Refresh
              </button>

              <button className="btn btn-primary" onClick={openCreateModal}>
                <i className="ki-duotone ki-plus fs-2"></i>
                Create Account
              </button>
            </div>
          </div>
        </div>

        <div className="card-body py-4">
          <div className="table-responsive">
            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
              <thead>
                <tr className="fw-bold text-muted">
                  <th className="min-w-200px">Account Name</th>
                  <th className="min-w-150px">Industry</th>
                  <th className="min-w-150px">Location</th>
                  <th className="min-w-120px">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10">No accounts found</td></tr>
                ) : (
                  filteredAccounts.map(account => (
                    <tr key={account.id} onClick={() => handleRowClick(account)} style={{ cursor: 'pointer' }} className="hover-bg-light-primary">
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="symbol symbol-45px me-5">
                            {account.fields['Logo']?.[0] ? (
                              <img src={account.fields['Logo'][0].url} alt={account.fields['Account Name']} />
                            ) : (
                              <div className="symbol-label fs-3 bg-light-primary text-primary">
                                {account.fields['Account Name']?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="d-flex justify-content-start flex-column">
                            <span className="text-gray-900 fw-bold text-hover-primary fs-6">{account.fields['Account Name']}</span>
                          </div>
                        </div>
                      </td>
                      <td>{account.fields['Industry']}</td>
                      <td>{account.fields['Location']}</td>
                      <td>
                        <span className={`badge badge-${account.fields['Account Status'] === 'Active' ? 'success' : 'secondary'}`}>
                          {account.fields['Account Status']}
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

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedAccount?.fields['Account Name'] || 'Account Details'}
        size="lg"
      >
        {selectedAccount && (
          <>
            <div className="text-center mb-5">
              {selectedAccount.fields['Logo']?.[0] && (
                <img src={selectedAccount.fields['Logo'][0].url} alt="Logo" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }} />
              )}
            </div>

            <div className="d-flex justify-content-center gap-2 mb-5">
              <button className="btn btn-primary btn-sm" onClick={() => openEditModal(selectedAccount!)}>Edit</button>
              <button className="btn btn-light btn-sm" onClick={() => openInteractionModal(selectedAccount!)}>Add Interaction</button>
              <button className="btn btn-light btn-sm" onClick={() => openTaskModal(selectedAccount!)}>Add Task</button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(selectedAccount!)}>Delete</button>
            </div>

            <div className="mb-5">
              <h5 className="mb-3">Business Details</h5>
              <div className="row g-3">
                <div className="col-6">
                  <label className="fw-bold text-muted">Industry</label>
                  <div><span className="badge badge-primary">{selectedAccount.fields['Industry'] || 'N/A'}</span></div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Company Size</label>
                  <div>{selectedAccount.fields['Size'] || 'N/A'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Status</label>
                  <div><span className={`badge badge-${selectedAccount.fields['Account Status'] === 'Active' ? 'success' : 'secondary'}`}>{selectedAccount.fields['Account Status'] || 'N/A'}</span></div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Platform</label>
                  <div><span className="badge badge-light">{selectedAccount.fields['Platform'] || 'N/A'}</span></div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h5 className="mb-3">Location & Contact</h5>
              <div className="row g-3">
                <div className="col-6">
                  <label className="fw-bold text-muted">Location</label>
                  <div>{selectedAccount.fields['Location'] || 'N/A'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">City</label>
                  <div>{selectedAccount.fields['City'] || 'N/A'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Website</label>
                  <div>{selectedAccount.fields['Company Website'] ? <a href={selectedAccount.fields['Company Website']} target="_blank">{selectedAccount.fields['Company Website']}</a> : 'N/A'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Social Media</label>
                  <div>{selectedAccount.fields['Social Media Handle'] || 'N/A'}</div>
                </div>
              </div>
            </div>

            {selectedAccount.fields['Notes'] && (
              <div className="mb-5">
                <h5 className="mb-3">Special Notes</h5>
                <div className="text-gray-600">{selectedAccount.fields['Notes']}</div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Create/Edit Account Modal (Simplified for brevity as they share fields roughly) */}
      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Business/Account"
        footer={
          <>
            <button className="btn btn-light me-3" onClick={() => setIsCreateModalOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Create Account</button>
          </>
        }
      >
        {/* Form fields for create */}
        <div className="fv-row mb-5">
          <label className="form-label required">Business Name</label>
          <input type="text" className="form-control" value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} placeholder="Enter business name" />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label required">Industry</label>
          <select className="form-select" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
            <option value="">Select industry...</option>
            <option value="Beverage">Beverage</option>
            <option value="Food">Food</option>
            <option value="Skincare">Skincare</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="FMCG">FMCG</option>
          </select>
        </div>
        {/* ... other fields ... */}
        <div className="fv-row mb-5">
          <label className="form-label">Status</label>
          <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="">Select status...</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Location</label>
          <input type="text" className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label required">Account Owner</label>
          <select className="form-select" value={formData.accountOwner} onChange={e => setFormData({ ...formData, accountOwner: e.target.value })}>
            <option value="">Select owner...</option>
            {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>)}
          </select>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Account"
        footer={
          <>
            <button className="btn btn-light me-3" onClick={() => setIsEditModalOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">Account Name</label>
          <input type="text" className="form-control" value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Industry</label>
          <select className="form-select" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
            <option value="">Select industry...</option>
            <option value="Beverage">Beverage</option>
            <option value="Food">Food</option>
            <option value="Skincare">Skincare</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="FMCG">FMCG</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Status</label>
          <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Location</label>
          <input type="text" className="form-control" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">City</label>
          <input type="text" className="form-control" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
        </div>
      </Modal>

      {/* Interaction Modal */}
      <Modal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        title="Add Interaction"
        footer={
          <>
            <button className="btn btn-light me-3" onClick={() => setIsInteractionModalOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleInteractionSubmit}>Add Interaction</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">Interaction Name</label>
          <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter interaction name" />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Type</label>
          <select className="form-select" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
            <option value="">Select type...</option>
            <option value="Discovery">🔍 Discovery</option>
            <option value="Label discussion">🏷️ Label discussion</option>
            <option value="Price Discussion">💰 Price Discussion</option>
            <option value="Custom Solution">⚙️ Custom Solution</option>
            <option value="Weekly Check-in">📅 Weekly Check-in</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Date & Time</label>
          <input type="datetime-local" className="form-control" value={formData.datetime} onChange={e => setFormData({ ...formData, datetime: e.target.value })} />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
        </div>
      </Modal>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add Task"
        footer={
          <>
            <button className="btn btn-light me-3" onClick={() => setIsTaskModalOpen(false)}>Close</button>
            <button className="btn btn-primary" onClick={handleTaskSubmit}>Add Task</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">Task Title</label>
          <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Enter task title" />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Status</label>
          <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="To do">📋 To do</option>
            <option value="In progress">⚙️ In progress</option>
            <option value="Done">✅ Done</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Priority</label>
          <select className="form-select" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
            <option value="">Select priority...</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">Deadline</label>
          <input type="date" className="form-control" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
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
          <p>Are you sure you want to delete <strong>{selectedAccount?.fields['Account Name']}</strong>? This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}
