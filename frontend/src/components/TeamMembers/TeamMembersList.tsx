import { useState, useEffect, useRef } from 'react';
import { teamMemberService } from '../../services/airtable.service';
import type { TeamMember } from '../../types/airtable.types';

declare const $: any;
declare const Swal: any;

export default function TeamMembersList() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

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
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: member.fields['Name'] || 'Team Member',
        html: `
          <!-- Profile Avatar -->
          <div class="modal-section" style="text-align: center;">
            <div class="symbol symbol-circle symbol-100px d-inline-block">
              <div class="symbol-label fs-1" style="background-color: ${getRandomColor(member.fields['Name'])}">
                <span class="text-white fw-bold">
                  ${getInitials(member.fields['Name'])}
                </span>
              </div>
            </div>
          </div>

          <!-- Profile Information -->
          <div class="modal-section">
            <div class="modal-section-title">
              <i class="ki-duotone ki-user-tick fs-4">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Profile Information
            </div>
            <div class="modal-info-grid">
              <div class="modal-info-item">
                <div class="modal-info-label">Full Name</div>
                <div class="modal-info-value">${member.fields['Name'] || 'N/A'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Email Address</div>
                <div class="modal-info-value">${member.fields['Email'] ? `<a href="mailto:${member.fields['Email']}">${member.fields['Email']}</a>` : 'N/A'}</div>
              </div>
              <div class="modal-info-item">
                <div class="modal-info-label">Role</div>
                <div class="modal-info-value">
                  <span class="badge badge-primary">${member.fields['Role'] || 'Team Member'}</span>
                </div>
              </div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Close',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-light',
          popup: 'rounded',
          title: 'fs-4',
          htmlContainer: 'p-0'
        },
        width: 600,
      });
    }
  };

  const handleAddTeamMember = () => {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Add Team Member',
        html: `
          <div class="modal-form-section">
            <div class="modal-form-group">
              <label class="modal-form-label required">
                <i class="ki-duotone ki-profile-circle fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Full Name
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="member-name"
                placeholder="Enter full name"
              />
            </div>
            <div class="modal-form-group">
              <label class="modal-form-label required">
                <i class="ki-duotone ki-sms fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Email Address
              </label>
              <input
                type="email"
                class="form-control form-control-solid"
                id="member-email"
                placeholder="Enter email address"
              />
            </div>
            <div class="modal-form-group">
              <label class="modal-form-label">
                <i class="ki-duotone ki-briefcase fs-5">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
                Role
              </label>
              <input
                type="text"
                class="form-control form-control-solid"
                id="member-role"
                placeholder="e.g., Sales Manager, Designer"
              />
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Member',
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
          const name = (document.getElementById('member-name') as HTMLInputElement)?.value;
          const email = (document.getElementById('member-email') as HTMLInputElement)?.value;
          const role = (document.getElementById('member-role') as HTMLInputElement)?.value;

          if (!name || !email) {
            Swal.showValidationMessage('Please fill in all required fields');
            return false;
          }

          return { name, email, role };
        },
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          try {
            await teamMemberService.create({
              'Name': result.value.name,
              'Email': result.value.email,
              'Role': result.value.role || 'Team Member',
            });

            Swal.fire({
              title: 'Success!',
              text: 'Team member has been added',
              icon: 'success',
              confirmButtonText: 'OK',
              buttonsStyling: false,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            });

            loadData();
          } catch (error) {
            console.error('Error creating team member:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to create team member',
              icon: 'error',
              confirmButtonText: 'OK',
              buttonsStyling: false,
              customClass: {
                confirmButton: 'btn btn-primary',
              },
            });
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
        <button className="btn btn-sm btn-light ms-3" onClick={loadData}>
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
            <button className="btn btn-primary btn-sm" onClick={handleAddTeamMember}>
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
  );
}
