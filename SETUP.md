# VitalSense Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key
- Pinecone API key

## Installation Steps

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=vitalsense
JWT_SECRET=your_jwt_secret_key_here
```

Start the backend server:

```bash
npm run dev
```

The server will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
cd client
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Pinecone Index Setup

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create a new index named `vitalsense`
3. Use dimension 1536 (or appropriate for your embedding model)
4. Use cosine similarity metric

**Note:** The current implementation uses sample context data. To fully utilize Pinecone:

1. Prepare your biomarker and nutrition data
2. Generate embeddings for each document
3. Upsert embeddings to Pinecone with metadata
4. Update the `queryRAG` function to use actual vector queries

### 4. Testing the Application

1. Register a new account
2. Upload a lab report (PDF or image)
3. View extracted biomarkers
4. Check trends and summaries

## Project Structure

```
VITAL/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── contexts/   # React contexts
│   │   └── styles/     # CSS files
│   └── package.json
├── server/             # Express backend
│   ├── routes/        # API routes
│   ├── controllers/   # Route handlers
│   ├── services/      # Business logic
│   ├── models/        # Mongoose models
│   ├── middleware/    # Auth & validation
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Reports
- `POST /api/reports/upload` - Upload lab report
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get report by ID
- `DELETE /api/reports/:id` - Delete report

### Biomarkers
- `GET /api/biomarkers/details?testName=&reportId=` - Get biomarker details
- `GET /api/biomarkers/abnormal` - Get all abnormal biomarkers

### Trends
- `GET /api/trends` - Get all trends
- `GET /api/trends/:testName` - Get trend for specific biomarker
- `GET /api/trends/summary/doctor` - Get doctor-ready summary

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**
   - Verify your `MONGO_URI` is correct
   - Check if your IP is whitelisted in MongoDB Atlas

2. **Gemini API Error**
   - Verify your API key is correct
   - Check API quota limits

3. **File Upload Error**
   - Ensure `server/temp` directory exists
   - Check file size limits (10MB)

### Frontend Issues

1. **CORS Errors**
   - Ensure backend CORS is configured
   - Check proxy settings in `vite.config.js`

2. **API Connection Errors**
   - Verify backend is running on port 5000
   - Check network tab in browser dev tools

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Build frontend: `cd client && npm run build`
3. Serve frontend build files (e.g., using Express static middleware)
4. Use environment variables for all secrets
5. Enable HTTPS
6. Set up proper error logging and monitoring

## Security Notes

- Never commit `.env` files
- Use strong JWT secrets
- Implement rate limiting in production
- Validate all user inputs
- Sanitize file uploads
- Use HTTPS in production

## Medical Disclaimer

**This application is for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.**

