import { useState, useEffect } from 'react';
import { taskService, teamMemberService } from '../../services/airtable.service';
import type { Task, TeamMember } from '../../types/airtable.types';

import Modal from '../Common/Modal';

export default function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To do',
    priority: '',
    startDate: '',
    deadline: '',
    ownerId: ''
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

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
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.fields['Task Title'] || '',
      description: task.fields['Task Description'] || '',
      status: task.fields['Status'] || 'To do',
      priority: task.fields['Priority'] || '',
      startDate: task.fields['Task Start'] || '',
      deadline: task.fields['Task Deadline'] || '',
      ownerId: task.fields['Task Owner']?.[0] || ''
    });
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedTask) return;
    if (!formData.title) {
      showFeedback('error', 'Task Title is required');
      return;
    }

    try {
      await taskService.update(selectedTask.id, {
        'Task Title': formData.title,
        'Task Description': formData.description || undefined,
        'Status': formData.status as any,
        'Priority': formData.priority as any || undefined,
        'Task Start': formData.startDate || undefined,
        'Task Deadline': formData.deadline || undefined,
      });
      showFeedback('success', 'Task has been updated.');
      setIsEditModalOpen(false);
      loadTasks();
    } catch (err) {
      showFeedback('error', 'Failed to update task');
    }
  };

  const handleDelete = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTask) return;
    try {
      await taskService.delete(selectedTask.id);
      showFeedback('success', 'Task has been deleted.');
      setIsDeleteModalOpen(false);
      loadTasks();
    } catch (err) {
      showFeedback('error', 'Failed to delete task');
    }
  };

  const handleCreateTask = () => {
    setFormData({
      title: '',
      description: '',
      status: 'To do',
      priority: '',
      startDate: '',
      deadline: '',
      ownerId: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formData.title) {
      showFeedback('error', 'Task Title is required');
      return;
    }

    try {
      await taskService.create({
        'Task Title': formData.title,
        'Task Description': formData.description || undefined,
        'Status': formData.status as any,
        'Priority': formData.priority as any || undefined,
        'Task Owner': formData.ownerId ? [formData.ownerId] : undefined,
        'Task Start': formData.startDate || undefined,
        'Task Deadline': formData.deadline || undefined,
      });
      showFeedback('success', 'Task has been created successfully.');
      setIsCreateModalOpen(false);
      loadTasks();
    } catch (err) {
      showFeedback('error', 'Failed to create task');
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

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedTask?.fields['Task Title'] || 'Task Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-danger me-auto" onClick={() => selectedTask && handleDelete(selectedTask)}>Delete</button>
            <button className="btn btn-primary" onClick={() => selectedTask && handleEdit(selectedTask)}>Edit</button>
            <button className="btn btn-light" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
          </div>
        }
      >
        {selectedTask && (
          <div className="text-start">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-primary">
                <h6 className="card-title mb-0 text-primary">Task Information</h6>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <label className="text-muted fs-7 fw-semibold d-block">Description</label>
                  <div className="text-gray-800">{selectedTask.fields['Task Description'] || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-info">
                <h6 className="card-title mb-0 text-info">Status & Priority</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Status</label>
                    <span className={`badge ${getStatusBadgeClass(selectedTask.fields['Status'])} fs-6`}>
                      {selectedTask.fields['Status'] || 'N/A'}
                    </span>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Priority</label>
                    {selectedTask.fields['Priority'] ? (
                      <span className={`badge ${getPriorityBadgeClass(selectedTask.fields['Priority'])} fs-6`}>
                        {selectedTask.fields['Priority']}
                      </span>
                    ) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-success">
                <h6 className="card-title mb-0 text-success">Timeline & Assignment</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Owner</label>
                    <div className="text-gray-800 fw-bold">{getOwnerName(selectedTask.fields['Task Owner'])}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Start Date</label>
                    <div className="text-gray-800 fw-bold">{selectedTask.fields['Task Start'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Deadline</label>
                    <div className="text-gray-800 fw-bold">{selectedTask.fields['Task Deadline'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Created</label>
                    <div className="text-gray-800">{selectedTask.fields['Task Added'] ? new Date(selectedTask.fields['Task Added']).toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Create Task</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Task Title</label>
            <input className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label required">Status</label>
              <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="">Select priority...</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Task Owner</label>
            <select className="form-select" value={formData.ownerId} onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}>
              <option value="">Select task owner...</option>
              {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.fields['Name']}</option>)}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-control" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="form-label required">Task Title</label>
            <input className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label required">Status</label>
              <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="">Select priority...</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-control" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>
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
          <p>Are you sure you want to delete <strong>{selectedTask?.fields['Task Title']}</strong>? This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}
