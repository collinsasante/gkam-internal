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
            <div className="badge badge-light-primary fs-6">
              Total Members: {teamMembers.length}
            </div>
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
              <th className="text-end min-w-100px">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {teamMembers.map((member) => (
              <tr key={member.id}>
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
                  <span className="badge badge-light-info">
                    {member.fields['Role'] || 'Team Member'}
                  </span>
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-light btn-active-light-primary"
                    onClick={() => {
                      if (typeof Swal !== 'undefined') {
                        Swal.fire({
                          title: `<div class="d-flex align-items-center">
                            <i class="ki-duotone ki-profile-user fs-2x text-primary me-3">
                              <span class="path1"></span>
                              <span class="path2"></span>
                              <span class="path3"></span>
                              <span class="path4"></span>
                            </i>
                            <span>${member.fields['Name'] || 'Team Member'}</span>
                          </div>`,
                          html: `
                            <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
                              <!-- Profile Avatar -->
                              <div class="text-center mb-5">
                                <div class="symbol symbol-circle symbol-100px d-inline-block">
                                  <div class="symbol-label fs-1" style="background-color: ${getRandomColor(member.fields['Name'])}">
                                    <span class="text-white fw-bold">
                                      ${getInitials(member.fields['Name'])}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <!-- Team Member Information -->
                              <div class="card shadow-sm mb-4">
                                <div class="card-header bg-light-primary">
                                  <h6 class="card-title mb-0 text-primary">
                                    <i class="ki-duotone ki-user-tick fs-3 me-2">
                                      <span class="path1"></span>
                                      <span class="path2"></span>
                                      <span class="path3"></span>
                                    </i>
                                    Profile Information
                                  </h6>
                                </div>
                                <div class="card-body">
                                  <div class="row g-3">
                                    <div class="col-12">
                                      <label class="text-muted fs-7 fw-semibold">Name</label>
                                      <div class="text-gray-800 fw-bold">${member.fields['Name'] || 'N/A'}</div>
                                    </div>
                                    <div class="col-12">
                                      <label class="text-muted fs-7 fw-semibold">Email</label>
                                      <div class="text-gray-800">${member.fields['Email'] ? `<a href="mailto:${member.fields['Email']}" class="text-primary">${member.fields['Email']}</a>` : 'N/A'}</div>
                                    </div>
                                    <div class="col-12">
                                      <label class="text-muted fs-7 fw-semibold">Role</label>
                                      <div><span class="badge badge-light-info fs-6">${member.fields['Role'] || 'Team Member'}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <!-- System Info -->
                              <div class="card shadow-sm mb-4">
                                <div class="card-header bg-light-secondary">
                                  <h6 class="card-title mb-0 text-secondary">
                                    <i class="ki-duotone ki-information-4 fs-3 me-2">
                                      <span class="path1"></span>
                                      <span class="path2"></span>
                                      <span class="path3"></span>
                                    </i>
                                    System Information
                                  </h6>
                                </div>
                                <div class="card-body">
                                  <div class="row g-3">
                                    <div class="col-12">
                                      <label class="text-muted fs-7 fw-semibold">Team Member ID</label>
                                      <div class="text-gray-600 fs-7 font-monospace">${member.id}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `,
                          confirmButtonText: 'Close',
                          buttonsStyling: false,
                          customClass: {
                            confirmButton: 'btn btn-primary',
                            popup: 'rounded',
                            title: 'fs-4',
                            htmlContainer: 'p-0'
                          },
                          width: 600,
                        });
                      }
                    }}
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
