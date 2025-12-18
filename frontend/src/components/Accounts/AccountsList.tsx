import { useState, useEffect } from 'react';
import { accountService, interactionService, taskService, teamMemberService } from '../../services/airtable.service';
import type { Account, TeamMember } from '../../types/airtable.types';

declare const Swal: any;

export default function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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

      // Check if names start with numbers
      const startsWithNumberA = /^\d/.test(nameA);
      const startsWithNumberB = /^\d/.test(nameB);

      if (startsWithNumberA && startsWithNumberB) {
        // Both start with numbers - extract and compare numerically
        const numA = parseInt(nameA.match(/^(\d+)/)?.[1] || '0', 10);
        const numB = parseInt(nameB.match(/^(\d+)/)?.[1] || '0', 10);
        return numA - numB;
      } else if (startsWithNumberA) {
        // A starts with number, B doesn't - A comes first
        return -1;
      } else if (startsWithNumberB) {
        // B starts with number, A doesn't - B comes first
        return 1;
      } else {
        // Both start with letters - alphabetical sort
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
      }
    });

  const handleRowClick = (account: Account) => {
    if (typeof Swal !== 'undefined') {
      // Get account number from the name (e.g., "123" from "123 Company") - only show if starts with number
      const accountNumberMatch = account.fields['Account Name']?.match(/^(\d+)/);
      const accountNumber = accountNumberMatch ? accountNumberMatch[1] : '';

      const logoHtml = account.fields['Logo']?.[0]
        ? `<img src="${account.fields['Logo'][0].url}" alt="${account.fields['Account Name']}" style="max-width: 100px; max-height: 100px; border-radius: 8px;" />`
        : accountNumber
        ? `<div class="symbol symbol-75px"><div class="symbol-label fs-1 bg-light-info text-info">${accountNumber}</div></div>`
        : '';

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-shop fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
            <span class="path4"></span>
            <span class="path5"></span>
          </i>
          <span>${account.fields['Account Name']}</span>
        </div>`,
        html: `
          <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
            <!-- Logo -->
            <div class="text-center mb-5">
              ${logoHtml}
            </div>

            <!-- Action Buttons Row -->
            <div class="d-flex flex-wrap gap-2 mb-5">
              <button class="btn btn-sm btn-light-primary" id="edit-account-btn">
                <i class="ki-duotone ki-pencil fs-4 me-1"><span class="path1"></span><span class="path2"></span></i>
                Edit
              </button>
              <button class="btn btn-sm btn-light-success" id="add-interaction-btn">
                <i class="ki-duotone ki-messages fs-4 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                Add Interaction
              </button>
              <button class="btn btn-sm btn-light-warning" id="add-task-btn">
                <i class="ki-duotone ki-check-square fs-4 me-1"><span class="path1"></span><span class="path2"></span></i>
                Add Task
              </button>
              <button class="btn btn-sm btn-light-danger" id="delete-account-btn">
                <i class="ki-duotone ki-trash fs-4 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                Delete
              </button>
            </div>

            <!-- Account Information -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-primary">
                <h6 class="card-title mb-0 text-primary">
                  <i class="ki-duotone ki-abstract-26 fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Business Details
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Industry</label>
                    <div><span class="badge badge-light-primary fs-6">${account.fields['Industry'] || 'N/A'}</span></div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Company Size</label>
                    <div class="text-gray-800 fw-bold">${account.fields['Size'] || 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Status</label>
                    <div>
                      ${account.fields['Account Status'] === 'Active'
                        ? '<span class="badge badge-light-success fs-6">Active</span>'
                        : '<span class="badge badge-light-danger fs-6">Inactive</span>'}
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Platform</label>
                    <div><span class="badge badge-light-info fs-6">${account.fields['Platform'] || 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact & Location -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-info">
                <h6 class="card-title mb-0 text-info">
                  <i class="ki-duotone ki-geolocation fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Contact & Location
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Location</label>
                    <div class="text-gray-800 fw-bold">${account.fields['Location'] || 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">City</label>
                    <div class="text-gray-800 fw-bold">${account.fields['City'] || 'N/A'}</div>
                  </div>
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Website</label>
                    <div class="text-gray-800 fw-bold">${account.fields['Company Website'] ? `<a href="${account.fields['Company Website']}" target="_blank" class="text-primary">${account.fields['Company Website']}</a>` : 'N/A'}</div>
                  </div>
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Social Media Handle</label>
                    <div class="text-gray-800 fw-bold">${account.fields['Social Media Handle'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            ${account.fields['Notes'] ? `
            <!-- Notes -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-warning">
                <h6 class="card-title mb-0 text-warning">
                  <i class="ki-duotone ki-note-2 fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                  </i>
                  Special Notes
                </h6>
              </div>
              <div class="card-body">
                <div class="text-gray-800">${account.fields['Notes']}</div>
              </div>
            </div>
            ` : ''}
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: 900,
        customClass: {
          popup: 'rounded',
          title: 'fs-4',
          htmlContainer: 'p-0'
        },
        didOpen: () => {
          // Add event listeners for action buttons
          document.getElementById('edit-account-btn')?.addEventListener('click', () => {
            Swal.close();
            handleEdit(account);
          });
          document.getElementById('add-interaction-btn')?.addEventListener('click', () => {
            Swal.close();
            handleAddInteraction(account);
          });
          document.getElementById('add-task-btn')?.addEventListener('click', () => {
            Swal.close();
            handleAddTask(account);
          });
          document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            Swal.close();
            handleDelete(account);
          });
        },
      });
    }
  };

  const handleEdit = (account: Account) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
          </i>
          <span>Edit Account</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-abstract-21 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Account Name
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="edit-accountname"
                value="${account.fields['Account Name'] || ''}"
                placeholder="Enter account name"
              />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-abstract-26 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Industry
              </label>
              <select class="form-select form-select-solid" id="edit-industry">
                <option value="">Select industry...</option>
                <option value="Beverage" ${account.fields['Industry'] === 'Beverage' ? 'selected' : ''}>🍹 Beverage</option>
                <option value="Food" ${account.fields['Industry'] === 'Food' ? 'selected' : ''}>🍽️ Food</option>
                <option value="Skincare" ${account.fields['Industry'] === 'Skincare' ? 'selected' : ''}>💄 Skincare</option>
                <option value="Manufacturing" ${account.fields['Industry'] === 'Manufacturing' ? 'selected' : ''}>⚙️ Manufacturing</option>
                <option value="FMCG" ${account.fields['Industry'] === 'FMCG' ? 'selected' : ''}>📦 FMCG</option>
              </select>
            </div>
            <div class="row g-3 mb-5">
              <div class="col-6">
                <label class="form-label fw-bold fs-6 mb-2">
                  <i class="ki-duotone ki-geolocation fs-4 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Location
                </label>
                <input
                  type="text"
                  class="form-control form-control-solid"
                  id="edit-location"
                  value="${account.fields['Location'] || ''}"
                  placeholder="Enter location"
                />
              </div>
              <div class="col-6">
                <label class="form-label fw-bold fs-6 mb-2">
                  <i class="ki-duotone ki-map fs-4 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  City
                </label>
                <input
                  type="text"
                  class="form-control form-control-solid"
                  id="edit-city"
                  value="${account.fields['City'] || ''}"
                  placeholder="Enter city"
                />
              </div>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-check-circle fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Status
              </label>
              <select class="form-select form-select-solid" id="edit-status">
                <option value="Active" ${account.fields['Account Status'] === 'Active' ? 'selected' : ''}>✅ Active</option>
                <option value="Inactive" ${account.fields['Account Status'] === 'Inactive' ? 'selected' : ''}>❌ Inactive</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-globe fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Website
              </label>
              <input
                type="url"
                class="form-control form-control-solid"
                id="edit-website"
                value="${account.fields['Company Website'] || ''}"
                placeholder="https://example.com"
              />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-social-media fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Social Media Handle
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="edit-social"
                value="${account.fields['Social Media Handle'] || ''}"
                placeholder="@handle"
              />
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-note-2 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Notes
              </label>
              <textarea
                class="form-control form-control-solid"
                id="edit-notes"
                rows="3"
                placeholder="Enter any special notes..."
              >${account.fields['Notes'] || ''}</textarea>
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
        width: 700,
        preConfirm: () => {
          const accountName = (document.getElementById('edit-accountname') as HTMLInputElement)?.value;
          const industry = (document.getElementById('edit-industry') as HTMLSelectElement)?.value;
          const location = (document.getElementById('edit-location') as HTMLInputElement)?.value;
          const city = (document.getElementById('edit-city') as HTMLInputElement)?.value;
          const status = (document.getElementById('edit-status') as HTMLSelectElement)?.value;
          const website = (document.getElementById('edit-website') as HTMLInputElement)?.value;
          const social = (document.getElementById('edit-social') as HTMLInputElement)?.value;
          const notes = (document.getElementById('edit-notes') as HTMLTextAreaElement)?.value;

          if (!accountName) {
            Swal.showValidationMessage('Account Name is required');
            return false;
          }

          return { accountName, industry, location, city, status, website, social, notes };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await accountService.update(account.id, {
              'Account Name': result.value.accountName,
              'Industry': result.value.industry || undefined,
              'Location': result.value.location || undefined,
              'City': result.value.city || undefined,
              'Account Status': result.value.status as 'Active' | 'Inactive',
              'Company Website': result.value.website || undefined,
              'Social Media Handle': result.value.social || undefined,
              'Notes': result.value.notes || undefined,
            });
            Swal.fire('Updated!', 'Account has been updated.', 'success');
            loadAccounts();
          } catch (err) {
            Swal.fire('Error', 'Failed to update account', 'error');
          }
        }
      });
    }
  };

  const handleAddInteraction = (account: Account) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-messages fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
            <span class="path4"></span>
            <span class="path5"></span>
          </i>
          <span>Add Interaction</span>
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
                Interaction Name
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="interaction-name"
                placeholder="Enter interaction name"
              />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-abstract-26 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Type
              </label>
              <select class="form-select form-select-solid" id="interaction-type">
                <option value="">Select type...</option>
                <option value="Discovery">🔍 Discovery</option>
                <option value="Label discussion">🏷️ Label discussion</option>
                <option value="Price Discussion">💰 Price Discussion</option>
                <option value="Custom Solution">⚙️ Custom Solution</option>
                <option value="Weekly Check-in">📅 Weekly Check-in</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Date & Time
              </label>
              <input
                type="datetime-local"
                class="form-control form-control-solid"
                id="interaction-datetime"
              />
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-text-align-left fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Notes
              </label>
              <textarea
                class="form-control form-control-solid"
                id="interaction-notes"
                rows="4"
                placeholder="Enter interaction notes..."
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Interaction',
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
          const name = (document.getElementById('interaction-name') as HTMLInputElement)?.value;
          const type = (document.getElementById('interaction-type') as HTMLSelectElement)?.value;
          const datetime = (document.getElementById('interaction-datetime') as HTMLInputElement)?.value;
          const notes = (document.getElementById('interaction-notes') as HTMLTextAreaElement)?.value;

          if (!name) {
            Swal.showValidationMessage('Name is required');
            return false;
          }

          return { name, type, datetime, notes };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await interactionService.create({
              'Name': result.value.name,
              'Type': result.value.type || undefined,
              'Date & Time': result.value.datetime || undefined,
              'Notes': result.value.notes || undefined,
              'Account': [account.id],
            });
            Swal.fire('Added!', 'Interaction has been added.', 'success');
            loadAccounts();
          } catch (err) {
            Swal.fire('Error', 'Failed to add interaction', 'error');
          }
        }
      });
    }
  };

  const handleAddTask = (account: Account) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-check-square fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
          </i>
          <span>Add Task</span>
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
                Task Title
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="task-title"
                placeholder="Enter task title"
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
                Task Description
              </label>
              <textarea
                class="form-control form-control-solid"
                id="task-description"
                rows="3"
                placeholder="Enter task description..."
              ></textarea>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-status fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Status
              </label>
              <select class="form-select form-select-solid" id="task-status">
                <option value="To do">📋 To do</option>
                <option value="In progress">⚙️ In progress</option>
                <option value="Done">✅ Done</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-flag fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Priority
              </label>
              <select class="form-select form-select-solid" id="task-priority">
                <option value="">Select priority...</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Task Deadline
              </label>
              <input
                type="date"
                class="form-control form-control-solid"
                id="task-deadline"
              />
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Task',
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
          const title = (document.getElementById('task-title') as HTMLInputElement)?.value;
          const description = (document.getElementById('task-description') as HTMLTextAreaElement)?.value;
          const status = (document.getElementById('task-status') as HTMLSelectElement)?.value;
          const priority = (document.getElementById('task-priority') as HTMLSelectElement)?.value;
          const deadline = (document.getElementById('task-deadline') as HTMLInputElement)?.value;

          if (!title) {
            Swal.showValidationMessage('Task Title is required');
            return false;
          }

          return { title, description, status, priority, deadline };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await taskService.create({
              'Task Title': result.value.title,
              'Task Description': result.value.description || undefined,
              'Status': result.value.status || 'To do',
              'Priority': result.value.priority || undefined,
              'Task Deadline': result.value.deadline || undefined,
              'Accounts': [account.id],
            });
            Swal.fire('Added!', 'Task has been added.', 'success');
            loadAccounts();
          } catch (err) {
            Swal.fire('Error', 'Failed to add task', 'error');
          }
        }
      });
    }
  };

  const handleDelete = (account: Account) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Delete Account?',
        text: `Are you sure you want to delete ${account.fields['Account Name']}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await accountService.delete(account.id);
            Swal.fire('Deleted!', 'Account has been deleted.', 'success');
            loadAccounts();
          } catch (err) {
            Swal.fire('Error', 'Failed to delete account', 'error');
          }
        }
      });
    }
  };

  const handleCreateAccount = () => {
    if (typeof Swal !== 'undefined') {
      // Generate options for team members (account owner dropdown)
      const teamMemberOptions = teamMembers.map(tm =>
        `<option value="${tm.id}">${tm.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: 'Create New Business/Account',
        html: `
          <div class="d-flex flex-column gap-3" style="max-height: 500px; overflow-y: auto;">
            <div class="fv-row text-start">
              <label class="form-label required">Business Name</label>
              <input type="text" class="form-control" id="create-businessname" placeholder="Enter business name" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Industry</label>
              <select class="form-select" id="create-industry">
                <option value="">Select industry...</option>
                <option value="Beverage">Beverage</option>
                <option value="Food">Food</option>
                <option value="Skincare">Skincare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="FMCG">FMCG</option>
              </select>
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Size</label>
              <select class="form-select" id="create-size">
                <option value="">Select size...</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-100">51-100</option>
                <option value="101-500">101-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000-5000">1000-5000</option>
                <option value="10,000+">10,000+</option>
              </select>
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Account Status</label>
              <select class="form-select" id="create-accountstatus">
                <option value="">Select status...</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div class="fv-row text-start">
              <label class="form-label">Physical Location</label>
              <input type="text" class="form-control" id="create-location" placeholder="Enter physical location" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label">City</label>
              <input type="text" class="form-control" id="create-city" placeholder="Enter city" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label">Company Website</label>
              <input type="url" class="form-control" id="create-website" placeholder="https://example.com" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label">Social Media Handle</label>
              <input type="text" class="form-control" id="create-socialmedia" placeholder="@handle" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label">Platform</label>
              <select class="form-select" id="create-platform">
                <option value="">Select platform...</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Snapchat">Snapchat</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Account Owner</label>
              <select class="form-select" id="create-accountowner">
                <option value="">Select account owner...</option>
                ${teamMemberOptions}
              </select>
            </div>
            <div class="fv-row text-start">
              <label class="form-label">Special Notes</label>
              <textarea class="form-control" id="create-notes" rows="3" placeholder="Enter any special notes"></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Account',
        cancelButtonText: 'Cancel',
        width: 700,
        preConfirm: () => {
          const businessName = (document.getElementById('create-businessname') as HTMLInputElement)?.value;
          const industry = (document.getElementById('create-industry') as HTMLSelectElement)?.value;
          const size = (document.getElementById('create-size') as HTMLSelectElement)?.value;
          const accountStatus = (document.getElementById('create-accountstatus') as HTMLSelectElement)?.value;
          const location = (document.getElementById('create-location') as HTMLInputElement)?.value;
          const city = (document.getElementById('create-city') as HTMLInputElement)?.value;
          const website = (document.getElementById('create-website') as HTMLInputElement)?.value;
          const socialMedia = (document.getElementById('create-socialmedia') as HTMLInputElement)?.value;
          const platform = (document.getElementById('create-platform') as HTMLSelectElement)?.value;
          const accountOwner = (document.getElementById('create-accountowner') as HTMLSelectElement)?.value;
          const notes = (document.getElementById('create-notes') as HTMLTextAreaElement)?.value;

          if (!businessName) {
            Swal.showValidationMessage('Business Name is required');
            return false;
          }
          if (!industry) {
            Swal.showValidationMessage('Industry is required');
            return false;
          }
          if (!size) {
            Swal.showValidationMessage('Size is required');
            return false;
          }
          if (!accountStatus) {
            Swal.showValidationMessage('Account Status is required');
            return false;
          }
          if (!accountOwner) {
            Swal.showValidationMessage('Account Owner is required');
            return false;
          }

          return { businessName, industry, size, accountStatus, location, city, website, socialMedia, platform, accountOwner, notes };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await accountService.create({
              'Account Name': result.value.businessName,
              'Industry': result.value.industry,
              'Size': result.value.size,
              'Account Status': result.value.accountStatus as 'Active' | 'Inactive',
              'Location': result.value.location || undefined,
              'City': result.value.city || undefined,
              'Company Website': result.value.website || undefined,
              'Social Media Handle': result.value.socialMedia || undefined,
              'Platform': result.value.platform || undefined,
              'Account owner': [result.value.accountOwner],
              'Notes': result.value.notes || undefined,
            });
            Swal.fire('Created!', 'Account has been created successfully.', 'success');
            loadAccounts();
          } catch (err) {
            Swal.fire('Error', 'Failed to create account', 'error');
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadAccounts}>
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

            <button className="btn btn-success" onClick={handleCreateAccount}>
              <i className="bi bi-plus-circle"></i>
              Create Account
            </button>

            <button className="btn btn-primary" onClick={loadAccounts}>
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="card-body py-4">
        <div className="table-responsive">
          <table className="table align-middle table-row-dashed fs-6 gy-5">
            <thead>
              <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                <th className="min-w-200px">Account Name</th>
                <th className="min-w-120px">Industry</th>
                <th className="min-w-100px">Size</th>
                <th className="min-w-120px">Location</th>
                <th className="min-w-100px">Status</th>
                <th className="min-w-100px">Platform</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 fw-semibold">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="text-gray-600">No accounts found</div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  // Get account number from the name (e.g., "123" from "123 Company") - only show if starts with number
                  const accountNumberMatch = account.fields['Account Name']?.match(/^(\d+)/);
                  const accountNumber = accountNumberMatch ? accountNumberMatch[1] : '';

                  return (
                    <tr
                      key={account.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(account)}
                      className="table-row-hover"
                    >
                      <td>
                        <div className="d-flex align-items-center">
                          {account.fields['Logo']?.[0] ? (
                            <div className="symbol symbol-45px me-5">
                              <img src={account.fields['Logo'][0].url} alt={account.fields['Account Name']} />
                            </div>
                          ) : accountNumber ? (
                            <div className="symbol symbol-45px me-5">
                              <div className="symbol-label fs-3 bg-light-info text-info">
                                {accountNumber}
                              </div>
                            </div>
                          ) : null}
                          <div className="d-flex justify-content-start flex-column">
                            <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                              {account.fields['Account Name'] || 'N/A'}
                            </span>
                            {account.fields['Social Media Handle'] && (
                              <span className="text-muted fw-semibold text-muted d-block fs-7">
                                {account.fields['Social Media Handle']}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    <td>
                      <span className="badge badge-light-primary">
                        {account.fields['Industry'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600">
                        {account.fields['Size'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-900 fw-bold d-block fs-6">
                        {account.fields['Location'] || 'N/A'}
                      </span>
                      {account.fields['City'] && (
                        <span className="text-muted fw-semibold text-muted d-block fs-7">
                          {account.fields['City']}
                        </span>
                      )}
                    </td>
                    <td>
                      {account.fields['Account Status'] === 'Active' ? (
                        <span className="badge badge-light-success">Active</span>
                      ) : (
                        <span className="badge badge-light-danger">Inactive</span>
                      )}
                    </td>
                    <td>
                      {account.fields['Platform'] && (
                        <span className="badge badge-light-info">
                          {account.fields['Platform']}
                        </span>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        </div>
      </div>
    </div>
  );
}
