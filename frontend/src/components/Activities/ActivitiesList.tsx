import { useState, useEffect } from 'react';
import { activityService, teamMemberService, customerContactService } from '../../services/airtable.service';
import type { Activity, TeamMember } from '../../types/airtable.types';

declare const Swal: any;

export default function ActivitiesList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadActivities();
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

  const handleCreateActivity = async () => {
    if (typeof Swal === 'undefined') return;

    try {
      const [members, customerContacts] = await Promise.all([
        teamMemberService.getAll(),
        customerContactService.getAll(),
      ]);

      const currentDate = new Date();

      const { value: formValues } = await Swal.fire({
        title: 'Create New Activity',
        html: `
          <div class="text-start">
            <div class="mb-4">
              <label class="form-label">Image</label>
              <input id="imageFile" type="file" class="form-control" accept="image/*">
              <small class="text-muted">Upload an image (optional)</small>
            </div>
            <div class="mb-4">
              <label class="form-label">Customer Name</label>
              <select id="customerName" class="form-select">
                <option value="">Select customer...</option>
                ${customerContacts.map((customer: any) =>
                  `<option value="${customer.id}">${customer.fields['Contact Name'] || customer.fields['Customer ID'] || 'Unknown'}</option>`
                ).join('')}
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label required">Activity Type</label>
              <select id="activityType" class="form-select">
                <option value="">Select type...</option>
                <option value="Meeting">Meeting</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Call Summary">Call Summary</option>
                <option value="WhatsApp Chat">WhatsApp Chat</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label">Add Lead Activity Comment</label>
              <textarea id="leadComment" class="form-control" rows="3" placeholder="Enter comment..."></textarea>
            </div>
            <div class="mb-4">
              <label class="form-label">Owner</label>
              <select id="owner" class="form-select">
                <option value="">Select owner...</option>
                ${members.map((member: TeamMember) =>
                  `<option value="${member.id}">${member.fields['Name']}</option>`
                ).join('')}
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label">Created on</label>
              <input id="createdOn" type="datetime-local" class="form-control" value="${currentDate.toISOString().slice(0, 16)}" readonly>
            </div>
            <div class="mb-4">
              <label class="form-label">Status</label>
              <select id="activityStatus" class="form-select">
                <option value="Open" selected>Open</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
        `,
        width: 700,
        showCancelButton: true,
        confirmButtonText: 'Create Activity',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
          const activityType = (document.getElementById('activityType') as HTMLSelectElement).value;
          const customerName = (document.getElementById('customerName') as HTMLSelectElement).value;
          const leadComment = (document.getElementById('leadComment') as HTMLTextAreaElement).value;
          const activityStatus = (document.getElementById('activityStatus') as HTMLSelectElement).value;
          const owner = (document.getElementById('owner') as HTMLSelectElement).value;
          const createdOn = (document.getElementById('createdOn') as HTMLInputElement).value;
          const imageFile = (document.getElementById('imageFile') as HTMLInputElement).files?.[0];

          if (!activityType) {
            Swal.showValidationMessage('Activity type is required');
            return false;
          }

          return { activityType, customerName, leadComment, activityStatus, owner, createdOn, imageFile };
        },
      });

      if (formValues) {
        const activityNumber = `ACT-${Date.now()}`;
        const activityData: any = {
          'Activity Number': activityNumber,
          'Activity Type': formValues.activityType,
          'Status': formValues.activityStatus,
        };

        if (formValues.customerName) {
          activityData['Customer Name'] = [formValues.customerName];
        }
        if (formValues.leadComment) {
          activityData['Activity'] = formValues.leadComment;
        }
        if (formValues.owner) {
          activityData['Owner'] = [formValues.owner];
        }
        if (formValues.createdOn) {
          activityData['Created on'] = new Date(formValues.createdOn).toISOString();
        }

        // Note: Image file upload to Airtable requires additional handling
        if (formValues.imageFile) {
          console.warn('Image upload selected but not yet implemented for Airtable API');
          // TODO: Implement Airtable attachment upload
        }

        await activityService.create(activityData);
        await Swal.fire('Created!', 'Activity has been created successfully.', 'success');
        loadActivities();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to create activity', 'error');
      console.error(error);
    }
  };

  const handleActivityClick = async (activity: Activity) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: activity.fields['Activity'] || 'Activity Details',
      html: `
        <div class="text-start">
          <p><strong>Activity #:</strong> ${activity.fields['Activity Number'] || 'N/A'}</p>
          <p><strong>Type:</strong> <span class="badge badge-light-info">${activity.fields['Activity Type'] || 'N/A'}</span></p>
          <p><strong>Status:</strong> <span class="badge badge-light-${activity.fields['Status'] === 'Done' ? 'success' : 'warning'}">${activity.fields['Status'] || 'Open'}</span></p>
          <p><strong>Created On:</strong> ${activity.fields['Created on'] ? new Date(activity.fields['Created on']).toLocaleString() : 'N/A'}</p>
          <p><strong>Owner:</strong> ${getOwnerName(activity.fields['Owner'])}</p>
          ${activity.fields['Activity Summary (Activity)'] ? `<div class="mt-3"><strong>Summary:</strong><p>${activity.fields['Activity Summary (Activity)']}</p></div>` : ''}
          <p><strong>Contact:</strong> ${Array.isArray(activity.fields['Contact 2']) ? activity.fields['Contact 2'].length + ' linked' : 'None'}</p>
          <p><strong>Related Deals:</strong> ${Array.isArray(activity.fields['Related Deals']) ? activity.fields['Related Deals'].length + ' linked' : 'None'}</p>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="ki-duotone ki-pencil fs-2"></i> Edit',
      denyButtonText: '<i class="ki-duotone ki-trash fs-2"></i> Delete',
      cancelButtonText: 'Close',
      denyButtonColor: '#f1416c',
      width: 600,
    });

    if (result.isConfirmed) {
      handleEditActivity(activity);
    } else if (result.isDenied) {
      handleDeleteActivity(activity);
    }
  };

  const handleEditActivity = async (activity: Activity) => {
    if (typeof Swal === 'undefined') return;

    try {
      const members = await teamMemberService.getAll();
      const currentDate = new Date();

      const { value: formValues } = await Swal.fire({
        title: 'Edit Activity',
        html: `
          <div class="text-start">
            <div class="mb-4">
              <label class="form-label">Customer Name (Read-only)</label>
              <input class="form-control" value="${Array.isArray(activity.fields['Customer Name']) ? 'Linked' : 'N/A'}" readonly>
            </div>
            <div class="mb-4">
              <label class="form-label required">Activity Type</label>
              <select id="activityType" class="form-select">
                <option value="Meeting" ${activity.fields['Activity Type'] === 'Meeting' ? 'selected' : ''}>Meeting</option>
                <option value="Phone Call" ${activity.fields['Activity Type'] === 'Phone Call' ? 'selected' : ''}>Phone Call</option>
                <option value="Call Summary" ${activity.fields['Activity Type'] === 'Call Summary' ? 'selected' : ''}>Call Summary</option>
                <option value="WhatsApp Chat" ${activity.fields['Activity Type'] === 'WhatsApp Chat' ? 'selected' : ''}>WhatsApp Chat</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label">Lead Activity Comment</label>
              <textarea id="leadComment" class="form-control" rows="3">${activity.fields['Activity'] || ''}</textarea>
            </div>
            <div class="mb-4">
              <label class="form-label">Owner (Read-only)</label>
              <input class="form-control" value="${getOwnerName(activity.fields['Owner'])}" readonly>
            </div>
            <div class="mb-4">
              <label class="form-label">Created on (Read-only)</label>
              <input class="form-control" value="${activity.fields['Created on'] ? new Date(activity.fields['Created on']).toLocaleString() : 'N/A'}" readonly>
            </div>
            <div class="mb-4">
              <label class="form-label">Status</label>
              <select id="activityStatus" class="form-select">
                <option value="Open" ${activity.fields['Status'] === 'Open' ? 'selected' : ''}>Open</option>
                <option value="Done" ${activity.fields['Status'] === 'Done' ? 'selected' : ''}>Done</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label">Image</label>
              <input id="imageFile" type="file" class="form-control" accept="image/*">
              <small class="text-muted">Upload new image (optional)</small>
            </div>
            <div class="mb-4">
              <label class="form-label">Modified By</label>
              <select id="modifiedBy" class="form-select">
                <option value="">Select modifier...</option>
                ${members.map((member: TeamMember) =>
                  `<option value="${member.id}">${member.fields['Name']}</option>`
                ).join('')}
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label">Modified On</label>
              <input id="modifiedOn" type="datetime-local" class="form-control" value="${currentDate.toISOString().slice(0, 16)}">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Save Changes',
        cancelButtonText: 'Cancel',
        width: 700,
        preConfirm: () => {
          const activityType = (document.getElementById('activityType') as HTMLSelectElement).value;
          const leadComment = (document.getElementById('leadComment') as HTMLTextAreaElement).value;
          const activityStatus = (document.getElementById('activityStatus') as HTMLSelectElement).value;
          const imageFile = (document.getElementById('imageFile') as HTMLInputElement).files?.[0];
          const modifiedBy = (document.getElementById('modifiedBy') as HTMLSelectElement).value;
          const modifiedOn = (document.getElementById('modifiedOn') as HTMLInputElement).value;

          if (!activityType) {
            Swal.showValidationMessage('Activity type is required');
            return false;
          }

          return { activityType, leadComment, activityStatus, imageFile, modifiedBy, modifiedOn };
        },
      });

      if (formValues) {
        const updateData: any = {
          'Activity Type': formValues.activityType,
          'Status': formValues.activityStatus,
        };

        if (formValues.leadComment) {
          updateData['Activity'] = formValues.leadComment;
        }
        if (formValues.modifiedBy) {
          updateData['Modified By'] = [formValues.modifiedBy];
        }
        if (formValues.modifiedOn) {
          updateData['Modified On'] = new Date(formValues.modifiedOn).toISOString();
        }

        // Note: Image file upload to Airtable requires additional handling
        if (formValues.imageFile) {
          console.warn('Image upload selected but not yet implemented for Airtable API');
          // TODO: Implement Airtable attachment upload
        }

        await activityService.update(activity.id, updateData);
        await Swal.fire('Updated!', 'Activity has been updated successfully.', 'success');
        loadActivities();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update activity', 'error');
      console.error(error);
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: 'Delete Activity?',
      text: `Are you sure you want to delete "${activity.fields['Activity']}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f1416c',
    });

    if (result.isConfirmed) {
      try {
        await activityService.delete(activity.id);
        await Swal.fire('Deleted!', 'Activity has been deleted.', 'success');
        loadActivities();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete activity', 'error');
        console.error(error);
      }
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

            <button className="btn btn-sm btn-primary" onClick={handleCreateActivity}>
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

        <div className="d-flex justify-content-between align-items-center mt-5">
          <div className="text-gray-600">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </div>
      </div>
    </div>
  );
}
