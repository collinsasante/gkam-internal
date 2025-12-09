import { useState, useEffect } from 'react';
import { taskService, teamMemberService } from '../../services/airtable.service';
import type { Task, TeamMember } from '../../types/airtable.types';

declare const Swal: any;

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    loadTasks();
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

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = searchTerm === '' ||
        task.fields['Task Title']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.fields['Task Description']?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === '' || task.fields['Status'] === filterStatus;
      const matchesPriority = filterPriority === '' || task.fields['Priority'] === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      // Sort by Task Added (created date) descending (newest first)
      const dateA = a.fields['Task Added'] ? new Date(a.fields['Task Added']).getTime() : 0;
      const dateB = b.fields['Task Added'] ? new Date(b.fields['Task Added']).getTime() : 0;
      return dateB - dateA;
    });

  const getPriorityBadgeClass = (priority?: string) => {
    const priorityMap: Record<string, string> = {
      'High': 'badge-light-danger',
      'Medium': 'badge-light-warning',
      'Low': 'badge-light-info',
    };
    return priorityMap[priority || ''] || 'badge-light-secondary';
  };

  const getStatusBadgeClass = (status?: string) => {
    const statusMap: Record<string, string> = {
      'To do': 'badge-light-primary',
      'In progress': 'badge-light-warning',
      'Done': 'badge-light-success',
    };
    return statusMap[status || ''] || 'badge-light-secondary';
  };

  const getOwnerName = (ownerId?: string[]) => {
    if (!ownerId || ownerId.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerId[0]);
    return owner?.fields['Name'] || ownerId[0];
  };

  const handleRowClick = (task: Task) => {
    if (typeof Swal !== 'undefined') {
      const ownerName = getOwnerName(task.fields['Task Owner']);

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-calendar-tick fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
            <span class="path4"></span>
            <span class="path5"></span>
            <span class="path6"></span>
          </i>
          <span>${task.fields['Task Title']}</span>
        </div>`,
        html: `
          <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
            <!-- Task Information -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-primary">
                <h6 class="card-title mb-0 text-primary">
                  <i class="ki-duotone ki-notepad fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                    <span class="path4"></span>
                    <span class="path5"></span>
                  </i>
                  Task Information
                </h6>
              </div>
              <div class="card-body">
                <div class="mb-4">
                  <label class="text-muted fs-7 fw-semibold">Description</label>
                  <div class="text-gray-800">${task.fields['Task Description'] || 'N/A'}</div>
                </div>
              </div>
            </div>

            <!-- Status & Priority -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-info">
                <h6 class="card-title mb-0 text-info">
                  <i class="ki-duotone ki-flag fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Status & Priority
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Status</label>
                    <div>
                      <span class="badge ${getStatusBadgeClass(task.fields['Status'])} fs-6">
                        ${task.fields['Status'] || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Priority</label>
                    <div>
                      ${task.fields['Priority'] ? `<span class="badge ${getPriorityBadgeClass(task.fields['Priority'])} fs-6">${task.fields['Priority']}</span>` : '<span class="text-gray-600">N/A</span>'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline & Assignment -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-light-success">
                <h6 class="card-title mb-0 text-success">
                  <i class="ki-duotone ki-time fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                  </i>
                  Timeline & Assignment
                </h6>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Owner</label>
                    <div class="text-gray-800 fw-bold">${ownerName}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Start Date</label>
                    <div class="text-gray-800 fw-bold">${task.fields['Task Start'] ? new Date(task.fields['Task Start']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Deadline</label>
                    <div class="text-gray-800 fw-bold">${task.fields['Task Deadline'] ? new Date(task.fields['Task Deadline']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div class="col-6">
                    <label class="text-muted fs-7 fw-semibold">Created</label>
                    <div class="text-gray-800">${task.fields['Task Added'] ? new Date(task.fields['Task Added']).toLocaleString() : 'N/A'}</div>
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
      }).then((result) => {
        if (result.isConfirmed) {
          handleEdit(task);
        } else if (result.isDenied) {
          handleDelete(task);
        }
      });
    }
  };

  const handleEdit = (task: Task) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
          </i>
          <span>Edit Task</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-notepad fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                </i>
                Task Title
              </label>
              <input type="text" class="form-control form-control-solid" id="edit-tasktitle" value="${task.fields['Task Title'] || ''}" placeholder="Enter task title" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-message-text fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Task Description
              </label>
              <textarea class="form-control form-control-solid" id="edit-taskdescription" rows="3" placeholder="Enter task description">${task.fields['Task Description'] || ''}</textarea>
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
                <option value="To do" ${task.fields['Status'] === 'To do' ? 'selected' : ''}>To do</option>
                <option value="In progress" ${task.fields['Status'] === 'In progress' ? 'selected' : ''}>In progress</option>
                <option value="Done" ${task.fields['Status'] === 'Done' ? 'selected' : ''}>Done</option>
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
              <select class="form-select form-select-solid" id="edit-priority">
                <option value="">Select priority...</option>
                <option value="High" ${task.fields['Priority'] === 'High' ? 'selected' : ''}>High</option>
                <option value="Medium" ${task.fields['Priority'] === 'Medium' ? 'selected' : ''}>Medium</option>
                <option value="Low" ${task.fields['Priority'] === 'Low' ? 'selected' : ''}>Low</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Start Date
              </label>
              <input type="date" class="form-control form-control-solid" id="edit-startdate" value="${task.fields['Task Start'] || ''}" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-time fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Deadline
              </label>
              <input type="date" class="form-control form-control-solid" id="edit-deadline" value="${task.fields['Task Deadline'] || ''}" />
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
          const taskTitle = (document.getElementById('edit-tasktitle') as HTMLInputElement)?.value;
          const taskDescription = (document.getElementById('edit-taskdescription') as HTMLTextAreaElement)?.value;
          const status = (document.getElementById('edit-status') as HTMLSelectElement)?.value;
          const priority = (document.getElementById('edit-priority') as HTMLSelectElement)?.value;
          const startDate = (document.getElementById('edit-startdate') as HTMLInputElement)?.value;
          const deadline = (document.getElementById('edit-deadline') as HTMLInputElement)?.value;

          if (!taskTitle) {
            Swal.showValidationMessage('Task Title is required');
            return false;
          }

          return { taskTitle, taskDescription, status, priority, startDate, deadline };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await taskService.update(task.id, {
              'Task Title': result.value.taskTitle,
              'Task Description': result.value.taskDescription || undefined,
              'Status': result.value.status as 'To do' | 'In progress' | 'Done',
              'Priority': result.value.priority || undefined,
              'Task Start': result.value.startDate || undefined,
              'Task Deadline': result.value.deadline || undefined,
            });
            Swal.fire('Updated!', 'Task has been updated.', 'success');
            loadTasks();
          } catch (err) {
            Swal.fire('Error', 'Failed to update task', 'error');
          }
        }
      });
    }
  };

  const handleDelete = (task: Task) => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Delete Task?',
        text: `Are you sure you want to delete "${task.fields['Task Title']}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545',
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await taskService.delete(task.id);
            Swal.fire('Deleted!', 'Task has been deleted.', 'success');
            loadTasks();
          } catch (err) {
            Swal.fire('Error', 'Failed to delete task', 'error');
          }
        }
      });
    }
  };

  const handleCreateTask = () => {
    if (typeof Swal !== 'undefined') {
      // Generate options for task owners (team members)
      const teamMemberOptions = teamMembers.map(tm =>
        `<option value="${tm.id}">${tm.fields['Name']}</option>`
      ).join('');

      Swal.fire({
        title: `<div class="d-flex align-items-center">
          <i class="ki-duotone ki-add-item fs-2x text-primary me-3">
            <span class="path1"></span>
            <span class="path2"></span>
            <span class="path3"></span>
          </i>
          <span>Create New Task</span>
        </div>`,
        html: `
          <div class="text-start p-4">
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-notepad fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                  <span class="path5"></span>
                </i>
                Task Title
              </label>
              <input type="text" class="form-control form-control-solid" id="create-tasktitle" placeholder="Enter task title" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-message-text fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Task Description
              </label>
              <textarea class="form-control form-control-solid" id="create-taskdescription" rows="3" placeholder="Enter task description"></textarea>
            </div>
            <div class="mb-5">
              <label class="form-label required fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-check-circle fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Status
              </label>
              <select class="form-select form-select-solid" id="create-status">
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
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
              <select class="form-select form-select-solid" id="create-priority">
                <option value="">Select priority...</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-user fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Task Owner
              </label>
              <select class="form-select form-select-solid" id="create-taskowner">
                <option value="">Select task owner...</option>
                ${teamMemberOptions}
              </select>
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-calendar fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Start Date
              </label>
              <input type="date" class="form-control form-control-solid" id="create-startdate" />
            </div>
            <div class="mb-5">
              <label class="form-label fw-bold fs-6 mb-2">
                <i class="ki-duotone ki-time fs-4 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Deadline
              </label>
              <input type="date" class="form-control form-control-solid" id="create-deadline" />
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Create Task',
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
          const taskTitle = (document.getElementById('create-tasktitle') as HTMLInputElement)?.value;
          const taskDescription = (document.getElementById('create-taskdescription') as HTMLTextAreaElement)?.value;
          const status = (document.getElementById('create-status') as HTMLSelectElement)?.value;
          const priority = (document.getElementById('create-priority') as HTMLSelectElement)?.value;
          const taskOwner = (document.getElementById('create-taskowner') as HTMLSelectElement)?.value;
          const startDate = (document.getElementById('create-startdate') as HTMLInputElement)?.value;
          const deadline = (document.getElementById('create-deadline') as HTMLInputElement)?.value;

          if (!taskTitle) {
            Swal.showValidationMessage('Task Title is required');
            return false;
          }

          if (!status) {
            Swal.showValidationMessage('Status is required');
            return false;
          }

          return { taskTitle, taskDescription, status, priority, taskOwner, startDate, deadline };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await taskService.create({
              'Task Title': result.value.taskTitle,
              'Task Description': result.value.taskDescription || undefined,
              'Status': result.value.status as 'To do' | 'In progress' | 'Done',
              'Priority': result.value.priority || undefined,
              'Task Owner': result.value.taskOwner ? [result.value.taskOwner] : undefined,
              'Task Start': result.value.startDate || undefined,
              'Task Deadline': result.value.deadline || undefined,
            });
            Swal.fire('Created!', 'Task has been created successfully.', 'success');
            loadTasks();
          } catch (err) {
            Swal.fire('Error', 'Failed to create task', 'error');
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadTasks}>
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
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="card-toolbar">
          <div className="d-flex justify-content-end align-items-center gap-3">
            <select
              className="form-select form-select-solid w-150px"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="To do">To do</option>
              <option value="In progress">In progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              className="form-select form-select-solid w-150px"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button className="btn btn-success" onClick={handleCreateTask}>
              <i className="bi bi-plus-circle"></i>
              Create Task
            </button>

            <button className="btn btn-primary" onClick={loadTasks}>
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
                <th className="min-w-250px">Task</th>
                <th className="min-w-100px">Status</th>
                <th className="min-w-100px">Priority</th>
                <th className="min-w-120px">Owner</th>
                <th className="min-w-120px">Start Date</th>
                <th className="min-w-120px">Deadline</th>
                <th className="min-w-150px">Created</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 fw-semibold">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="text-gray-600">No tasks found</div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(task)}
                    className="table-row-hover"
                  >
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-gray-900 fw-bold text-hover-primary d-block fs-6">
                          {task.fields['Task Title'] || 'N/A'}
                        </span>
                        {task.fields['Task Description'] && typeof task.fields['Task Description'] === 'string' && (
                          <span className="text-muted fw-semibold text-muted d-block fs-7 mt-1">
                            {task.fields['Task Description'].substring(0, 100)}
                            {task.fields['Task Description'].length > 100 ? '...' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(task.fields['Status'])}`}>
                        {task.fields['Status'] || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {task.fields['Priority'] && (
                        <span className={`badge ${getPriorityBadgeClass(task.fields['Priority'])}`}>
                          {task.fields['Priority']}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="text-gray-900 fw-bold">
                        {getOwnerName(task.fields['Task Owner'])}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600">
                        {task.fields['Task Start']
                          ? new Date(task.fields['Task Start']).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600">
                        {task.fields['Task Deadline']
                          ? new Date(task.fields['Task Deadline']).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-600">
                        {task.fields['Task Added']
                          ? new Date(task.fields['Task Added']).toLocaleString()
                          : 'N/A'}
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
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </div>
    </div>
  );
}
