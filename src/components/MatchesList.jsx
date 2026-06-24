import React from 'react'

const MatchScoreBadge = ({ score }) => {
  let bgColor = 'bg-red-50 text-red-700'
  if (score >= 80) {
    bgColor = 'bg-green-50 text-green-700'
  } else if (score >= 60) {
    bgColor = 'bg-blue-50 text-blue-700'
  }

  return (
    <div
      className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-sm ${bgColor}`}
    >
      {score}%
    </div>
  )
}

export default function MatchesList({ matches }) {
  if (matches.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">No job matches found yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div
          key={match.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {match.jobs?.title || 'Position'}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {match.jobs?.company || 'Company'}
              </p>
              {match.jobs?.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {match.jobs.description}
                </p>
              )}
            </div>
            <MatchScoreBadge score={Math.round(match.match_score)} />
          </div>
        </div>
      ))}
    </div>
  )
}