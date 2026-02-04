import { useState, useEffect, useRef } from 'react';
import { teamMemberService } from '../../services/airtable.service';
import type { TeamMember } from '../../types/airtable.types';
import Modal from '../Common/Modal';

declare const $: any;
declare const Swal: any;

export default function TeamMembersList() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && teamMembers.length > 0 && tableRef.current && !dataTableRef.current) {
      initializeDataTable();
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [loading, teamMembers]);

  const initializeDataTable = () => {
    if (!tableRef.current || typeof $ === 'undefined') return;

    try {
      dataTableRef.current = $(tableRef.current).DataTable({
        info: false,
        order: [[0, 'asc']], // Sort by Name ascending
        columnDefs: [
          { orderable: false, targets: '_all' },
        ],
        pageLength: 10,
        language: {
          search: '',
          searchPlaceholder: 'Search team members...',
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
      const teamMembersData = await teamMemberService.getAll();
      setTeamMembers(teamMembersData);
      setError(null);
    } catch (err) {
      setError('Failed to load team members');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TM';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (name?: string) => {
    if (!name) return '#3F4254';
    const colors = [
      '#DC143C', // Crimson (main brand color)
      '#009EF7', // Primary blue
      '#50CD89', // Success green
      '#F1416C', // Danger pink
      '#FFC700', // Warning yellow
      '#7239EA', // Purple
      '#181C32', // Dark
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ name: '', email: '', role: '' });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!formData.name || !formData.email) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      const createData = {
        'Name': formData.name,
        'Email': formData.email,
        'Role': formData.role || 'Team Member',
      };

      await teamMemberService.create(createData);
      Swal.fire('Success!', 'Team member has been added', 'success');
      loadData();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating team member:', error);
      Swal.fire('Error!', 'Failed to create team member', 'error');
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
        <button className="btn btn-sm btn-light ms-3" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
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
                placeholder="Search team members..."
                onChange={(e) => {
                  if (dataTableRef.current) {
                    dataTableRef.current.search(e.target.value).draw();
                  }
                }}
              />
            </div>
          </div>
          <div className="card-toolbar">
            <div className="d-flex align-items-center gap-3">
              <div className="badge badge-light fs-6">
                Total Members: {teamMembers.length}
              </div>
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                <i className="ki-duotone ki-plus fs-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Add Team Member
              </button>
            </div>
          </div>
        </div>

        <div className="card-body pt-0">
          <table className="table align-middle table-row-dashed fs-6 gy-5" ref={tableRef}>
            <thead>
              <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                <th className="min-w-250px">Team Member</th>
                <th className="min-w-150px">Email</th>
                <th className="min-w-150px">Role</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 fw-semibold">
              {teamMembers.map((member) => (
                <tr
                  key={member.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMemberClick(member)}
                  className="hover-bg-light-primary"
                >
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="symbol symbol-circle symbol-50px overflow-hidden me-3">
                        <div className="symbol-label" style={{ backgroundColor: getRandomColor(member.fields['Name']) }}>
                          <span className="text-white fw-bold fs-4">
                            {getInitials(member.fields['Name'])}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column">
                        <span className="text-gray-800 fw-bold fs-6">
                          {member.fields['Name'] || 'Unknown'}
                        </span>
                        {member.fields['Role'] && (
                          <span className="text-muted fs-7">{member.fields['Role']}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {member.fields['Email'] ? (
                      <a href={`mailto:${member.fields['Email']}`} className="text-gray-800">
                        {member.fields['Email']}
                      </a>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {member.fields['Role'] || 'Team Member'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
        footer={
          <>
            <button type="button" className="btn btn-light me-3" onClick={() => setIsAddModalOpen(false)}>Close</button>
            <button type="button" className="btn btn-primary" onClick={handleAddSubmit}>Add Member</button>
          </>
        }
      >
        <div className="fv-row mb-5">
          <label className="form-label required">
            <i className="ki-duotone ki-profile-circle fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
              <span className="path3"></span>
            </i>
            Full Name
          </label>
          <input
            type="text"
            className="form-control form-control-solid"
            placeholder="Enter full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label required">
            <i className="ki-duotone ki-sms fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Email Address
          </label>
          <input
            type="email"
            className="form-control form-control-solid"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="fv-row mb-5">
          <label className="form-label">
            <i className="ki-duotone ki-briefcase fs-5 me-1">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Role
          </label>
          <input
            type="text"
            className="form-control form-control-solid"
            placeholder="e.g., Sales Manager, Designer"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
        </div>
      </Modal>

      {/* View Member Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedMember?.fields['Name'] || 'Team Member'}
        footer={
          <button type="button" className="btn btn-light" onClick={() => setIsViewModalOpen(false)}>Close</button>
        }
      >
        {selectedMember && (
          <>
            <div className="text-center mb-5">
              <div className="symbol symbol-circle symbol-100px d-inline-block">
                <div className="symbol-label fs-1" style={{ backgroundColor: getRandomColor(selectedMember.fields['Name']) }}>
                  <span className="text-white fw-bold">
                    {getInitials(selectedMember.fields['Name'])}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-0">
              <h4 className="border-bottom pb-2 mb-4">
                <i className="ki-duotone ki-user-tick fs-2 me-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                </i>
                Profile Information
              </h4>
              <div className="row g-5">
                <div className="col-12">
                  <label className="fw-bold text-muted d-block mb-1">Full Name</label>
                  <span className="fw-bolder fs-6 text-gray-800">{selectedMember.fields['Name'] || 'N/A'}</span>
                </div>
                <div className="col-12">
                  <label className="fw-bold text-muted d-block mb-1">Email Address</label>
                  <span className="fw-bolder fs-6 text-gray-800">
                    {selectedMember.fields['Email'] ? <a href={`mailto:${selectedMember.fields['Email']}`}>{selectedMember.fields['Email']}</a> : 'N/A'}
                  </span>
                </div>
                <div className="col-12">
                  <label className="fw-bold text-muted d-block mb-1">Role</label>
                  <span className="badge badge-primary fs-7">{selectedMember.fields['Role'] || 'Team Member'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
