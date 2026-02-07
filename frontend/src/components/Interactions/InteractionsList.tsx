import { useState, useEffect } from 'react';
import { interactionService, teamMemberService, accountService } from '../../services/airtable.service';
import type { Interaction, TeamMember, Account } from '../../types/airtable.types';

import Modal from '../Common/Modal';

interface InteractionsListProps {
  onNavigate?: (view: string) => void;
}

export default function InteractionsList({ onNavigate }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    type: '',
    datetime: '',
    teamMember: '',
    account: '',
    notes: ''
  });

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      // Load all data in parallel for better performance
      const [interactionsData, teamMembersData, accountsData] = await Promise.all([
        interactionService.getAll(),
        teamMemberService.getAll(),
        accountService.getAll(),
      ]);

      setInteractions(interactionsData);
      setTeamMembers(teamMembersData);
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInteractions = async () => {
    try {
      setLoading(true);
      const data = await interactionService.getAll();
      setInteractions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load interactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInteractions = interactions
    .filter((interaction) => {
      const matchesSearch = searchTerm === '' ||
        interaction.fields['Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interaction.fields['Notes']?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === '' || interaction.fields['Type'] === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by Date & Time ascending (oldest first)
      const dateA = a.fields['Date & Time'] ? new Date(a.fields['Date & Time']).getTime() : 0;
      const dateB = b.fields['Date & Time'] ? new Date(b.fields['Date & Time']).getTime() : 0;
      return dateA - dateB;
    });

  const getInteractionTypeBadge = (type?: string) => {
    const typeMap: Record<string, string> = {
      'Discovery': 'badge-light-primary',
      'Label discussion': 'badge-light-info',
      'Price Discussion': 'badge-light-warning',
      'Custom Solution': 'badge-light-success',
      'Weekly Check-in': 'badge-light-secondary',
    };
    return typeMap[type || ''] || 'badge-light-secondary';
  };

  const getTeamMemberName = (teamMemberId?: string[]) => {
    if (!teamMemberId || teamMemberId.length === 0) return 'N/A';
    const member = teamMembers.find(tm => tm.id === teamMemberId[0]);
    return member?.fields['Name'] || teamMemberId[0];
  };

  const getAccountName = (accountId?: string[]) => {
    if (!accountId || accountId.length === 0) return 'N/A';
    const account = accounts.find(acc => acc.id === accountId[0]);
    return account?.fields['Account Name'] || accountId[0];
  };

  const handleRowClick = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedInteraction) return;

    // Format datetime for input field
    const date = selectedInteraction.fields['Date & Time'] ? new Date(selectedInteraction.fields['Date & Time']) : new Date();
    const formattedDate = date.toISOString().slice(0, 16);

    setFormState({
      name: selectedInteraction.fields['Name'] || '',
      type: selectedInteraction.fields['Type'] || '',
      datetime: formattedDate,
      teamMember: selectedInteraction.fields['Team Member']?.[0] || '',
      account: selectedInteraction.fields['Account']?.[0] || '',
      notes: selectedInteraction.fields['Notes'] || ''
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedInteraction || !formState.name) {
      showFeedback('error', 'Name is required');
      return;
    }

    try {
      await interactionService.update(selectedInteraction.id, {
        'Name': formState.name,
        'Type': (formState.type as any) || undefined,
        'Date & Time': formState.datetime || undefined,
        'Team Member': formState.teamMember ? [formState.teamMember] : undefined,
        'Account': formState.account ? [formState.account] : undefined,
        'Notes': formState.notes || undefined,
      });
      showFeedback('success', 'Interaction has been updated.');
      setIsEditModalOpen(false);
      loadInteractions();
    } catch (err) {
      showFeedback('error', 'Failed to update interaction');
      console.error(err);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInteraction) return;
    try {
      await interactionService.delete(selectedInteraction.id);
      showFeedback('success', 'Interaction has been deleted.');
      setIsDeleteModalOpen(false);
      loadInteractions();
    } catch (err) {
      showFeedback('error', 'Failed to delete interaction');
      console.error(err);
    }
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadInteractions}>
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
            <div className="d-flex align-items-center position-relative my-1">
              <i className="bi bi-search fs-3 position-absolute ms-5"></i>
              <input
                type="text"
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <select
                className="form-select form-select-solid w-200px"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Discovery">Discovery</option>
                <option value="Label discussion">Label discussion</option>
                <option value="Price Discussion">Price Discussion</option>
                <option value="Custom Solution">Custom Solution</option>
                <option value="Weekly Check-in">Weekly Check-in</option>
              </select>

              <button className="btn btn-primary" onClick={loadInteractions}>
                <i className="bi bi-arrow-clockwise"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card-body py-4">
          <div className="table-responsive">
            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
              <thead>
                <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                  <th className="min-w-200px">Interaction Name</th>
                  <th className="min-w-120px">Type</th>
                  <th className="min-w-150px">Date & Time</th>
                  <th className="min-w-150px">Team Member</th>
                  <th className="min-w-150px">Account</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 fw-semibold">
                {filteredInteractions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <div className="text-gray-600">No interactions found</div>
                    </td>
                  </tr>
                ) : (
                  filteredInteractions.map((interaction) => (
                    <tr
                      key={interaction.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(interaction)}
                      className="table-row-hover"
                    >
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-gray-900 fw-bold text-hover-primary d-block fs-6">
                            {interaction.fields['Name'] || 'N/A'}
                          </span>
                          {interaction.fields['Notes'] && typeof interaction.fields['Notes'] === 'string' && (
                            <span className="text-muted fw-semibold text-muted d-block fs-7 mt-1">
                              {interaction.fields['Notes'].substring(0, 80)}
                              {interaction.fields['Notes'].length > 80 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getInteractionTypeBadge(interaction.fields['Type'])}`}>
                          {interaction.fields['Type'] || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-600">
                          {interaction.fields['Date & Time']
                            ? new Date(interaction.fields['Date & Time']).toLocaleString()
                            : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-900 fw-bold">
                          {getTeamMemberName(interaction.fields['Team Member'])}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-900 fw-bold">
                          {getAccountName(interaction.fields['Account'])}
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
              Showing {filteredInteractions.length} of {interactions.length} interactions
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedInteraction?.fields['Name'] || 'Interaction Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-danger" onClick={handleOpenDeleteModal}>Delete</button>
            <button className="btn btn-primary" onClick={handleOpenEditModal}>Edit</button>
            <button className="btn btn-light" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
          </div>
        }
      >
        {selectedInteraction && (
          <div className="text-start p-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {/* Interaction Information */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-primary py-3 min-h-auto">
                <h6 className="card-title mb-0 text-primary">
                  <i className="ki-duotone ki-information fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  Interaction Details
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Type</label>
                    <span className={`badge ${getInteractionTypeBadge(selectedInteraction.fields['Type'])} fs-7 mt-1`}>
                      {selectedInteraction.fields['Type'] || 'N/A'}
                    </span>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Date & Time</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">
                      {selectedInteraction.fields['Date & Time'] ? new Date(selectedInteraction.fields['Date & Time']).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted fs-7 fw-semibold d-block">Notes</label>
                    <div className="text-gray-800 mt-1">{selectedInteraction.fields['Notes'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-info py-3 min-h-auto">
                <h6 className="card-title mb-0 text-info">
                  <i className="ki-duotone ki-people fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                    <span className="path5"></span>
                  </i>
                  Participants
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Team Member</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">{getTeamMemberName(selectedInteraction.fields['Team Member'])}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Account</label>
                    <div className="mt-1">
                      {selectedInteraction.fields['Account'] && selectedInteraction.fields['Account'].length > 0 ? (
                        <button
                          className="btn btn-link p-0 text-primary fw-bold text-decoration-underline border-0 h-auto"
                          onClick={() => {
                            setIsDetailsModalOpen(false);
                            if (onNavigate) onNavigate('accounts');
                          }}
                        >
                          {getAccountName(selectedInteraction.fields['Account'])}
                        </button>
                      ) : (
                        <span className="text-gray-800 fw-bold fs-6">{getAccountName(selectedInteraction.fields['Account'])}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Interaction"
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="text-start p-2">
          <div className="mb-5">
            <label className="form-label required fw-bold fs-6">Name</label>
            <input
              className="form-control form-control-solid"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              placeholder="Enter name"
            />
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6">Type</label>
            <select
              className="form-select"
              value={formState.type}
              onChange={(e) => setFormState({ ...formState, type: e.target.value })}
            >
              <option value="">Select type...</option>
              <option value="Discovery">Discovery</option>
              <option value="Label discussion">Label discussion</option>
              <option value="Price Discussion">Price Discussion</option>
              <option value="Custom Solution">Custom Solution</option>
              <option value="Weekly Check-in">Weekly Check-in</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6">Date & Time</label>
            <input
              type="datetime-local"
              className="form-control form-control-solid"
              value={formState.datetime}
              onChange={(e) => setFormState({ ...formState, datetime: e.target.value })}
            />
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6">Team Member</label>
            <select
              className="form-select"
              value={formState.teamMember}
              onChange={(e) => setFormState({ ...formState, teamMember: e.target.value })}
            >
              <option value="">Select team member...</option>
              {teamMembers.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6">Account</label>
            <select
              className="form-select"
              value={formState.account}
              onChange={(e) => setFormState({ ...formState, account: e.target.value })}
            >
              <option value="">Select account...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.fields['Account Name']}</option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6">Notes</label>
            <textarea
              className="form-control form-control-solid"
              rows={4}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Enter notes"
            />
          </div>
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
          <p>Are you sure you want to delete this interaction? This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}
