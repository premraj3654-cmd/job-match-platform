import React, { useEffect, useState, useCallback } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { triggerResumeProcessing } from './lib/n8n'
import UploadZone from './components/UploadZone'
import ResumeList from './components/ResumeList'
import MatchesList from './components/MatchesList'
import Header from './components/Header'
import LoginPage from './components/LoginPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState([])
  const [selectedResume, setSelectedResume] = useState(null)
  const [matches, setMatches] = useState([])
  const [finalResume, setFinalResume] = useState(null)
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [resumesLoading, setResumesLoading] = useState(false)

  // Check initial session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) {
          setUser(data.session.user)
          await fetchResumes(data.session.user.id)
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchResumes(session.user.id)
      } else {
        setUser(null)
        setResumes([])
        setSelectedResume(null)
        setMatches([])
        setFinalResume(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Subscribe to real-time resume updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('resume-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resumes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedResume = payload.new

          // Update the resume in the list
          setResumes((prev) =>
            prev.map((r) => (r.id === updatedResume.id ? updatedResume : r))
          )

          // If the selected resume was updated
          if (selectedResume?.id === updatedResume.id) {
            setSelectedResume(updatedResume)

            // If status changed to completed, refetch matches and final resume
            if (updatedResume.status === 'completed') {
              toast.success('Resume processing completed!')
              fetchMatches(updatedResume.id)
              fetchFinalResume(updatedResume.id)
            } else if (updatedResume.status === 'failed') {
              toast.error('Resume processing failed. Please try again.')
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, selectedResume])

  const fetchResumes = useCallback(async (userId) => {
    setResumesLoading(true)
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResumes(data || [])
    } catch (error) {
      console.error('Error fetching resumes:', error)
      toast.error('Failed to load resumes')
    } finally {
      setResumesLoading(false)
    }
  }, [])

  const fetchMatches = useCallback(async (resumeId) => {
    setMatchesLoading(true)
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          resume_id,
          job_id,
          match_score,
          created_at,
          jobs (
            id,
            title,
            company,
            description
          )
        `)
        .eq('resume_id', resumeId)
        .order('match_score', { ascending: false })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load job matches')
    } finally {
      setMatchesLoading(false)
    }
  }, [])

  const fetchFinalResume = useCallback(async (resumeId) => {
    try {
      const { data, error } = await supabase
        .from('final_resumes')
        .select('*')
        .eq('resume_id', resumeId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setFinalResume(data)
      } else {
        setFinalResume(null)
      }
    } catch (error) {
      console.error('Error fetching final resume:', error)
      setFinalResume(null)
    }
  }, [])

  const handleResumeSelect = useCallback(
    (resume) => {
      setSelectedResume(resume)
      if (resume.status === 'completed') {
        fetchMatches(resume.id)
        fetchFinalResume(resume.id)
      } else {
        setMatches([])
        setFinalResume(null)
      }
    },
    [fetchMatches, fetchFinalResume]
  )

  const handleUpload = useCallback(
    async (file) => {
      if (!user) {
        toast.error('Please log in first')
        return
      }

      try {
        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `${user.id}/${timestamp}-${file.name}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(`uploads/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(`uploads/${fileName}`)

        const fileUrl = urlData.publicUrl

        // Insert resume record into database
        const { data: resumeData, error: dbError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_url: fileUrl,
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()

        if (dbError) throw dbError

        const resumeId = resumeData[0].id

        // Trigger n8n webhook for processing
        const webhookResult = await triggerResumeProcessing(
          resumeId,
          user.id,
          fileUrl
        )

        if (webhookResult.success) {
          toast.success('Resume uploaded! Processing has started.')
          await fetchResumes(user.id)
        } else {
          toast.error('Resume uploaded but processing failed to start.')
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error(error.message || 'Failed to upload resume')
      }
    },
    [user, fetchResumes]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex flex-col w-full h-screen bg-gray-50">
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Upload & History */}
        <div className="w-2/5 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Resume
            </h2>
            <UploadZone onUpload={handleUpload} />

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
              Upload History
            </h2>
            {resumesLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
              </div>
            ) : (
              <ResumeList
                resumes={resumes}
                selectedResume={selectedResume}
                onSelectResume={handleResumeSelect}
              />
            )}
          </div>
        </div>

        {/* Right Column - Results & PDF Generator */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {selectedResume ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedResume.file_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Uploaded on{' '}
                    {new Date(selectedResume.created_at).toLocaleDateString()}
                  </p>
                </div>

                {selectedResume.status === 'pending' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-blue-400 rounded-full animate-spin border-t-blue-600 mr-3"></div>
                      <p className="text-blue-900">
                        Your resume is being processed...
                      </p>
                    </div>
                  </div>
                ) : selectedResume.status === 'failed' ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <p className="text-red-900 font-medium">
                      Processing failed. Please try uploading again.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Matches Section */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Job Matches
                      </h3>
                      {matchesLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-blue-600"></div>
                        </div>
                      ) : matches.length > 0 ? (
                        <MatchesList matches={matches} />
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                          <p className="text-gray-600">
                            No job matches found yet.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Final Resume Section */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Generated Resume
                      </h3>
                      {finalResume ? (
                        <a
                          href={finalResume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
                            />
                          </svg>
                          Download PDF
                        </a>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-600 font-medium rounded-lg cursor-not-allowed"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
                            />
                          </svg>
                          Generate
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg">Select a resume to view results</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}