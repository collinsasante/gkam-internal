import { useState, useEffect } from 'react';
import { dealsService, teamMemberService } from '../../services/airtable.service';
import type { Deal, TeamMember } from '../../types/airtable.types';

declare const Swal: any;

type DealStage = 'New' | 'Discovery' | 'Prospective' | 'Invoice' | 'Won' | 'Lost';

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dealsData, teamMembersData] = await Promise.all([
        dealsService.getAll(),
        teamMemberService.getAll(),
      ]);
      setDeals(dealsData);
      setTeamMembers(teamMembersData);
      setError(null);
    } catch (err) {
      setError('Failed to load deals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (deal: Deal, newStage: DealStage) => {
    if (typeof Swal === 'undefined') return;

    try {
      await dealsService.update(deal.id, { Stage: newStage });
      await Swal.fire('Updated!', `Deal moved to ${newStage}`, 'success');
      loadData();
    } catch (error) {
      Swal.fire('Error', 'Failed to update deal stage', 'error');
      console.error(error);
    }
  };

  const handleCardClick = async (deal: Deal) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-chart-line-up fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>${(deal.fields as any)['Deal Title'] || 'Deal Details'}</span>
      </div>`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto; padding: 0 10px;">
          <!-- Deal Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-primary">
              <h6 class="card-title mb-0 text-primary">
                <i class="ki-duotone ki-dollar fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                </i>
                Deal Information
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Stage</label>
                  <div>
                    <span class="badge fs-6" style="background-color: ${getColumnColor(deal.fields['Stage'] as DealStage)}; color: white;">
                      ${deal.fields['Stage'] || 'N/A'}
                    </span>
                  </div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Deal Value</label>
                  <div class="text-gray-800 fw-bold">${formatCurrency((deal.fields as any)['Deal Value'])}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Probability</label>
                  <div class="text-gray-800 fw-bold">${(deal.fields as any)['Close Probability '] || 0}%</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Expected Close Date</label>
                  <div class="text-gray-800">${(deal.fields as any)['Expected Close Date'] ? new Date((deal.fields as any)['Expected Close Date']).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-info">
              <h6 class="card-title mb-0 text-info">
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
                  <label class="text-muted fs-7 fw-semibold">Owner</label>
                  <div class="text-gray-800 fw-bold">${getOwnerName((deal.fields as any)['Owner(Team Member)'])}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Lead Name</label>
                  <div class="text-gray-800">${(deal.fields as any)['Name of Lead'] || 'N/A'}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Phone</label>
                  <div class="text-gray-800">${(deal.fields as any)['Phone Number'] || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          ${(deal.fields as any)['Notes from Initial Conversation'] ? `
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
                Notes
              </h6>
            </div>
            <div class="card-body">
              <div class="text-gray-800">${(deal.fields as any)['Notes from Initial Conversation']}</div>
            </div>
          </div>
          ` : ''}

          <!-- Activity Summary -->
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-light-success">
              <h6 class="card-title mb-0 text-success">
                <i class="ki-duotone ki-chart-simple fs-3 me-2">
                  <span class="path1"></span>
                  <span class="path2"></span>
                  <span class="path3"></span>
                  <span class="path4"></span>
                </i>
                Activity Summary
              </h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Activities</label>
                  <div class="text-gray-800 fw-bold">${Array.isArray(deal.fields['Activities']) ? deal.fields['Activities'].length : 0}</div>
                </div>
                <div class="col-6">
                  <label class="text-muted fs-7 fw-semibold">Created On</label>
                  <div class="text-gray-800">${(deal.fields as any)['Created On'] ? new Date((deal.fields as any)['Created On']).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Edit',
      denyButtonText: 'Delete',
      cancelButtonText: 'Close',
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
    });

    if (result.isConfirmed) {
      handleEditDeal(deal);
    } else if (result.isDenied) {
      handleDeleteDeal(deal);
    }
  };

  const handleEditDeal = async (deal: Deal) => {
    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `<div class="d-flex align-items-center">
        <i class="ki-duotone ki-pencil fs-2x text-primary me-3">
          <span class="path1"></span>
          <span class="path2"></span>
        </i>
        <span>Edit Deal</span>
      </div>`,
      html: `
        <div class="text-start p-4">
          <div class="mb-5">
            <label class="form-label required fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-chart-line-up fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Deal Title
            </label>
            <input id="dealTitle" class="form-control form-control-solid" value="${(deal.fields as any)['Deal Title'] || ''}" placeholder="Enter deal title" required>
          </div>
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-dollar fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
                <span class="path3"></span>
              </i>
              Deal Value
            </label>
            <input id="dealValue" type="number" class="form-control form-control-solid" value="${(deal.fields as any)['Deal Value'] || ''}" placeholder="0">
          </div>
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-percentage fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Probability (%)
            </label>
            <input id="probability" type="number" min="0" max="100" class="form-control form-control-solid" value="${(deal.fields as any)['Close Probability '] || ''}" placeholder="0-100">
          </div>
          <div class="mb-5">
            <label class="form-label fw-bold fs-6 mb-2">
              <i class="ki-duotone ki-calendar fs-4 me-2">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
              Expected Close Date
            </label>
            <input id="closeDate" type="date" class="form-control form-control-solid" value="${(deal.fields as any)['Expected Close Date'] ? new Date((deal.fields as any)['Expected Close Date']).toISOString().split('T')[0] : ''}">
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
        const dealTitle = (document.getElementById('dealTitle') as HTMLInputElement).value;
        const dealValue = (document.getElementById('dealValue') as HTMLInputElement).value;
        const probability = (document.getElementById('probability') as HTMLInputElement).value;
        const closeDate = (document.getElementById('closeDate') as HTMLInputElement).value;

        if (!dealTitle) {
          Swal.showValidationMessage('Deal title is required');
          return false;
        }

        return { dealTitle, dealValue, probability, closeDate };
      },
    });

    if (formValues) {
      try {
        const updateData: any = {
          'Deal Title': formValues.dealTitle,
        };

        if (formValues.dealValue) {
          updateData['Deal Value'] = parseFloat(formValues.dealValue);
        }
        if (formValues.probability) {
          updateData['Close Probability '] = parseInt(formValues.probability);
        }
        if (formValues.closeDate) {
          updateData['Expected Close Date'] = formValues.closeDate;
        }

        await dealsService.update(deal.id, updateData);
        await Swal.fire('Updated!', 'Deal has been updated successfully.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Failed to update deal', 'error');
        console.error(error);
      }
    }
  };

  const handleDeleteDeal = async (deal: Deal) => {
    if (typeof Swal === 'undefined') return;

    const result = await Swal.fire({
      title: 'Delete Deal?',
      text: `Are you sure you want to delete "${(deal.fields as any)['Deal Title']}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f1416c',
    });

    if (result.isConfirmed) {
      try {
        await dealsService.delete(deal.id);
        await Swal.fire('Deleted!', 'Deal has been deleted.', 'success');
        loadData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete deal', 'error');
        console.error(error);
      }
    }
  };

  const getOwnerName = (ownerIds?: string[]) => {
    if (!ownerIds || ownerIds.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerIds[0]);
    return owner?.fields['Name'] || 'Unknown';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '₵0';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getColumnColor = (stage?: DealStage) => {
    switch (stage) {
      case 'New': return '#009ef7';
      case 'Discovery': return '#7239ea';
      case 'Prospective': return '#ffc700';
      case 'Invoice': return '#50cd89';
      case 'Won': return '#17c653';
      case 'Lost': return '#f1416c';
      default: return '#a1a5b7';
    }
  };

  const columns: { stage: DealStage; title: string }[] = [
    { stage: 'New', title: 'New' },
    { stage: 'Discovery', title: 'Discovery' },
    { stage: 'Prospective', title: 'Prospective' },
    { stage: 'Invoice', title: 'Invoice' },
    { stage: 'Won', title: 'Won' },
    { stage: 'Lost', title: 'Lost' },
  ];

  const getDealsByStage = (stage: DealStage): Deal[] => {
    return deals.filter(deal => {
      const dealStage = deal.fields['Stage'] || 'New';
      const matchesStage = dealStage === stage;

      if (!searchTerm) {
        return matchesStage;
      }

      const dealTitle = (deal.fields as any)['Deal Title'];
      const leadName = (deal.fields as any)['Name of Lead'];
      const ownerName = getOwnerName((deal.fields as any)['Owner(Team Member)']);

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (typeof dealTitle === 'string' && dealTitle.toLowerCase().includes(searchLower)) ||
        (typeof leadName === 'string' && leadName.toLowerCase().includes(searchLower)) ||
        (typeof ownerName === 'string' && ownerName.toLowerCase().includes(searchLower));

      return matchesStage && matchesSearch;
    });
  };

  const getStageTotal = (stage: DealStage): number => {
    const stageDeals = getDealsByStage(stage);
    return stageDeals.reduce((sum, deal) => sum + ((deal.fields as any)['Deal Value'] || 0), 0);
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
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-6">
        <div className="d-flex align-items-center gap-3">
          <h1 className="mb-0">Deals Pipeline</h1>
          <span className="badge badge-light-primary fs-5">{deals.length} Total</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-4 mt-3">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            <input
              type="text"
              className="form-control form-control-solid w-300px ps-12"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-sm btn-light" onClick={loadData}>
            <i className="ki-duotone ki-arrows-circle fs-2">
              <span className="path1"></span>
              <span className="path2"></span>
            </i>
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="d-flex gap-5" style={{ overflowX: 'auto', minHeight: '600px' }}>
        {columns.map((column) => {
          const columnDeals = getDealsByStage(column.stage);
          const columnTotal = getStageTotal(column.stage);

          return (
            <div key={column.stage} className="flex-shrink-0" style={{ width: '320px' }}>
              {/* Column Header */}
              <div
                className="card mb-3"
                style={{ borderTop: `3px solid ${getColumnColor(column.stage)}` }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h3 className="fs-5 fw-bold text-gray-800 mb-0">{column.title}</h3>
                    <span className="badge badge-light-primary">{columnDeals.length}</span>
                  </div>
                  <div className="text-gray-600 fs-7 fw-semibold">
                    {formatCurrency(columnTotal)}
                  </div>
                </div>
              </div>

              {/* Column Cards */}
              <div className="d-flex flex-column gap-3">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="card card-flush cursor-pointer hover-elevate-up"
                    onClick={() => handleCardClick(deal)}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div className="card-body p-5">
                      {/* Deal Title */}
                      <div className="mb-3">
                        <h4 className="fs-6 fw-bold text-gray-800 mb-1">
                          {(deal.fields as any)['Deal Title'] || 'Untitled Deal'}
                        </h4>
                        {(deal.fields as any)['Name of Lead'] && (
                          <span className="text-muted fs-7">{(deal.fields as any)['Name of Lead']}</span>
                        )}
                      </div>

                      {/* Deal Value & Probability */}
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-gray-600 fs-7">Deal Value</span>
                          <span className="text-gray-800 fw-bold fs-6">
                            {formatCurrency((deal.fields as any)['Deal Value'])}
                          </span>
                        </div>
                        {(deal.fields as any)['Close Probability '] !== undefined && (
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="text-gray-600 fs-7">Probability</span>
                              <span className="text-gray-800 fs-7 fw-semibold">{(deal.fields as any)['Close Probability ']}%</span>
                            </div>
                            <div className="progress h-5px">
                              <div
                                className={`progress-bar ${
                                  ((deal.fields as any)['Close Probability '] || 0) >= 75 ? 'bg-success' :
                                  ((deal.fields as any)['Close Probability '] || 0) >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${(deal.fields as any)['Close Probability ']}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Owner */}
                      <div className="d-flex align-items-center mb-3">
                        <i className="ki-duotone ki-user fs-4 text-gray-500 me-2">
                          <span className="path1"></span>
                          <span className="path2"></span>
                        </i>
                        <span className="text-gray-700 fs-7">
                          {getOwnerName((deal.fields as any)['Owner(Team Member)'])}
                        </span>
                      </div>

                      {/* Close Date */}
                      {(deal.fields as any)['Expected Close Date'] && (
                        <div className="d-flex align-items-center mb-3">
                          <i className="ki-duotone ki-calendar fs-4 text-gray-500 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          <span className="text-gray-700 fs-7">
                            {new Date((deal.fields as any)['Expected Close Date']).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Stage Actions */}
                      <div className="separator separator-dashed my-3"></div>

                      <div className="d-flex gap-2">
                        {column.stage !== 'New' && (
                          <button
                            className="btn btn-sm btn-light-primary flex-grow-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prevStageIndex = columns.findIndex(c => c.stage === column.stage) - 1;
                              if (prevStageIndex >= 0) {
                                handleUpdateStage(deal, columns[prevStageIndex].stage);
                              }
                            }}
                          >
                            <i className="ki-duotone ki-arrow-left fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                          </button>
                        )}
                        {column.stage !== 'Won' && column.stage !== 'Lost' && (
                          <button
                            className="btn btn-sm btn-light-success flex-grow-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStageIndex = columns.findIndex(c => c.stage === column.stage) + 1;
                              if (nextStageIndex < columns.length - 2) { // Exclude Won and Lost from auto-progression
                                handleUpdateStage(deal, columns[nextStageIndex].stage);
                              }
                            }}
                          >
                            <i className="ki-duotone ki-arrow-right fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                          </button>
                        )}
                        {column.stage !== 'Won' && (
                          <button
                            className="btn btn-sm btn-light-success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStage(deal, 'Won');
                            }}
                            title="Mark as Won"
                          >
                            <i className="ki-duotone ki-check fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                          </button>
                        )}
                        {column.stage !== 'Lost' && (
                          <button
                            className="btn btn-sm btn-light-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStage(deal, 'Lost');
                            }}
                            title="Mark as Lost"
                          >
                            <i className="ki-duotone ki-cross fs-5">
                              <span className="path1"></span>
                              <span className="path2"></span>
                            </i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {columnDeals.length === 0 && (
                  <div className="card card-flush">
                    <div className="card-body p-5 text-center">
                      <i className="ki-duotone ki-file-deleted fs-3x text-gray-400 mb-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                      <p className="text-gray-600 fs-7 mb-0">No deals</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
