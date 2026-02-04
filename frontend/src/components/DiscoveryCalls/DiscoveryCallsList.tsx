import { useState, useEffect } from 'react';
import { discoveryCallService, teamMemberService } from '../../services/airtable.service';
import type { DiscoveryCallRecord, TeamMember } from '../../types/airtable.types';
import Modal from '../Common/Modal';

export default function DiscoveryCallsList() {
  const [calls, setCalls] = useState<DiscoveryCallRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<DiscoveryCallRecord | null>(null);

  useEffect(() => {
    loadCalls();
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

  const loadCalls = async () => {
    try {
      setLoading(true);
      const data = await discoveryCallService.getAll();
      setCalls(data);
      setError(null);
    } catch (err) {
      setError('Failed to load discovery calls');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch = searchTerm === '' ||
      call.fields['Discovery Call Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.fields['Company Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.fields['Order ID']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (call.fields['Customer Name (from Customer Name)'] &&
        (Array.isArray(call.fields['Customer Name (from Customer Name)'])
          ? call.fields['Customer Name (from Customer Name)'][0]?.toLowerCase().includes(searchTerm.toLowerCase())
          : call.fields['Customer Name (from Customer Name)'].toLowerCase().includes(searchTerm.toLowerCase())
        )
      );

    const matchesStatus = filterStatus === '' || call.fields['Discovery Status'] === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getOwnerName = (ownerId?: string[]) => {
    if (!ownerId || ownerId.length === 0) return 'Unassigned';
    const owner = teamMembers.find(tm => tm.id === ownerId[0]);
    return owner?.fields['Name'] || ownerId[0];
  };

  const handleViewDetails = (call: DiscoveryCallRecord) => {
    setSelectedCall(call);
    setIsViewModalOpen(true);
  };

  const extractAIText = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && data.value) return data.value;
    return '';
  };

  const formatAIText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/(\d+\.\s)/g, '\n$1') // Use newlines for cleaner rendering in pre-wrap or mapping
      .trim();
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
        <button className="btn btn-sm btn-primary ms-3" onClick={loadCalls}>
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
                placeholder="Search discovery calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <select
                className="form-select form-select-solid w-200px"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Reached">Reached</option>
                <option value="Unreachable">Unreachable</option>
              </select>

              <button className="btn btn-primary btn-sm" onClick={loadCalls}>
                <i className="ki-duotone ki-arrows-circle fs-3">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card-body pt-0">
          <table className="table align-middle table-row-dashed fs-6 gy-5">
            <thead>
              <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                <th className="min-w-200px">Discovery Call Name</th>
                <th className="min-w-125px">Order ID</th>
                <th className="min-w-150px">Customer</th>
                <th className="min-w-125px">Call Date</th>
                <th className="min-w-125px">Owner</th>
                <th className="min-w-100px">Status</th>
                <th className="text-end min-w-100px">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 fw-semibold">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <div className="text-gray-600">No discovery calls found</div>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="cursor-pointer"
                    onClick={() => handleViewDetails(call)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="d-flex flex-column">
                        <span className="text-gray-800 fw-bold">{call.fields['Discovery Call Name'] || 'Untitled Call'}</span>
                        {call.fields['Project/Topic'] && (
                          <span className="text-muted fs-7">{call.fields['Project/Topic']}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-800">{call.fields['Order ID'] || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="text-gray-800">
                        {call.fields['Customer Name (from Customer Name)']
                          ? (Array.isArray(call.fields['Customer Name (from Customer Name)'])
                            ? call.fields['Customer Name (from Customer Name)'][0]
                            : call.fields['Customer Name (from Customer Name)'])
                          : 'Not specified'}
                      </span>
                    </td>
                    <td>
                      {call.fields['Call Date']
                        ? new Date(call.fields['Call Date']).toLocaleDateString()
                        : 'Not specified'}
                    </td>
                    <td>
                      <span className="text-gray-800">{getOwnerName(call.fields['Discovery Call Owner'])}</span>
                    </td>
                    <td>
                      {call.fields['Discovery Status'] === 'Reached' ? (
                        <span className="badge badge-light-success fw-bold">
                          Reached
                        </span>
                      ) : (
                        <span className="badge badge-light-danger fw-bold">
                          Unreachable
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(call);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center mt-5">
            <div className="text-gray-600">
              Showing {filteredCalls.length} of {calls.length} discovery calls
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedCall?.fields['Discovery Call Name'] || 'Discovery Call Details'}
        size="lg"
        footer={<button className="btn btn-light" onClick={() => setIsViewModalOpen(false)}>Close</button>}
      >
        {selectedCall && (
          <>
            <div className="mb-5">
              <h5 className="mb-3">
                <i className="ki-duotone ki-profile-circle fs-3 me-2">
                  <span className="path1"></span><span className="path2"></span><span className="path3"></span>
                </i>
                Customer & Contact Information
              </h5>
              <div className="row g-3">
                <div className="col-6">
                  <label className="fw-bold text-muted">Order Number</label>
                  <div>{selectedCall.fields['Order ID'] || selectedCall.fields['Order Number'] || 'Not specified'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Customer Name</label>
                  <div>{selectedCall.fields['Customer Name (from Customer Name)'] ? (Array.isArray(selectedCall.fields['Customer Name (from Customer Name)']) ? selectedCall.fields['Customer Name (from Customer Name)'][0] : selectedCall.fields['Customer Name (from Customer Name)']) : 'Not specified'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Call Date</label>
                  <div>{selectedCall.fields['Call Date'] ? new Date(selectedCall.fields['Call Date']).toLocaleString() : 'Not specified'}</div>
                </div>
                <div className="col-6">
                  <label className="fw-bold text-muted">Status</label>
                  <div><span className={`badge ${selectedCall.fields['Discovery Status'] === 'Reached' ? 'badge-primary' : 'badge-secondary'}`}>{selectedCall.fields['Discovery Status'] || 'Not specified'}</span></div>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h5 className="mb-3">
                <i className="ki-duotone ki-abstract-26 fs-3 me-2">
                  <span className="path1"></span><span className="path2"></span>
                </i>
                Project Details
              </h5>
              <div>
                {selectedCall.fields['Project/Topic'] && (
                  <div className="mb-2"><strong>Project/Topic:</strong> {selectedCall.fields['Project/Topic']}</div>
                )}
                {selectedCall.fields['Project Description/Notes'] && (
                  <div className="mb-2"><strong>Description:</strong> {selectedCall.fields['Project Description/Notes']}</div>
                )}
                {selectedCall.fields['Key Questions Asked'] && (
                  <div><strong>Key Questions:</strong> {selectedCall.fields['Key Questions Asked']}</div>
                )}
              </div>
            </div>

            <div className="mb-5">
              <h5 className="mb-3">
                <i className="ki-duotone ki-messages fs-3 me-2">
                  <span className="path1"></span><span className="path2"></span><span className="path3"></span>
                </i>
                Customer Insights
              </h5>
              <div>
                {selectedCall.fields['Customer Pain Points'] && (
                  <div className="mb-2"><strong>Pain Points:</strong> {selectedCall.fields['Customer Pain Points']}</div>
                )}
                {selectedCall.fields['Desired Outcomes'] && (
                  <div className="mb-2"><strong>Desired Outcomes:</strong> {selectedCall.fields['Desired Outcomes']}</div>
                )}
                {selectedCall.fields['Next Steps'] && (
                  <div><strong>Next Steps:</strong> {selectedCall.fields['Next Steps']}</div>
                )}
              </div>
            </div>

            {(extractAIText(selectedCall.fields['Discovery Call Summary (AI)']) || extractAIText(selectedCall.fields['Action Items (AI)'])) && (
              <div className="mb-5">
                <h5 className="mb-3">AI-Generated Insights</h5>
                {extractAIText(selectedCall.fields['Discovery Call Summary (AI)']) && (
                  <div className="mb-3">
                    <strong>Summary:</strong>
                    <p className="text-gray-600 bg-light p-3 rounded">{extractAIText(selectedCall.fields['Discovery Call Summary (AI)'])}</p>
                  </div>
                )}
                {extractAIText(selectedCall.fields['Action Items (AI)']) && (
                  <div>
                    <strong>Action Items:</strong>
                    <p className="text-gray-600 bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>{formatAIText(extractAIText(selectedCall.fields['Action Items (AI)']))}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
