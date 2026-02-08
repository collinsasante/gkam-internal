import { useState, useEffect } from 'react';
import { dealsService, teamMemberService } from '../../services/airtable.service';
import type { Deal, TeamMember } from '../../types/airtable.types';
import SkeletonLoader from '../Common/SkeletonLoader';
import Modal from '../Common/Modal';

type DealStage = 'New' | 'Discovery' | 'Prospective' | 'Invoice' | 'Won' | 'Lost';

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Form State
  const [editForm, setEditForm] = useState({
    dealTitle: '',
    dealValue: '',
    probability: '',
    closeDate: ''
  });

  // Status/Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({ type: null, message: null });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3000);
  };

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
    try {
      await dealsService.update(deal.id, { Stage: newStage });
      showFeedback('success', `Deal moved to ${newStage}`);
      loadData();
    } catch (error) {
      showFeedback('error', 'Failed to update deal stage');
      console.error(error);
    }
  };

  const handleCardClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedDeal) return;
    setEditForm({
      dealTitle: (selectedDeal.fields as any)['Deal Title'] || '',
      dealValue: ((selectedDeal.fields as any)['Deal Value'] || '').toString(),
      probability: ((selectedDeal.fields as any)['Close Probability '] || '').toString(),
      closeDate: (selectedDeal.fields as any)['Expected Close Date'] ? new Date((selectedDeal.fields as any)['Expected Close Date']).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleEditSubmit = async () => {
    if (!selectedDeal || !editForm.dealTitle) {
      showFeedback('error', 'Deal title is required');
      return;
    }

    try {
      const updateData: any = {
        'Deal Title': editForm.dealTitle,
      };

      if (editForm.dealValue) updateData['Deal Value'] = parseFloat(editForm.dealValue);
      if (editForm.probability) updateData['Close Probability '] = parseInt(editForm.probability);
      if (editForm.closeDate) updateData['Expected Close Date'] = editForm.closeDate;

      await dealsService.update(selectedDeal.id, updateData);
      showFeedback('success', 'Deal has been updated successfully.');
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      showFeedback('error', 'Failed to update deal');
      console.error(error);
    }
  };

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setIsDetailsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDeal) return;
    try {
      await dealsService.delete(selectedDeal.id);
      showFeedback('success', 'Deal has been deleted.');
      setIsDeleteModalOpen(false);
      loadData();
    } catch (error) {
      showFeedback('error', 'Failed to delete deal');
      console.error(error);
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

  const getFieldValue = (field: any) => {
    if (Array.isArray(field)) return field[0] || 'N/A';
    return field || 'N/A';
  };

  const getColumnColor = (stage?: DealStage) => {
    switch (stage) {
      case 'New': return '#dc3545';
      case 'Discovery': return '#000000';
      case 'Prospective': return '#dc3545';
      case 'Invoice': return '#000000';
      case 'Won': return '#dc3545';
      case 'Lost': return '#000000';
      default: return '#dee2e6';
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
      <div className="card">
        <div className="card-header border-0 pt-6">
          <div className="card-title">
            <div style={{ height: '40px', width: '300px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
          </div>
          <div className="card-toolbar">
            <div style={{ height: '40px', width: '120px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="card-body py-4">
          <SkeletonLoader type="kanban" />
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
      {/* Feedback Alert */}
      {feedback.type && (
        <div
          className={`alert alert-${feedback.type === 'success' ? 'success' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-5`}
          style={{ zIndex: 9999, minWidth: '300px' }}
        >
          {feedback.message}
        </div>
      )}

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
                                className={`progress-bar ${((deal.fields as any)['Close Probability '] || 0) >= 75 ? 'bg-success' :
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

                      {/* Phone */}
                      {(deal.fields as any)['Phone Number'] && (
                        <div className="d-flex align-items-center mb-3">
                          <i className="ki-duotone ki-phone fs-4 text-success me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                          </i>
                          <span className="text-gray-700 fs-7 fw-bold">
                            {getFieldValue((deal.fields as any)['Phone Number'])}
                          </span>
                        </div>
                      )}

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

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedDeal ? ((selectedDeal.fields as any)['Deal Title'] || 'Deal Details') : 'Deal Details'}
        size="lg"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-danger" onClick={handleOpenDeleteModal}>Delete</button>
            <button className="btn btn-primary" onClick={handleOpenEditModal}>Edit</button>
            <button className="btn btn-light" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
          </div>
        }
      >
        {selectedDeal && (
          <div className="text-start p-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {/* Deal Information */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-primary py-3 min-h-auto">
                <h6 className="card-title mb-0 text-primary">
                  <i className="ki-duotone ki-dollar fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  Deal Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Stage</label>
                    <span className="badge fs-7 mt-1" style={{ backgroundColor: getColumnColor(selectedDeal.fields['Stage'] as DealStage), color: 'white' }}>
                      {selectedDeal.fields['Stage'] || 'N/A'}
                    </span>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Deal Value</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">{formatCurrency((selectedDeal.fields as any)['Deal Value'])}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Probability</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">{(selectedDeal.fields as any)['Close Probability '] || 0}%</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Expected Close Date</label>
                    <div className="text-gray-800 fs-6 mt-1">{(selectedDeal.fields as any)['Expected Close Date'] ? new Date((selectedDeal.fields as any)['Expected Close Date']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-info py-3 min-h-auto">
                <h6 className="card-title mb-0 text-info">
                  <i className="ki-duotone ki-profile-circle fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                  Contact Information
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Owner</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">{getOwnerName((selectedDeal.fields as any)['Owner(Team Member)'])}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Lead Name</label>
                    <div className="text-gray-800 fs-6 mt-1">{(selectedDeal.fields as any)['Name of Lead'] || 'N/A'}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Phone</label>
                    <div className="text-gray-800 fs-6 mt-1">{getFieldValue((selectedDeal.fields as any)['Phone Number'])}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(selectedDeal.fields as any)['Notes from Initial Conversation'] && (
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-light-warning py-3 min-h-auto">
                  <h6 className="card-title mb-0 text-warning">
                    <i className="ki-duotone ki-note-2 fs-3 me-2">
                      <span className="path1"></span>
                      <span className="path2"></span>
                      <span className="path3"></span>
                      <span className="path4"></span>
                    </i>
                    Notes
                  </h6>
                </div>
                <div className="card-body p-4">
                  <div className="text-gray-800">{(selectedDeal.fields as any)['Notes from Initial Conversation']}</div>
                </div>
              </div>
            )}

            {/* Activity Summary */}
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-light-success py-3 min-h-auto">
                <h6 className="card-title mb-0 text-success">
                  <i className="ki-duotone ki-chart-simple fs-3 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                  Activity Summary
                </h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Activities</label>
                    <div className="text-gray-800 fw-bold fs-6 mt-1">{Array.isArray(selectedDeal.fields['Activities']) ? selectedDeal.fields['Activities'].length : 0}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted fs-7 fw-semibold d-block">Created On</label>
                    <div className="text-gray-800 fs-6 mt-1">{(selectedDeal.fields as any)['Created On'] ? new Date((selectedDeal.fields as any)['Created On']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deal"
        footer={
          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-light" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
          </div>
        }
      >
        <div className="text-start p-2">
          <div className="mb-5">
            <label className="form-label required fw-bold fs-6 mb-2">Deal Title</label>
            <input
              className="form-control form-control-solid"
              value={editForm.dealTitle}
              onChange={(e) => setEditForm({ ...editForm, dealTitle: e.target.value })}
              placeholder="Enter deal title"
            />
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6 mb-2">Deal Value</label>
            <input
              type="number"
              className="form-control form-control-solid"
              value={editForm.dealValue}
              onChange={(e) => setEditForm({ ...editForm, dealValue: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6 mb-2">Probability (%)</label>
            <input
              type="number"
              className="form-control form-control-solid"
              value={editForm.probability}
              onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
              min="0" max="100"
              placeholder="0-100"
            />
          </div>
          <div className="mb-5">
            <label className="form-label fw-bold fs-6 mb-2">Expected Close Date</label>
            <input
              type="date"
              className="form-control form-control-solid"
              value={editForm.closeDate}
              onChange={(e) => setEditForm({ ...editForm, closeDate: e.target.value })}
            />
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
          <p>Are you sure you want to delete this deal? This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
}
