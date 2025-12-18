import { useState, useEffect, useRef } from 'react';
import { customerContactService, teamMemberService, accountService, interactionService, taskService } from '../../services/airtable.service';
import type { CustomerContact, TeamMember } from '../../types/airtable.types';

// Declare jQuery and DataTables types
declare const $: any;
declare const Swal: any;

export default function CustomerContactsList() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Initialize DataTable when contacts are loaded
    if (!loading && contacts.length > 0 && tableRef.current && !dataTableRef.current) {
      initializeDataTable();
    }

    // Cleanup DataTable on unmount
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [loading, contacts]);

  const initializeDataTable = () => {
    if (!tableRef.current || typeof $ === 'undefined') return;

    try {
      // Add custom sorting function for Customer ID (CU-1, CU-2, etc.)
      $.fn.dataTable.ext.type.order['customer-id-pre'] = function(data: string) {
        // Extract the number from "CU-123" format
        const match = data.match(/CU-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      dataTableRef.current = $(tableRef.current).DataTable({
        info: false,
        order: [[0, 'asc']], // Sort by Customer ID ascending (1 to infinity)
        columnDefs: [
          {
            targets: 0,
            type: 'customer-id', // Use custom sorting type
            orderable: true
          },
          { orderable: false, targets: '_all' }, // Disable sorting on all other columns
        ],
        pageLength: 10,
        language: {
          search: '',
          searchPlaceholder: 'Search contacts...',
          lengthMenu: '_MENU_',
          paginate: {
            previous: '<i class="ki-duotone ki-arrow-left"><span class="path1"></span><span class="path2"></span></i>',
            next: '<i class="ki-duotone ki-arrow-right"><span class="path1"></span><span class="path2"></span></i>',
          },
        },
        dom: `<'row'<'col-sm-12'tr>>
              <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>`,
      });
    } catch (err) {
      console.error('Error initializing DataTable:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Load both contacts and team members
      const [contactsData, teamMembersData] = await Promise.all([
        customerContactService.getAll(),
        teamMemberService.getAll(),
      ]);
      setContacts(contactsData);
      setTeamMembers(teamMembersData);
      setError(null);
    } catch (err) {
      setError('Failed to load customer contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (typeof Swal !== 'undefined') {
      // Build team members dropdown options
      const teamMemberOptions = teamMembers.map(member =>
        `<option value="${member.id}">${member.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: 'Add New Customer Contact',
        html: `
          <div class="d-flex flex-column gap-3">
            <div class="fv-row text-start">
              <label class="form-label required">Contact Name</label>
              <input type="text" class="form-control" id="create-name" placeholder="Enter contact name" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Phone</label>
              <input type="text" class="form-control" id="create-phone" placeholder="Enter phone number" />
            </div>
            <div class="fv-row text-start">
              <label class="form-label required">Discovery Source</label>
              <select class="form-select" id="create-source">
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
            <div class="fv-row text-start">
              <label class="form-label">Created By</label>
              <select class="form-select" id="create-createdby">
                <option value="">Select team member...</option>
                ${teamMemberOptions}
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Contact',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-light',
        },
        width: 600,
        preConfirm: () => {
          const name = (document.getElementById('create-name') as HTMLInputElement)?.value;
          const phone = (document.getElementById('create-phone') as HTMLInputElement)?.value;
          const source = (document.getElementById('create-source') as HTMLSelectElement)?.value;
          const createdById = (document.getElementById('create-createdby') as HTMLSelectElement)?.value;

          if (!name || !phone || !source) {
            Swal.showValidationMessage('Please fill in all required fields');
            return false;
          }

          return { name, phone, source, createdById };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            // Generate a unique Customer ID
            const customerId = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            await customerContactService.create({
              'Customer ID': customerId,
              'Contact Name': result.value.name,
              'Phone': result.value.phone,
              'Discovery Source': result.value.source,
              'Created by': result.value.createdById ? [result.value.createdById] : undefined,
            });

            Swal.fire({
              title: 'Success!',
              text: 'Customer contact has been created',
              icon: 'success',
              confirmButtonText: 'Ok',
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            });

            loadData();
          } catch (err) {
            Swal.fire({
              title: 'Error!',
              text: 'Failed to create customer contact',
              icon: 'error',
              confirmButtonText: 'Ok',
              customClass: {
                confirmButton: 'btn btn-danger',
              },
            });
          }
        }
      });
    }
  };

  const handleRowClick = (contact: CustomerContact) => {
    if (typeof Swal !== 'undefined') {
      // Get team member names from linked IDs
      const createdByName = contact.fields['Created by']?.[0]
        ? teamMembers.find(tm => tm.id === contact.fields['Created by']?.[0])?.fields['Name'] || contact.fields['Created by']?.[0]
        : 'N/A';

      const accountManagerName = contact.fields['Account Manager']?.[0]
        ? teamMembers.find(tm => tm.id === contact.fields['Account Manager']?.[0])?.fields['Name'] || contact.fields['Account Manager']?.[0]
        : 'Unassigned';

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-user-tick fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
          </i>
          <span>${contact.fields['Contact Name']}</span>
        </div>`,
        html: `
          <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
            <!-- Action Buttons Row -->
            <div class="d-flex flex-wrap gap-2 mb-5">
              <button class="btn btn-sm btn-light-primary" id="edit-contact-btn">
                <i class="ki-duotone ki-pencil fs-4 me-1"><span class="path1"></span><span class="path2"></span></i>
                Edit
              </button>
              <button class="btn btn-sm btn-light-info" id="add-account-btn">
                <i class="ki-duotone ki-shop fs-4 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                Account
              </button>
              <button class="btn btn-sm btn-light-success" id="add-interaction-btn">
                <i class="ki-duotone ki-messages fs-4 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                Interaction
              </button>
              <button class="btn btn-sm btn-light-warning" id="add-task-btn">
                <i class="ki-duotone ki-check-square fs-4 me-1"><span class="path1"></span><span class="path2"></span></i>
                Task
              </button>
              <button class="btn btn-sm btn-light-danger" id="delete-contact-btn">
                <i class="ki-duotone ki-trash fs-4 me-1"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                Delete
              </button>
            </div>

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
                    <label class="text-muted fs-7 fw-semibold">Customer ID</label>
                    <div class="text-gray-800 fw-bold">${contact.fields['Customer ID'] || 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Phone</label>
                    <div class="text-gray-800">${contact.fields['Phone'] || 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Discovery Source</label>
                    <div>
                      <span class="badge badge-light-info fs-7">${contact.fields['Discovery Source'] || 'N/A'}</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Account Manager</label>
                    <div class="text-gray-800">${accountManagerName}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity & Tags -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-success">
                <h6 class="card-title mb-0 text-success">
                  <i class="ki-duotone ki-tag fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                  </i>
                  Tags & Activity
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-12">
                    <label class="text-muted fs-7 fw-semibold">Tags</label>
                    <div>
                      ${Array.isArray(contact.fields['Tag']) && contact.fields['Tag'].length > 0
                        ? contact.fields['Tag'].map(tag => `<span class="badge badge-light-warning me-2 fs-7">${tag}</span>`).join('')
                        : '<span class="text-gray-600">No tags</span>'}
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Last Interaction</label>
                    <div class="text-gray-800">${contact.fields['Last Interaction'] || 'Never'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Created By</label>
                    <div class="text-gray-800">${createdByName}</div>
                  </div>
                </div>
              </div>
            </div>
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
          document.getElementById('edit-contact-btn')?.addEventListener('click', () => {
            Swal.close();
            handleEdit(contact);
          });
          document.getElementById('add-account-btn')?.addEventListener('click', () => {
            Swal.close();
            handleAddAccount(contact);
          });
          document.getElementById('add-interaction-btn')?.addEventListener('click', () => {
            Swal.close();
            handleAddInteraction(contact);
          });
          document.getElementById('add-task-btn')?.addEventListener('click', () => {
            Swal.close();
            handleAddTask(contact);
          });
          document.getElementById('delete-contact-btn')?.addEventListener('click', () => {
            Swal.close();
            handleDelete(contact);
          });
        },
      });
    }
  };

  const handleEdit = (contact: CustomerContact) => {
    if (typeof Swal !== 'undefined') {
      const teamMemberOptions = teamMembers.map(member =>
        `<option value="${member.id}" ${contact.fields['Account Manager']?.[0] === member.id ? 'selected' : ''}>${member.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
          </i>
          <span>Edit Customer Contact</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-profile-circle fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Contact Name
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="edit-name"
                value="${contact.fields['Contact Name'] || ''}"
                placeholder="Enter contact name"
              />
            </div>

            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-phone fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Phone
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="edit-phone"
                value="${contact.fields['Phone'] || ''}"
                placeholder="+234 XXX XXX XXXX"
              />
            </div>

            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-abstract-26 fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Discovery Source
              </label>
              <select class="form-select form-select-solid" id="edit-source">
                <option value="WhatsApp" ${contact.fields['Discovery Source'] === 'WhatsApp' ? 'selected' : ''}>💬 WhatsApp</option>
                <option value="Facebook" ${contact.fields['Discovery Source'] === 'Facebook' ? 'selected' : ''}>📘 Facebook</option>
                <option value="Instagram" ${contact.fields['Discovery Source'] === 'Instagram' ? 'selected' : ''}>📷 Instagram</option>
                <option value="TikTok" ${contact.fields['Discovery Source'] === 'TikTok' ? 'selected' : ''}>🎵 TikTok</option>
                <option value="Call" ${contact.fields['Discovery Source'] === 'Call' ? 'selected' : ''}>📞 Call</option>
                <option value="Walk-In" ${contact.fields['Discovery Source'] === 'Walk-In' ? 'selected' : ''}>🚶 Walk-In</option>
                <option value="Lead" ${contact.fields['Discovery Source'] === 'Lead' ? 'selected' : ''}>🎯 Lead</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-user fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Account Manager
              </label>
              <select class="form-select form-select-solid" id="edit-account-manager">
                <option value="">Unassigned</option>
                ${teamMemberOptions}
              </select>
              <div class="form-text">Assign a team member to manage this contact</div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="ki-duotone ki-check fs-2"></i> Save Changes',
        cancelButtonText: '<i class="ki-duotone ki-cross fs-2"></i> Cancel',
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
          const name = (document.getElementById('edit-name') as HTMLInputElement)?.value;
          const phone = (document.getElementById('edit-phone') as HTMLInputElement)?.value;
          const source = (document.getElementById('edit-source') as HTMLSelectElement)?.value;
          const accountManager = (document.getElementById('edit-account-manager') as HTMLSelectElement)?.value;

          if (!name || !phone || !source) {
            Swal.showValidationMessage('Please fill in all required fields');
            return false;
          }

          return { name, phone, source, accountManager };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await customerContactService.update(contact.id, {
              'Contact Name': result.value.name,
              'Phone': result.value.phone,
              'Discovery Source': result.value.source,
              'Account Manager': result.value.accountManager ? [result.value.accountManager] : [],
            });

            Swal.fire({
              title: 'Success!',
              text: 'Contact has been updated',
              icon: 'success',
              confirmButtonText: 'Ok',
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            });

            loadData();
          } catch (err) {
            Swal.fire({
              title: 'Error!',
              text: 'Failed to update contact',
              icon: 'error',
              confirmButtonText: 'Ok',
              customClass: {
                confirmButton: 'btn btn-danger',
              },
            });
          }
        }
      });
    }
  };

  const handleAddAccount = (contact: CustomerContact) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: `Add Account for ${contact.fields['Contact Name']}`,
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div class="fv-row">
              <label class="form-label required">Account Name</label>
              <input type="text" class="form-control" id="account-name" placeholder="Enter account name" />
            </div>
            <div class="fv-row">
              <label class="form-label">Industry</label>
              <select class="form-select" id="account-industry">
                <option value="">Select industry...</option>
                <option value="Technology">Technology</option>
                <option value="Retail">Retail</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="fv-row">
              <label class="form-label">Company Size</label>
              <select class="form-select" id="account-size">
                <option value="">Select size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Account',
        cancelButtonText: 'Cancel',
        width: 600,
        preConfirm: () => {
          const name = (document.getElementById('account-name') as HTMLInputElement)?.value;
          const industry = (document.getElementById('account-industry') as HTMLSelectElement)?.value;
          const size = (document.getElementById('account-size') as HTMLSelectElement)?.value;

          if (!name) {
            Swal.showValidationMessage('Account name is required');
            return false;
          }

          return { name, industry, size };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await accountService.create({
              'Account Name': result.value.name,
              'Industry': result.value.industry || undefined,
              'Size': result.value.size || undefined,
            });
            Swal.fire('Success!', 'Account created successfully', 'success');
            loadData();
          } catch (err) {
            Swal.fire('Error', 'Failed to create account', 'error');
          }
        }
      });
    }
  };

  const handleAddInteraction = (contact: CustomerContact) => {
    if (typeof Swal !== 'undefined') {
      const teamMemberOptions = teamMembers.map(member =>
        `<option value="${member.id}">${member.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: `Add Interaction for ${contact.fields['Contact Name']}`,
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div class="fv-row">
              <label class="form-label required">Interaction Name</label>
              <input type="text" class="form-control" id="interaction-name" placeholder="Enter interaction name" />
            </div>
            <div class="fv-row">
              <label class="form-label">Type</label>
              <select class="form-select" id="interaction-type">
                <option value="">Select type...</option>
                <option value="Discovery">Discovery</option>
                <option value="Label discussion">Label discussion</option>
                <option value="Price Discussion">Price Discussion</option>
                <option value="Custom Solution">Custom Solution</option>
                <option value="Weekly Check-in">Weekly Check-in</option>
              </select>
            </div>
            <div class="fv-row">
              <label class="form-label">Date & Time</label>
              <input type="datetime-local" class="form-control" id="interaction-datetime" />
            </div>
            <div class="fv-row">
              <label class="form-label">Team Member</label>
              <select class="form-select" id="interaction-team-member">
                <option value="">Select team member...</option>
                ${teamMemberOptions}
              </select>
            </div>
            <div class="fv-row">
              <label class="form-label">Notes</label>
              <textarea class="form-control" id="interaction-notes" rows="3" placeholder="Enter notes"></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Interaction',
        cancelButtonText: 'Cancel',
        width: 600,
        preConfirm: () => {
          const name = (document.getElementById('interaction-name') as HTMLInputElement)?.value;
          const type = (document.getElementById('interaction-type') as HTMLSelectElement)?.value;
          const datetime = (document.getElementById('interaction-datetime') as HTMLInputElement)?.value;
          const teamMember = (document.getElementById('interaction-team-member') as HTMLSelectElement)?.value;
          const notes = (document.getElementById('interaction-notes') as HTMLTextAreaElement)?.value;

          if (!name) {
            Swal.showValidationMessage('Interaction name is required');
            return false;
          }

          return { name, type, datetime, teamMember, notes };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await interactionService.create({
              'Name': result.value.name,
              'Type': result.value.type || undefined,
              'Date & Time': result.value.datetime || undefined,
              'Team Member': result.value.teamMember ? [result.value.teamMember] : undefined,
              'Notes': result.value.notes || undefined,
            });
            Swal.fire('Success!', 'Interaction created successfully', 'success');
            loadData();
          } catch (err) {
            Swal.fire('Error', 'Failed to create interaction', 'error');
          }
        }
      });
    }
  };

  const handleAddTask = (contact: CustomerContact) => {
    if (typeof Swal !== 'undefined') {
      const teamMemberOptions = teamMembers.map(member =>
        `<option value="${member.id}">${member.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: `Add Task for ${contact.fields['Contact Name']}`,
        html: `
          <div class="d-flex flex-column gap-3 text-start">
            <div class="fv-row">
              <label class="form-label required">Task Title</label>
              <input type="text" class="form-control" id="task-title" placeholder="Enter task title" />
            </div>
            <div class="fv-row">
              <label class="form-label">Description</label>
              <textarea class="form-control" id="task-description" rows="3" placeholder="Enter task description"></textarea>
            </div>
            <div class="fv-row">
              <label class="form-label">Priority</label>
              <select class="form-select" id="task-priority">
                <option value="">Select priority...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div class="fv-row">
              <label class="form-label">Status</label>
              <select class="form-select" id="task-status">
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div class="fv-row">
              <label class="form-label">Due Date</label>
              <input type="date" class="form-control" id="task-duedate" />
            </div>
            <div class="fv-row">
              <label class="form-label">Assigned To</label>
              <select class="form-select" id="task-assigned-to">
                <option value="">Select team member...</option>
                ${teamMemberOptions}
              </select>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Task',
        cancelButtonText: 'Cancel',
        width: 600,
        preConfirm: () => {
          const title = (document.getElementById('task-title') as HTMLInputElement)?.value;
          const description = (document.getElementById('task-description') as HTMLTextAreaElement)?.value;
          const priority = (document.getElementById('task-priority') as HTMLSelectElement)?.value;
          const status = (document.getElementById('task-status') as HTMLSelectElement)?.value;
          const dueDate = (document.getElementById('task-duedate') as HTMLInputElement)?.value;
          const assignedTo = (document.getElementById('task-assigned-to') as HTMLSelectElement)?.value;

          if (!title) {
            Swal.showValidationMessage('Task title is required');
            return false;
          }

          return { title, description, priority, status, dueDate, assignedTo };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await taskService.create({
              'Task Title': result.value.title,
              'Task Description': result.value.description || undefined,
              'Priority': result.value.priority || undefined,
              'Status': result.value.status || 'To do',
              'Task Deadline': result.value.dueDate || undefined,
              'Task Owner': result.value.assignedTo ? [result.value.assignedTo] : undefined,
              'Customer Contact': [contact.id],
            });
            Swal.fire('Success!', 'Task created successfully', 'success');
            loadData();
          } catch (err) {
            Swal.fire('Error', 'Failed to create task', 'error');
          }
        }
      });
    }
  };

  const handleDelete = (contact: CustomerContact) => {
    if (typeof Swal === 'undefined') {
      if (confirm(`Are you sure you want to delete ${contact.fields['Contact Name']}?`)) {
        deleteContact(contact.id);
      }
      return;
    }

    Swal.fire({
      title: 'Delete Contact?',
      text: `Are you sure you want to delete ${contact.fields['Contact Name']}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-light',
      },
    }).then((result: any) => {
      if (result.isConfirmed) {
        deleteContact(contact.id);
      }
    });
  };

  const deleteContact = async (id: string) => {
    try {
      await customerContactService.delete(id);

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Deleted!',
          text: 'Contact has been deleted successfully',
          icon: 'success',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'btn btn-primary',
          },
        });
      }

      loadData();
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete contact',
          icon: 'error',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'btn btn-danger',
          },
        });
      }
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

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button className="btn btn-sm btn-primary ms-3" onClick={loadData}>
          <i className="ki-duotone ki-arrows-loop fs-4">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Card Header */}
      <div className="card-header border-0 pt-6">
        <div className="card-title">
          <h2 className="fw-bold">Customer Contacts</h2>
        </div>
        <div className="card-toolbar">
          <div className="d-flex justify-content-end gap-2" data-kt-customer-table-toolbar="base">
            <button className="btn btn-primary" onClick={handleCreate}>
              <i className="ki-duotone ki-plus fs-2">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Add Customer
            </button>
            <button className="btn btn-light" onClick={loadData}>
              <i className="ki-duotone ki-arrows-loop fs-4">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body py-4">
        {/* Search Bar */}
        <div className="d-flex align-items-center position-relative mb-5">
          <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
          <input
            type="text"
            data-kt-customer-table-filter="search"
            className="form-control form-control-solid w-250px ps-13"
            placeholder="Search contacts..."
          />
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
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="text-gray-600 fs-4 mb-3">No customer contacts found</div>
                    <button className="btn btn-primary" onClick={handleCreate}>
                      <i className="ki-duotone ki-plus fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                      Add Your First Customer
                    </button>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(contact)}
                    className="table-row-hover"
                  >
                    <td>
                      <span className="text-gray-800 text-hover-primary mb-1">
                        {contact.fields['Customer ID'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-800 text-hover-primary mb-1 fw-bold">
                        {contact.fields['Contact Name'] || 'N/A'}
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
      </div>
    </div>
  );
}
