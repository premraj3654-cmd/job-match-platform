# JobMatch AI - Smart Resume Matching Platform

A production-ready React frontend for the JobMatch AI platform that matches resumes with job opportunities using AI-powered processing.

## Features

- 🔐 **Secure Authentication** - Magic link email authentication via Supabase
- 📄 **Resume Upload** - Drag-and-drop PDF resume uploads with real-time processing
- 🤖 **AI-Powered Matching** - n8n webhook integration for intelligent resume processing
- 📊 **Job Matches** - View matched jobs with match scores
- 📋 **Resume Generation** - Download AI-optimized resumes
- 🔄 **Real-time Updates** - Supabase real-time subscriptions for live status updates
- 📱 **Responsive Design** - Modern SaaS-like dashboard interface

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool for fast development
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend services and authentication
- **n8n** - Workflow automation and processing
- **React Dropzone** - File upload handling
- **React Hot Toast** - Toast notifications
- **Axios** - HTTP client for API calls

## Project Structure

```
src/
├── App.jsx                 # Main app component with core logic
├── index.css              # Tailwind CSS imports
├── main.jsx               # React entry point
├── lib/
│   ├── supabase.js        # Supabase client initialization
│   └── n8n.js             # n8n webhook integration
└── components/
    ├── Header.jsx         # Header with logout
    ├── LoginPage.jsx      # Magic link login
    ├── UploadZone.jsx     # Drag-and-drop upload
    ├── ResumeList.jsx     # Resume history list
    └── MatchesList.jsx    # Job matches display
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase project
- n8n instance with webhook configured

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/process-resume
```

3. **Start the development server:**

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Build for Production

```bash
npm run build
npm run preview
```

## Supabase Setup

### Required Tables

1. **resumes** table:
   - id (UUID, primary key)
   - user_id (UUID, foreign key)
   - file_name (text)
   - file_url (text)
   - status (text: 'pending', 'completed', 'failed')
   - created_at (timestamp)

2. **matches** table:
   - id (UUID, primary key)
   - resume_id (UUID, foreign key)
   - job_id (UUID, foreign key)
   - match_score (numeric)
   - created_at (timestamp)

3. **jobs** table:
   - id (UUID, primary key)
   - title (text)
   - company (text)
   - description (text)

4. **final_resumes** table:
   - id (UUID, primary key)
   - resume_id (UUID, foreign key)
   - file_url (text)
   - created_at (timestamp)

### Storage Bucket

Create a storage bucket named `resumes` with public access for the uploads folder.

### Row Level Security (RLS)

Enable RLS on all tables and configure policies to allow users to access only their own data:

```sql
-- Example policy for resumes table
CREATE POLICY "Users can view own resumes" 
  ON resumes FOR SELECT 
  USING (auth.uid() = user_id);
```

## n8n Webhook Integration

The app sends resume processing requests to your n8n webhook with:

```json
{
  "resumeId": "uuid",
  "userId": "uuid",
  "fileUrl": "https://...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Your n8n workflow should:
1. Process the resume PDF
2. Extract skills and experience
3. Match against job database
4. Update the `resumes` table status to 'completed'
5. Create records in the `matches` table
6. Generate optimized resume and upload to `final_resumes` table

## Usage

### Login

1. Enter your email address
2. Click "Send Magic Link"
3. Check your email and click the authentication link
4. You'll be redirected to the dashboard

### Upload Resume

1. Drag and drop a PDF resume or click to browse
2. The app uploads to Supabase Storage
3. n8n webhook is triggered for processing
4. Monitor status in the Upload History panel

### View Matches

1. Select a resume from the history (must be in 'completed' status)
2. View matched jobs in the right panel with match scores
3. Download the generated AI-optimized resume

## Error Handling

- Upload failures show clear error messages
- Network errors are caught and reported
- Real-time subscription failures fall back gracefully
- Missing environment variables are detected on startup

## Performance Optimizations

- Lazy loading of match data
- Real-time updates only when needed
- Efficient Supabase queries with relationship loading
- Tailwind CSS purging for production

## License

MIT

## Support

For issues and questions, please open an issue in the repository.