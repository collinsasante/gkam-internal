import { useState, useEffect } from 'react';
import { activityService, teamMemberService, customerContactService } from '../../services/airtable.service';
import type { Activity, TeamMember, CustomerContact } from '../../types/airtable.types';
import Modal from '../Common/Modal';

export default function ActivitiesList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);

  // Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Form States
  const [formState, setFormState] = useState({
    activityType: '',
    customerName: '',
    leadComment: '',
    activityStatus: 'Open',
    owner: '',
    createdOn: '',
    modifiedBy: '',
    modifiedOn: '',
    imageFile: null as File | null
  });

  // Status/Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

  useEffect(() => {
    loadActivities();
    loadTeamMembers();
    loadCustomerContacts();
  }, []);

  const loadCustomerContacts = async () => {
    try {
      const data = await customerContactService.getAll();
      setCustomerContacts(data);
    } catch (err) {
      console.error('Failed to load customer contacts:', err);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await teamMemberService.getAll();
      setTeamMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activityService.getAll();

      // Debug: Log the first activity to see actual field names
      if (data.length > 0) {
        console.log('First activity fields:', Object.keys(data[0].fields));
        console.log('First activity data:', data[0].fields);
      }

      setActivities(data);
      setError(null);
    } catch (err) {
      setError('Failed to load activities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormState({
      activityType: '',
      customerName: '',
      leadComment: '',
      activityStatus: 'Open',
      owner: '',
      createdOn: new Date().toISOString().slice(0, 16),
      modifiedBy: '',
      modifiedOn: '',
      imageFile: null
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!formState.activityType) {
      showFeedback('error', 'Activity type is required');
      return;
    }

    try {
      const activityNumber = `ACT-${Date.now()}`;
      const activityData: any = {
        'Activity Number': activityNumber,
        'Activity Type': formState.activityType,
        'Status': formState.activityStatus,
      };

      if (formState.customerName) activityData['Customer Name'] = [formState.customerName];
      if (formState.leadComment) activityData['Activity'] = formState.leadComment;
      if (formState.owner) activityData['Owner'] = [formState.owner];
      if (formState.createdOn) activityData['Created on'] = new Date(formState.createdOn).toISOString();

      await activityService.create(activityData);
      showFeedback('success', 'Activity has been created successfully.');
      setIsCreateModalOpen(false);
      loadActivities();
    } catch (error) {
      showFeedback('error', 'Failed to create activity');
      console.error(error);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedActivity) return;
    setFormState({
      activityType: selectedActivity.fields['Activity Type'] || '',
      customerName: Array.isArray(selectedActivity.fields['Customer Name']) ? selectedActivity.fields['Customer Name'][0] : '',
      leadComment: selectedActivity.fields['Activity'] || '',
      activityStatus: selectedActivity.fields['Status'] || 'Open',
      owner: Array.isArray(selectedActivity.fields['Owner']) ? selectedActivity.fields['Owner'][0] : '',
      createdOn: selectedActivity.fields['Created on'] ? new Date(selectedActivity.fields['Created on']).toISOString().slice(0, 16) : '',
      modifiedBy: '',
      modifiedOn: new Date().toISOString().slice(0, 16),
      imageFile: null
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedActivity || !formState.activityType) {
      showFeedback('error', 'Activity type is required');
      return;
    }

    try {
      const updateData: any = {
        'Activity Type': formState.activityType,
        'Status': formState.activityStatus,
        'Activity': formState.leadComment,
      };

      if (formState.modifiedBy) updateData['Modified By'] = [formState.modifiedBy];
      if (formState.modifiedOn) updateData['Modified On'] = new Date(formState.modifiedOn).toISOString();

      await activityService.update(selectedActivity.id, updateData);
      showFeedback('success', 'Activity has been updated successfully.');
      setIsEditModalOpen(false);
      loadActivities();
    } catch (error) {
      showFeedback('error', 'Failed to update activity');
      console.error(error);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedActivity) return;
    try {
      await activityService.delete(selectedActivity.id);
      showFeedback('success', 'Activity has been deleted.');
      setIsDeleteModalOpen(false);
      loadActivities();
    } catch (error) {
      showFeedback('error', 'Failed to delete activity');
      console.error(error);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = searchTerm === '' ||
      activity.fields['Activity']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.fields['Activity Number']?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === '' || activity.fields['Activity Type'] === filterType;
    const matchesStatus = filterStatus === '' || activity.fields['Status'] === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getActivityTypeIcon = (type?: string) => {
    const iconMap: Record<string, string> = {
      'Meeting': 'bi-calendar-event',
      'Phone Call': 'bi-telephone',
      'Call Summary': 'bi-file-earmark-text',
      'WhatsApp Chat': 'bi-whatsapp',
    };
    return iconMap[type || ''] || 'bi-circle';
  };

  const getOwnerName = (ownerId?: string[]) => {
    if (!ownerId || ownerId.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerId[0]);
    return owner?.fields['Name'] || 'Unknown';
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadActivities}>
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
              <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                <span className="path1"></span>
                <span className="path2"></span>
              </i>
              <input
                type="text"
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <select
                className="form-select form-select-solid w-150px"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Meeting">Meeting</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Call Summary">Call Summary</option>
                <option value="WhatsApp Chat">WhatsApp Chat</option>
              </select>

              <select
                className="form-select form-select-solid w-150px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Done">Done</option>
              </select>

              <button className="btn btn-sm btn-light" onClick={loadActivities}>
                <i className="ki-duotone ki-arrows-circle fs-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Refresh
              </button>

              <button className="btn btn-sm btn-primary" onClick={handleOpenCreateModal}>
                <i className="ki-duotone ki-plus fs-2"></i>
                New Activity
              </button>
            </div>
          </div>
        </div>

        <div className="card-body py-4">
          <div className="table-responsive">
            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
              <thead>
                <tr className="fw-bold text-muted">
                  <th className="min-w-100px">Activity #</th>
                  <th className="min-w-200px">Activity</th>
                  <th className="min-w-120px">Type</th>
                  <th className="min-w-120px">Status</th>
                  <th className="min-w-150px">Created On</th>
                  <th className="min-w-120px">Owner</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="text-gray-600">No activities found</div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <tr
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      style={{ cursor: 'pointer' }}
                      className="hover-elevate-up"
                    >
                      <td>
                        <span className="text-gray-900 fw-bold text-hover-primary fs-6">
                          {activity.fields['Activity Number'] || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-gray-900 fw-bold text-hover-primary d-block fs-6">
                            {activity.fields['Activity'] || 'N/A'}
                          </span>
                          {activity.fields['Activity Summary (Activity)'] && typeof activity.fields['Activity Summary (Activity)'] === 'string' && (
                            <span className="text-muted fw-semibold text-muted d-block fs-7 mt-1">
                              {activity.fields['Activity Summary (Activity)'].substring(0, 100)}
                              {activity.fields['Activity Summary (Activity)'].length > 100 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {activity.fields['Activity Type'] && (
                          <span className="badge badge-light-info">
                            <i className={`bi ${getActivityTypeIcon(activity.fields['Activity Type'])} me-1`}></i>
                            {activity.fields['Activity Type']}
                          </span>
                        )}
                      </td>
                      <td>
                        {activity.fields['Status'] === 'Done' ? (
                          <span className="badge badge-light-success">Done</span>
                        ) : (
                          <span className="badge badge-light-warning">Open</span>
                        )}
                      </td>
                      <td>
                        <span className="text-gray-600">
                          {activity.fields['Created on']
                            ? new Date(activity.fields['Created on']).toLocaleString()
                            : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-900 fw-bold">
                          {getOwnerName(activity.fields['Owner'])}
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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedActivity?.fields['Activity'] || 'Activity Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-danger" onClick={handleOpenDeleteModal}>Delete</button>
            <button className="btn btn-primary" onClick={handleOpenEditModal}>Edit</button>
            <button className="btn btn-light" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
          </div>
        }
      >
        {selectedActivity && (
          <div className="p-2 text-start">
            <div className="row g-5">
              <div className="col-md-6">
                <label className="text-muted fw-bold small d-block">Activity #</label>
                <div className="fw-bold">{selectedActivity.fields['Activity Number'] || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small d-block">Type</label>
                <span className="badge badge-light-info">{selectedActivity.fields['Activity Type'] || 'N/A'}</span>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small d-block">Status</label>
                <span className={`badge badge-light-${selectedActivity.fields['Status'] === 'Done' ? 'success' : 'warning'}`}>
                  {selectedActivity.fields['Status'] || 'Open'}
                </span>
              </div>
              <div className="col-md-6">
                <label className="text-muted fw-bold small d-block">Owner</label>
                <div>{getOwnerName(selectedActivity.fields['Owner'])}</div>
              </div>
              <div className="col-12">
                <label className="text-muted fw-bold small d-block">Activity / Comment</label>
                <div className="bg-light p-3 rounded mt-1">{selectedActivity.fields['Activity'] || 'No comment provided'}</div>
              </div>
              {selectedActivity.fields['Activity Summary (Activity)'] && (
                <div className="col-12">
                  <label className="text-muted fw-bold small d-block">Summary</label>
                  <p className="mt-1">
                    {typeof selectedActivity.fields['Activity Summary (Activity)'] === 'string'
                      ? selectedActivity.fields['Activity Summary (Activity)']
                      : (selectedActivity.fields['Activity Summary (Activity)'] as any).value || 'N/A'}
                  </p>
                </div>
              )}
              <div className="col-md-6">
                <label className="text-muted fw-bold small d-block">Created On</label>
                <div>{selectedActivity.fields['Created on'] ? new Date(selectedActivity.fields['Created on']).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Activity"
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Create Activity</button>
          </div>
        }
      >
        <div className="p-2 text-start">
          <div className="mb-4">
            <label className="form-label">Customer Name</label>
            <select
              className="form-select"
              value={formState.customerName}
              onChange={(e) => setFormState({ ...formState, customerName: e.target.value })}
            >
              <option value="">Select customer...</option>
              {customerContacts.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.fields['Contact Name'] || customer.fields['Customer ID'] || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label required">Activity Type</label>
            <select
              className="form-select"
              value={formState.activityType}
              onChange={(e) => setFormState({ ...formState, activityType: e.target.value })}
            >
              <option value="">Select type...</option>
              <option value="Meeting">Meeting</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Call Summary">Call Summary</option>
              <option value="WhatsApp Chat">WhatsApp Chat</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label">Activity Comment</label>
            <textarea
              className="form-control"
              rows={3}
              value={formState.leadComment}
              onChange={(e) => setFormState({ ...formState, leadComment: e.target.value })}
            ></textarea>
          </div>
          <div className="row g-4">
            <div className="col-md-6 text-start">
              <label className="form-label">Owner</label>
              <select
                className="form-select"
                value={formState.owner}
                onChange={(e) => setFormState({ ...formState, owner: e.target.value })}
              >
                <option value="">Select owner...</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.fields['Name']}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 text-start">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formState.activityStatus}
                onChange={(e) => setFormState({ ...formState, activityStatus: e.target.value })}
              >
                <option value="Open">Open</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Activity"
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="p-2 text-start">
          <div className="mb-4">
            <label className="form-label required">Activity Type</label>
            <select
              className="form-select"
              value={formState.activityType}
              onChange={(e) => setFormState({ ...formState, activityType: e.target.value })}
            >
              <option value="Meeting">Meeting</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Call Summary">Call Summary</option>
              <option value="WhatsApp Chat">WhatsApp Chat</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label">Activity Comment</label>
            <textarea
              className="form-control"
              rows={3}
              value={formState.leadComment}
              onChange={(e) => setFormState({ ...formState, leadComment: e.target.value })}
            ></textarea>
          </div>
          <div className="mb-4 text-start">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formState.activityStatus}
              onChange={(e) => setFormState({ ...formState, activityStatus: e.target.value })}
            >
              <option value="Open">Open</option>
              <option value="Done">Done</option>
            </select>
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
          <p>Are you sure you want to delete this activity? This action cannot be undone.</p>
        </div>
      </Modal>
    </>
  );
}
