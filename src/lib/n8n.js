import axios from 'axios'

const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

if (!n8nWebhookUrl) {
  console.warn('Warning: n8n webhook URL is not configured. Resume processing will not be triggered.')
}

/**
 * Trigger resume processing via n8n webhook
 * @param {string} resumeId - The ID of the resume in the database
 * @param {string} userId - The ID of the user
 * @param {string} fileUrl - The public URL of the uploaded resume PDF
 * @returns {Promise<Object>} Response from the n8n webhook
 */
export const triggerResumeProcessing = async (resumeId, userId, fileUrl) => {
  try {
    if (!n8nWebhookUrl) {
      throw new Error('n8n webhook URL is not configured')
    }

    const response = await axios.post(n8nWebhookUrl, {
      resumeId,
      userId,
      fileUrl,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Error triggering resume processing:', error)
    return {
      success: false,
      error: error.message || 'Failed to trigger resume processing',
    }
  }
}