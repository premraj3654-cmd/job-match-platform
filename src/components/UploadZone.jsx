import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function UploadZone({ onUpload }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === 'application/pdf'
      )

      if (pdfFiles.length === 0) {
        alert('Please upload only PDF files')
        return
      }

      pdfFiles.forEach((file) => {
        onUpload(file)
      })
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />

      <svg
        className="w-12 h-12 mx-auto mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      {isDragActive ? (
        <div>
          <p className="text-base font-semibold text-blue-600">
            Drop your resume here
          </p>
          <p className="text-sm text-blue-500 mt-1">
            Your PDF will be uploaded
          </p>
        </div>
      ) : (
        <div>
          <p className="text-base font-semibold text-gray-700 mb-1">
            Drag and drop your resume
          </p>
          <p className="text-sm text-gray-600">
            or click to browse your files
          </p>
          <p className="text-xs text-gray-500 mt-2">PDF files only</p>
        </div>
      )}
    </div>
  )
}