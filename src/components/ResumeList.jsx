import React from 'react'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      dot: 'bg-yellow-500',
      label: 'Processing...',
    },
    completed: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      dot: 'bg-green-500',
      label: 'Completed',
    },
    failed: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      dot: 'bg-red-500',
      label: 'Failed',
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <div className={`flex items-center gap-2 px-3 py-1 border rounded-full ${config.bg} ${config.border}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  )
}

export default function ResumeList({
  resumes,
  selectedResume,
  onSelectResume,
}) {
  if (resumes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">No resumes uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {resumes.map((resume) => (
        <button
          key={resume.id}
          onClick={() => onSelectResume(resume)}
          className={`w-full text-left p-3 rounded-lg border transition ${
            selectedResume?.id === resume.id
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {resume.file_name}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(resume.created_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={resume.status} />
          </div>
        </button>
      ))}
    </div>
  )
}