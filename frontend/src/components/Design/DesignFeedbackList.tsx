import { useState, useEffect, useRef } from 'react';
import { designFeedbackService } from '../../services/airtable.service';
import type { DesignFeedback } from '../../types/airtable.types';

declare const $: any;
declare const Swal: any;

export default function DesignFeedbackList() {
  const [feedback, setFeedback] = useState<DesignFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const dataTableRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && feedback.length > 0 && tableRef.current && !dataTableRef.current) {
      initializeDataTable();
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [loading, feedback]);

  const initializeDataTable = () => {
    if (!tableRef.current || typeof $ === 'undefined') return;

    try {
      dataTableRef.current = $(tableRef.current).DataTable({
        info: false,
        order: [[3, 'desc']], // Sort by Total Comments descending
        columnDefs: [
          { orderable: false, targets: '_all' },
        ],
        pageLength: 10,
        language: {
          search: '',
          searchPlaceholder: 'Search feedback...',
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
      const feedbackData = await designFeedbackService.getAll();
      setFeedback(feedbackData);
      setError(null);
    } catch (err) {
      setError('Failed to load design feedback');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (feedbackItem: DesignFeedback) => {
    if (typeof Swal === 'undefined') return;

    const annotatedDesigns = feedbackItem.fields['Annotated Design'] || [];
    const designImages = annotatedDesigns.map((file) =>
      `<div class="mb-3">
        <img src="${file.url}" alt="${file.filename}" style="max-width: 100%; border-radius: 8px; margin-bottom: 10px;" />
        <p class="text-muted fs-7">${file.filename}</p>
      </div>`
    ).join('');

    Swal.fire({
      title: `Feedback from ${feedbackItem.fields['Customer']}`,
      html: `
        <div class="text-start" style="max-height: 600px; overflow-y: auto;">
          <div class="mb-4">
            <p><strong>Order ID:</strong> ${feedbackItem.fields['Order ID'] || 'N/A'}</p>
            <p><strong>Total Comments:</strong> <span class="badge badge-primary">${feedbackItem.fields['Total Comments'] || 0}</span></p>
          </div>

          ${feedbackItem.fields['Feedback'] ? `
            <div class="alert alert-info">
              <strong>Feedback:</strong><br/>
              <p class="mb-0">${feedbackItem.fields['Feedback']}</p>
            </div>
          ` : ''}

          ${designImages ? `
            <div class="mt-4">
              <h6>Annotated Designs:</h6>
              ${designImages}
            </div>
          ` : '<p class="text-muted">No annotated designs attached</p>'}

          <div class="mt-4">
            <p><strong>Related Design Drafts:</strong> ${
              (feedbackItem.fields['Related Design Drafts']?.length || 0) +
              (feedbackItem.fields['Design Drafts 2']?.length || 0) +
              (feedbackItem.fields['Design Drafts 3']?.length || 0) +
              (feedbackItem.fields['Design Drafts 4']?.length || 0)
            }</p>
          </div>
        </div>
      `,
      width: 900,
      confirmButtonText: 'Close',
    });
  };

  const getTotalDesignDrafts = (feedbackItem: DesignFeedback) => {
    return (
      (feedbackItem.fields['Related Design Drafts']?.length || 0) +
      (feedbackItem.fields['Design Drafts 2']?.length || 0) +
      (feedbackItem.fields['Design Drafts 3']?.length || 0) +
      (feedbackItem.fields['Design Drafts 4']?.length || 0)
    );
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
              placeholder="Search feedback..."
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
              Total Feedback: {feedback.length}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        <table className="table align-middle table-row-dashed fs-6 gy-5" ref={tableRef}>
          <thead>
            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
              <th className="min-w-150px">Customer</th>
              <th className="min-w-100px">Order ID</th>
              <th className="min-w-300px">Feedback</th>
              <th className="min-w-100px">Comments</th>
              <th className="min-w-100px">Attachments</th>
              <th className="min-w-100px">Design Drafts</th>
              <th className="text-end min-w-100px">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 fw-semibold">
            {feedback.map((feedbackItem) => {
              const totalDesignDrafts = getTotalDesignDrafts(feedbackItem);
              const hasAttachments = feedbackItem.fields['Annotated Design'] && feedbackItem.fields['Annotated Design'].length > 0;

              return (
                <tr key={feedbackItem.id}>
                  <td>
                    <span className="text-gray-800 fw-bold">
                      {feedbackItem.fields['Customer'] || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-800">
                      {feedbackItem.fields['Order ID'] || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="text-gray-800" style={{ maxWidth: '300px' }}>
                      {feedbackItem.fields['Feedback'] && typeof feedbackItem.fields['Feedback'] === 'string' ? (
                        feedbackItem.fields['Feedback'].length > 100
                          ? `${feedbackItem.fields['Feedback'].substring(0, 100)}...`
                          : feedbackItem.fields['Feedback']
                      ) : (
                        <span className="text-muted">No feedback provided</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${(feedbackItem.fields['Total Comments'] || 0) > 0 ? 'badge-primary' : 'badge-light'}`}>
                      {feedbackItem.fields['Total Comments'] || 0}
                    </span>
                  </td>
                  <td>
                    {hasAttachments ? (
                      <span className="badge badge-success">
                        {feedbackItem.fields['Annotated Design']!.length} file(s)
                      </span>
                    ) : (
                      <span className="text-muted">None</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${totalDesignDrafts > 0 ? 'badge-info' : 'badge-light'}`}>
                      {totalDesignDrafts} draft(s)
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-light btn-active-light-primary"
                      onClick={() => handleViewDetails(feedbackItem)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
