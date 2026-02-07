import { useState, useEffect } from 'react';
import { designDraftsService, teamMemberService } from '../../services/airtable.service';
import type { DesignDraft, TeamMember } from '../../types/airtable.types';
import Modal from '../Common/Modal';

type DesignStatus = 'Incomplete Information' | 'Unreachable' | 'Design' | 'Revision' | 'Production' | 'Final Handoff';



export default function DesignDraftsList() {
  console.log('✅ DesignDraftsList Component Version: LOCAL-LATEST-WITH-WHATSAPP-DELETE-REVISIONS');

  const [designs, setDesigns] = useState<DesignDraft[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<DesignDraft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string }>({ type: 'success', message: '' });

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setIsFeedbackVisible(true);
    setTimeout(() => setIsFeedbackVisible(false), 3000);
  };

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const designsData = await designDraftsService.getAll();
      setDesigns(designsData);
      setError(null);
    } catch (err) {
      setError('Failed to load design drafts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (design: DesignDraft) => {
    setSelectedDesign(design);
  };

  const handleBackToList = () => {
    setSelectedDesign(null);
  };


  const getTeamMemberName = (memberIds?: string[]): string => {
    if (!memberIds || memberIds.length === 0) return 'N/A';
    const member = teamMembers.find(tm => tm.id === memberIds[0]);
    return member?.fields['Name'] || 'N/A';
  };

  const handleSendWhatsApp = async (phoneNumber?: string) => {
    if (!phoneNumber || !selectedDesign) return;

    const message = `Hello!\n\nUpdate on your design project: ${selectedDesign.fields['Name']}\n\nOrder: ${selectedDesign.fields['Order Number'] || 'N/A'}\nStatus: ${selectedDesign.fields['Status'] || 'Design'}\nRevisions Left: ${selectedDesign.fields['Revisions Left'] ?? 3}\n\nTrack your order: https://track.packglamour.com/#ORD-${selectedDesign.fields['Order Number']}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleDeleteDesign = () => {
    if (!selectedDesign) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDesign) return;

    try {
      await designDraftsService.delete(selectedDesign.id);
      showFeedback('success', 'The design has been deleted successfully.');
      setIsDeleteModalOpen(false);
      setSelectedDesign(null);
      loadData();
    } catch (err) {
      showFeedback('error', 'Failed to delete the design. Please try again.');
    }
  };

  const handleFilePreview = (file: any) => {
    if (!file) return;

    const isImage = file.type?.startsWith('image/') ||
      file.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

    if (isImage) {
      setSelectedFile(file);
      setIsPreviewModalOpen(true);
    } else {
      window.open(file.url, '_blank');
    }
  };

  const formatTextWithLineBreaks = (text?: string): string => {
    if (!text) return 'N/A';
    return text
      .replace(/Uses:/g, '<br/><strong>Uses:</strong>')
      .replace(/Phone:/g, '<br/><strong>Phone:</strong>')
      .replace(/Best Before:/g, '<br/><strong>Best Before:</strong>')
      .replace(/Not recommended/g, '<br/><strong>Not recommended</strong>')
      .replace(/"A unique"/g, '')
      // Format numbered lists (1., 2., 3., etc.)
      .replace(/(\d+)\.\s+([A-Z])/g, '<br/><strong>$1.</strong> $2')
      .replace(/Modifications/g, '<br/><strong>Modifications</strong><br/>')
      .replace(/Ingredients:/g, '<br/><strong>Ingredients:</strong>')
      .trim();
  };

  const handleFileUpload = async (fieldName: string, files: FileList | null) => {
    if (!files || files.length === 0 || !selectedDesign) return;

    setUploading(true);

    try {
      const fileArray = Array.from(files);
      const formData = new FormData();

      fileArray.forEach((file) => {
        formData.append('files', file);
      });

      // Note: Airtable API requires files to be uploaded as base64 or URLs
      // For now, we'll show a notification that files would be uploaded
      showFeedback('info', `${fileArray.length} file(s) selected for ${fieldName}. In production, these would be uploaded to Airtable.`);

      // Here you would implement actual file upload to Airtable
      // The Airtable API expects attachments as an array of objects with url property

    } catch (err) {
      showFeedback('error', 'Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderFilesWithUpload = (files: any, fieldName: string, label: string) => {
    return (
      <div>
        {files && Array.isArray(files) && files.length > 0 ? (
          <div className="mb-3">
            {files.map((file, index) => {
              const isImage = file.type?.startsWith('image/') ||
                file.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

              return (
                <div
                  key={index}
                  className="d-flex align-items-center justify-content-between p-3 mb-2 bg-light rounded cursor-pointer hover-bg-light-primary"
                  onClick={() => handleFilePreview(file)}
                  style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  <div className="d-flex align-items-center flex-grow-1">
                    {isImage ? (
                      <div className="me-3">
                        <img
                          src={file.url}
                          alt={file.filename}
                          style={{
                            width: '50px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e4e6ef'
                          }}
                        />
                      </div>
                    ) : (
                      <i className="ki-duotone ki-file fs-2x text-primary me-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                      </i>
                    )}
                    <div>
                      <div className="text-gray-800 text-hover-primary fw-bold fs-7">{file.filename}</div>
                      <span className="text-muted fs-8">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  </div>
                  <i className="ki-duotone ki-eye fs-2 text-primary">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-muted mb-3">No files uploaded</div>
        )}

        <label className="btn btn-sm btn-light-primary">
          <i className="ki-duotone ki-file-up fs-3 me-2">
            <span className="path1"></span>
            <span className="path2"></span>
          </i>
          {uploading ? 'Uploading...' : `Upload ${label}`}
          <input
            type="file"
            multiple
            className="d-none"
            onChange={(e) => handleFileUpload(fieldName, e.target.files)}
            disabled={uploading}
          />
        </label>
      </div>
    );
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'Incomplete Information': return 'badge-light-warning';
      case 'Unreachable': return 'badge-light-danger';
      case 'Design': return 'badge-light-primary';
      case 'Revision': return 'badge-light-info';
      case 'Production': return 'badge-light-success';
      case 'Final Handoff': return 'badge-light-dark';
      default: return 'badge-light';
    }
  };

  const getColumnColor = (status?: DesignStatus) => {
    switch (status) {
      case 'Incomplete Information': return '#ffc700';
      case 'Unreachable': return '#f1416c';
      case 'Design': return '#009ef7';
      case 'Revision': return '#7239ea';
      case 'Production': return '#50cd89';
      case 'Final Handoff': return '#3f4254';
      default: return '#e4e6ef';
    }
  };

  const getProjectTypeIcon = (type?: string) => {
    switch (type) {
      case 'Logo Design': return 'ki-abstract-26';
      case 'Label Design': return 'ki-tag';
      case 'Poly Bag Design': return 'ki-purchase';
      case 'Paper Bag Design': return 'ki-basket';
      case 'Flier': return 'ki-document';
      case 'Banner': return 'ki-flag';
      default: return 'ki-design';
    }
  };

  const columns: { status: DesignStatus; title: string }[] = [
    { status: 'Incomplete Information', title: 'Incomplete Info' },
    { status: 'Unreachable', title: 'Unreachable' },
    { status: 'Design', title: 'Design' },
    { status: 'Revision', title: 'Revision' },
    { status: 'Production', title: 'Production' },
    { status: 'Final Handoff', title: 'Final Handoff' },
  ];

  const getDesignsByStatus = (status: DesignStatus): DesignDraft[] => {
    return designs.filter(design => {
      const designStatus = design.fields['Status'] || 'Design';
      const matchesStatus = designStatus === status;

      if (!searchTerm) {
        return matchesStatus;
      }

      const name = design.fields['Name'];
      const customerName = design.fields['Customer Name'];
      const designName = design.fields['Design Name'];

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (typeof name === 'string' && name.toLowerCase().includes(searchLower)) ||
        (typeof customerName === 'string' && customerName.toLowerCase().includes(searchLower)) ||
        (typeof designName === 'string' && designName.toLowerCase().includes(searchLower));

      return matchesStatus && matchesSearch;
    });
  };

  const getStatusCount = (status: DesignStatus): number => {
    return getDesignsByStatus(status).length;
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

  // Detail view when a design is selected
  if (selectedDesign) {
    // Calculate revisions used based on which revision fields have content
    const hasRev1 = selectedDesign.fields['Revision 1'] && Array.isArray(selectedDesign.fields['Revision 1']) && selectedDesign.fields['Revision 1'].length > 0;
    const hasRev2 = selectedDesign.fields['Revision 2'] && Array.isArray(selectedDesign.fields['Revision 2']) && selectedDesign.fields['Revision 2'].length > 0;
    const hasRev3 = selectedDesign.fields['Revision 3'] && Array.isArray(selectedDesign.fields['Revision 3']) && selectedDesign.fields['Revision 3'].length > 0;

    const revisionsUsed = (hasRev1 ? 1 : 0) + (hasRev2 ? 1 : 0) + (hasRev3 ? 1 : 0);
    const totalRevisions = 3;
    const revisionsLeft = totalRevisions - revisionsUsed;

    return (
      <>
        {/* Feedback Alert */}
        {isFeedbackVisible && (
          <div
            className={`alert alert-${feedback.type === 'success' ? 'success' : feedback.type === 'info' ? 'primary' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-5`}
            style={{ zIndex: 9999, minWidth: '300px' }}
          >
            {feedback.message}
          </div>
        )}

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
            <p>Are you sure you want to delete <strong>{selectedDesign?.fields['Name'] || 'this design'}</strong>? This action cannot be undone.</p>
          </div>
        </Modal>

        {/* File Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={selectedFile?.filename || 'File Preview'}
          size="lg"
          footer={
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-light" onClick={() => setIsPreviewModalOpen(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.open(selectedFile?.url, '_blank')}>Download</button>
            </div>
          }
        >
          <div className="text-center">
            {selectedFile?.url && (
              <img
                src={selectedFile.url}
                alt={selectedFile.filename}
                className="img-fluid rounded border shadow-sm"
                style={{ maxHeight: '70vh' }}
              />
            )}
          </div>
        </Modal>

        <div className="card">
          <div className="card-header border-0 pt-6">
            <div className="card-title">
              <button className="btn btn-sm btn-light-primary" onClick={handleBackToList}>
                <i className="ki-duotone ki-arrow-left fs-3">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Back to List
              </button>
            </div>
            <div className="card-toolbar d-flex flex-column align-items-end">
              <button className="btn btn-sm btn-danger mb-2" onClick={handleDeleteDesign}>
                <i className="ki-duotone ki-trash fs-3">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                  <span className="path5"></span>
                </i>
                Delete Design
              </button>
              <h2 className="fw-bold">{selectedDesign.fields['Name'] || 'Design Details'}</h2>
            </div>
          </div>

          <div className="card-body p-5">

            {/* Order Link */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Order Link</h3>
              <div className="fs-6">
                {selectedDesign.fields['Order Number'] ? (
                  <a href={`https://track.packglamour.com/#ORD-${selectedDesign.fields['Order Number']}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                    https://track.packglamour.com/#ORD-{selectedDesign.fields['Order Number']}
                  </a>
                ) : (
                  selectedDesign.fields['Order Link'] ? (
                    <a href={selectedDesign.fields['Order Link']} target="_blank" rel="noopener noreferrer" className="text-primary">
                      {selectedDesign.fields['Order Link']}
                    </a>
                  ) : 'N/A'
                )}
              </div>
            </div>

            {/* Total Available Revisions */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Total Available Revisions</h3>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Revisions Left</div>
                    <div className="fw-bold fs-5">{revisionsLeft}</div>
                    <div className="text-muted fs-8 mt-1">Format: Number</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Order Details</h3>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Project Type</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Project Type'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Order Information</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Order Number'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Customer Name</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Customer Name'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Phone Number</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Phone Number'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Status</div>
                    <div><span className={`badge ${getStatusBadgeClass(selectedDesign.fields['Status'])}`}>{selectedDesign.fields['Status'] || 'Design'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Project Information */}
            <div className="mb-8">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Summary Project Information</h3>
                {selectedDesign.fields['Phone Number'] && (
                  <button
                    className="btn btn-sm btn-success ms-2"
                    onClick={() => handleSendWhatsApp(selectedDesign.fields['Phone Number'])}
                    title="Send WhatsApp Alert"
                  >
                    <i className="ki-duotone ki-whatsapp fs-3 me-1">
                      <span className="path1"></span>
                      <span className="path2"></span>
                    </i>
                    Send whatsapp alert
                  </button>
                )}
              </div>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Product Name</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Name'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Preferred Colors</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Color'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Product Weight/Volume</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Weight/Volume'] || 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Ingredients</div>
                    <div className="fw-bold fs-6" dangerouslySetInnerHTML={{ __html: formatTextWithLineBreaks(selectedDesign.fields['Ingredients']) }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Files Uploaded */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Customer Files Uploaded</h3>
              <div className="bg-light p-4 rounded">
                {renderFilesWithUpload(selectedDesign.fields['Files Uploaded'], 'Files Uploaded', 'Files')}
              </div>
            </div>

            {/* Initial Design Drafts */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Initial Design Drafts</h3>
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-2">Designs</div>
                    {renderFilesWithUpload(selectedDesign.fields['Design Draft 1'], 'Design Draft 1', 'Design Files')}
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Project File Link</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Project File Link'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Feedback - Rev 1.1 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Customer Feedback - Rev 1.1</h3>
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-2">Customer Revisions</div>
                    {renderFilesWithUpload(selectedDesign.fields['Annotated Design Rev 1'], 'Annotated Design Rev 1', 'Annotated Files')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Total Comments</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Total Comments Rev 1'] || 'N/A'}</div>
                    <div className="text-muted fs-8 mt-1">Format: Integer</div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Feedback Created On</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Created Rev 1'] ? new Date(selectedDesign.fields['Feedback Created Rev 1']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Revision Details</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Rev 1'] || selectedDesign.fields['Revision 1 Notes'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Draft v 1.1 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Design Draft v 1.1</h3>
              <div className="bg-light p-4 rounded">
                <div className="text-muted fs-7 mb-2">Design</div>
                {renderFilesWithUpload(selectedDesign.fields['Revision 1'], 'Revision 1', 'Design Files')}
              </div>
            </div>

            {/* Customer Feedback v1.2 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Customer Feedback v1.2</h3>
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-2">Customer Revisions</div>
                    {renderFilesWithUpload(selectedDesign.fields['Annotated Design Rev 2'], 'Annotated Design Rev 2', 'Annotated Files')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Total Comments</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Total Comments Rev 2'] || 'N/A'}</div>
                    <div className="text-muted fs-8 mt-1">Format: Integer</div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Feedback Created On</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Created Rev 2'] ? new Date(selectedDesign.fields['Feedback Created Rev 2']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Revision Details</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Rev 2'] || selectedDesign.fields['Revision 2 Notes'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design Draft v 1.2 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Design Draft v 1.2</h3>
              <div className="bg-light p-4 rounded">
                <div className="text-muted fs-7 mb-2">Design</div>
                {renderFilesWithUpload(selectedDesign.fields['Revision 2'], 'Revision 2', 'Design Files')}
              </div>
            </div>

            {/* Revision v1.3 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Revision v1.3</h3>
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-2">Customer Revisions</div>
                    {renderFilesWithUpload(selectedDesign.fields['Annotated Design Rev 3'], 'Annotated Design Rev 3', 'Annotated Files')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Total Comments</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Total Comments Rev 3'] || 'N/A'}</div>
                    <div className="text-muted fs-8 mt-1">Format: Integer</div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Feedback Created On</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Created Rev 3'] ? new Date(selectedDesign.fields['Feedback Created Rev 3']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Revision Details</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Rev 3'] || selectedDesign.fields['Revision 3 Notes'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Design Draft v1.3 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Final Design Draft v1.3</h3>
              <div className="bg-light p-4 rounded">
                <div className="text-muted fs-7 mb-2">Design</div>
                {renderFilesWithUpload(selectedDesign.fields['Revision 3'], 'Revision 3', 'Design Files')}
              </div>
            </div>

            {/* Revision 1.4 */}
            <div className="mb-8">
              <h3 className="fw-bold mb-4">Revision 1.4</h3>
              <div className="row g-4">
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-2">Customer Revisions</div>
                    {renderFilesWithUpload(selectedDesign.fields['Annotated Design Rev 4'], 'Annotated Design Rev 4', 'Annotated Files')}
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Total Comments</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Total Comments Rev 4'] || 'N/A'}</div>
                    <div className="text-muted fs-8 mt-1">Format: Integer</div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Feedback Created On</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Created Rev 4'] ? new Date(selectedDesign.fields['Feedback Created Rev 4']).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Revision Details</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Feedback Rev 4'] || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Update Info */}
            <div className="mb-8">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Project Updated by</div>
                    <div className="fw-bold fs-6">{getTeamMemberName(selectedDesign.fields['Created by'])}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="bg-light p-4 rounded">
                    <div className="text-muted fs-7 mb-1">Last Update Sent On</div>
                    <div className="fw-bold fs-6">{selectedDesign.fields['Latest Update'] ? new Date(selectedDesign.fields['Latest Update']).toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </>
    );
  }

  // Kanban board view
  return (
    <>
      {/* Feedback Alert */}
      {isFeedbackVisible && (
        <div
          className={`alert alert-${feedback.type === 'success' ? 'success' : feedback.type === 'info' ? 'primary' : 'danger'} position-fixed top-0 start-50 translate-middle-x mt-5`}
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
                className="form-control form-control-solid w-300px ps-13"
                placeholder="Search designs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-toolbar">
            <div className="d-flex justify-content-end align-items-center gap-3">
              <button className="btn btn-sm btn-light" onClick={loadData}>
                <i className="ki-duotone ki-arrows-circle fs-2">
                  <span className="path1"></span>
                  <span className="path2"></span>
                </i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card-body py-4">
          <div className="d-flex gap-5 overflow-auto pb-5" style={{ minHeight: '600px' }}>
            {columns.map(({ status, title }) => {
              const columnDesigns = getDesignsByStatus(status);
              const count = getStatusCount(status);

              return (
                <div key={status} className="flex-shrink-0" style={{ width: '320px' }}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle me-2"
                          style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: getColumnColor(status),
                          }}
                        ></div>
                        <h3 className="fs-5 fw-bold mb-0">{title}</h3>
                      </div>
                      <span className="badge badge-light-primary">{count}</span>
                    </div>
                    <div className="separator separator-dashed mb-4"></div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {columnDesigns.map((design) => {
                      // Calculate actual revisions left
                      const hasRev1 = design.fields['Revision 1'] && Array.isArray(design.fields['Revision 1']) && design.fields['Revision 1'].length > 0;
                      const hasRev2 = design.fields['Revision 2'] && Array.isArray(design.fields['Revision 2']) && design.fields['Revision 2'].length > 0;
                      const hasRev3 = design.fields['Revision 3'] && Array.isArray(design.fields['Revision 3']) && design.fields['Revision 3'].length > 0;
                      const revisionsUsed = (hasRev1 ? 1 : 0) + (hasRev2 ? 1 : 0) + (hasRev3 ? 1 : 0);
                      const revisionsLeft = 3 - revisionsUsed;

                      return (
                        <div
                          key={design.id}
                          className="card card-flush cursor-pointer hover-elevate-up"
                          onClick={() => handleCardClick(design)}
                          style={{ transition: 'all 0.2s ease' }}
                        >
                          <div className="card-body p-5">
                            <div className="mb-3">
                              <h4 className="fs-6 fw-bold text-gray-800 mb-1">
                                {design.fields['Name'] || 'Untitled Design'}
                              </h4>
                              {design.fields['Design Name'] && (
                                <span className="text-muted fs-7">{design.fields['Design Name']}</span>
                              )}
                            </div>

                            <div className="mb-3">
                              <div className="d-flex align-items-center">
                                <i className={`ki-duotone ${getProjectTypeIcon(design.fields['Project Type'])} fs-4 text-gray-500 me-2`}>
                                  <span className="path1"></span>
                                  <span className="path2"></span>
                                </i>
                                <span className="text-gray-700 fs-7">
                                  {design.fields['Project Type'] || 'N/A'}
                                </span>
                              </div>
                            </div>

                            {design.fields['Customer Name'] && (
                              <div className="mb-3">
                                <div className="d-flex align-items-center">
                                  <i className="ki-duotone ki-user fs-4 text-gray-500 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                  </i>
                                  <span className="text-gray-700 fs-7">
                                    {design.fields['Customer Name']}
                                  </span>
                                </div>
                              </div>
                            )}

                            {design.fields['Order Number'] && (
                              <div className="mb-3">
                                <div className="d-flex align-items-center">
                                  <i className="ki-duotone ki-barcode fs-4 text-gray-500 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                    <span className="path6"></span>
                                    <span className="path7"></span>
                                    <span className="path8"></span>
                                  </i>
                                  <span className="text-gray-700 fs-7">
                                    {design.fields['Order Number']}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="separator separator-dashed my-3"></div>

                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-gray-600 fs-7">Revisions</span>
                              <span className={`badge ${revisionsLeft === 0 ? 'badge-danger' : revisionsLeft === 1 ? 'badge-warning' : 'badge-success'}`}>
                                {revisionsLeft} left
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {columnDesigns.length === 0 && (
                      <div className="text-center py-10 text-muted">
                        No designs in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-5">
            <div className="text-gray-600">
              Total: {designs.length} design{designs.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
