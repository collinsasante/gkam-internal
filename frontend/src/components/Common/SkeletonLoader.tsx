import React from 'react';

interface SkeletonLoaderProps {
  type?: 'table' | 'kanban' | 'card' | 'list';
  count?: number;
}

export default function SkeletonLoader({ type = 'list', count = 5 }: SkeletonLoaderProps) {
  if (type === 'kanban') {
    return (
      <div className="d-flex gap-4">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="flex-fill" style={{ minWidth: '250px' }}>
            <div className="card">
              <div className="card-header" style={{ height: '50px', backgroundColor: '#f8f9fa' }}>
                <div style={{
                  height: '20px',
                  width: '40%',
                  backgroundColor: '#dee2e6',
                  borderRadius: '4px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </div>
              <div className="card-body">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="mb-3 p-3" style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${item * 0.1}s`
                  }}>
                    <div style={{
                      height: '16px',
                      width: '80%',
                      backgroundColor: '#dee2e6',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }} />
                    <div style={{
                      height: '12px',
                      width: '60%',
                      backgroundColor: '#dee2e6',
                      borderRadius: '4px'
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {[1, 2, 3, 4, 5].map((col) => (
                <th key={col}>
                  <div style={{
                    height: '16px',
                    width: '80%',
                    backgroundColor: '#dee2e6',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }).map((_, idx) => (
              <tr key={idx}>
                {[1, 2, 3, 4, 5].map((col) => (
                  <td key={col}>
                    <div style={{
                      height: '14px',
                      width: '70%',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${(idx + col) * 0.05}s`
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="row g-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="col-md-4">
            <div className="card" style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${idx * 0.1}s` }}>
              <div className="card-body">
                <div style={{
                  height: '20px',
                  width: '60%',
                  backgroundColor: '#dee2e6',
                  borderRadius: '4px',
                  marginBottom: '12px'
                }} />
                <div style={{
                  height: '16px',
                  width: '80%',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }} />
                <div style={{
                  height: '16px',
                  width: '70%',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>
        ))}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Default: list
  return (
    <div>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="mb-3 p-3" style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${idx * 0.1}s`
        }}>
          <div style={{
            height: '18px',
            width: '40%',
            backgroundColor: '#dee2e6',
            borderRadius: '4px',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '14px',
            width: '80%',
            backgroundColor: '#dee2e6',
            borderRadius: '4px'
          }} />
        </div>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
