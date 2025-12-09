import { useState, useEffect } from 'react';
import { interactionService, teamMemberService, accountService } from '../../services/airtable.service';
import type { Interaction, TeamMember, Account } from '../../types/airtable.types';

declare const Swal: any;

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
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

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
    if (typeof Swal !== 'undefined') {
      const teamMemberName = getTeamMemberName(interaction.fields['Team Member']);
      const accountName = getAccountName(interaction.fields['Account']);

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-message-text-2 fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
          </i>
          <span>${interaction.fields['Name']}</span>
        </div>`,
        html: `
          <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
            <!-- Interaction Information -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-primary">
                <h6 class="card-title mb-0 text-primary">
                  <i class="ki-duotone ki-information fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                  </i>
                  Interaction Details
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Type</label>
                    <div>
                      <span class="badge ${getInteractionTypeBadge(interaction.fields['Type'])} fs-6">
                        ${interaction.fields['Type'] || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Date & Time</label>
                    <div class="text-gray-800 fw-bold">${interaction.fields['Date & Time'] ? new Date(interaction.fields['Date & Time']).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Notes</label>
                    <div class="text-gray-800">${interaction.fields['Notes'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interaction Participants -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-info">
                <h6 class="card-title mb-0 text-info">
                  <i class="ki-duotone ki-people fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                    <span class="path5"></span>
                  </i>
                  Participants
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Team Member</label>
                    <div class="text-gray-800 fw-bold">${teamMemberName}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Account</label>
                    <div>
                      ${interaction.fields['Account'] && interaction.fields['Account'].length > 0
                        ? `<a href="#" id="view-account-btn" class="text-primary fw-bold" style="text-decoration: underline; cursor: pointer;">${accountName}</a>`
                        : `<span class="text-gray-800 fw-bold">${accountName}</span>`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Edit',
        cancelButtonText: 'Close',
        showDenyButton: true,
        denyButtonText: 'Delete',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-primary',
          denyButton: 'btn btn-danger',
          cancelButton: 'btn btn-light me-3',
          popup: 'rounded',
          title: 'fs-4',
          htmlContainer: 'p-0'
        },
        width: 900,
        didOpen: () => {
          document.getElementById('view-account-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.close();
            if (interaction.fields['Account'] && interaction.fields['Account'].length > 0) {
              setSelectedAccountId(interaction.fields['Account'][0]);
              if (onNavigate) {
                onNavigate('accounts');
              }
            }
          });
        },
      }).then((result) => {
        if (result.isConfirmed) {
          handleEdit(interaction);
        } else if (result.isDenied) {
          handleDelete(interaction);
        }
      });
    }
  };

  const handleEdit = (interaction: Interaction) => {
    if (typeof Swal !== 'undefined') {
      // Generate options for team members
      const teamMemberOptions = teamMembers.map(tm =>
        `<option value="${tm.id}" ${interaction.fields['Team Member']?.[0] === tm.id ? 'selected' : ''}>${tm.fields['Name']}</option>`
      ).join('');

      // Generate options for accounts
      const accountOptions = accounts.map(acc =>
        `<option value="${acc.id}" ${interaction.fields['Account']?.[0] === acc.id ? 'selected' : ''}>${acc.fields['Account Name']}</option>`
      ).join('');

      // Format datetime for input field (convert to local datetime-local format)
      const formatDateTimeForInput = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
          </i>
          <span>Edit Interaction</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-tag fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Name
              </label>
              <input type="text" class="form-control form-control-solid" id="edit-name" value="${interaction.fields['Name'] || ''}" placeholder="Enter interaction name" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-category fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Type
              </label>
              <select class="form-select form-select-solid" id="edit-type">
                <option value="">Select type...</option>
                <option value="Discovery" ${interaction.fields['Type'] === 'Discovery' ? 'selected' : ''}>Discovery</option>
                <option value="Label discussion" ${interaction.fields['Type'] === 'Label discussion' ? 'selected' : ''}>Label discussion</option>
                <option value="Price Discussion" ${interaction.fields['Type'] === 'Price Discussion' ? 'selected' : ''}>Price Discussion</option>
                <option value="Custom Solution" ${interaction.fields['Type'] === 'Custom Solution' ? 'selected' : ''}>Custom Solution</option>
                <option value="Weekly Check-in" ${interaction.fields['Type'] === 'Weekly Check-in' ? 'selected' : ''}>Weekly Check-in</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar-search fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Date & Time
              </label>
              <input type="datetime-local" class="form-control form-control-solid" id="edit-datetime" value="${formatDateTimeForInput(interaction.fields['Date & Time'])}" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-user fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Team Member
              </label>
              <select class="form-select form-select-solid" id="edit-teammember">
                <option value="">Select team member...</option>
                ${teamMemberOptions}
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-shop fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                </i>
                Account
              </label>
              <select class="form-select form-select-solid" id="edit-account">
                <option value="">Select account...</option>
                ${accountOptions}
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-note-2 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Notes
              </label>
              <textarea class="form-control form-control-solid" id="edit-notes" rows="4" placeholder="Enter notes">${interaction.fields['Notes'] || ''}</textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
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
          const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
          const type = (document.getElementById('edit-type') as HTMLSelectElement)?.value;
          const datetime = (document.getElementById('edit-datetime') as HTMLInputElement)?.value;
          const teamMember = (document.getElementById('edit-teammember') as HTMLSelectElement)?.value;
          const account = (document.getElementById('edit-account') as HTMLSelectElement)?.value;
          const notes = (document.getElementById('edit-notes') as HTMLTextAreaElement)?.value;

          if (!name) {
            Swal.showValidationMessage('Name is required');
            return false;
          }

          return { name, type, datetime, teamMember, account, notes };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await interactionService.update(interaction.id, {
              'Name': result.value.name,
              'Type': result.value.type || undefined,
              'Date & Time': result.value.datetime || undefined,
              'Team Member': result.value.teamMember ? [result.value.teamMember] : undefined,
              'Account': result.value.account ? [result.value.account] : undefined,
              'Notes': result.value.notes || undefined,
            });
            Swal.fire('Updated!', 'Interaction has been updated.', 'success');
            loadInteractions();
          } catch (err) {
            Swal.fire('Error', 'Failed to update interaction', 'error');
          }
        }
      });
    }
  };

  const handleDelete = (interaction: Interaction) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Delete Interaction?',
        text: `Are you sure you want to delete "${interaction.fields['Name']}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await interactionService.delete(interaction.id);
            Swal.fire('Deleted!', 'Interaction has been deleted.', 'success');
            loadInteractions();
          } catch (err) {
            Swal.fire('Error', 'Failed to delete interaction', 'error');
          }
        }
      });
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
  );
}
