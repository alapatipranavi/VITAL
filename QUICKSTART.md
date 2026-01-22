# VitalSense Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### Step 2: Configure Environment

The `.env` file in the `server` directory is already configured with your API keys. If you need to modify it, edit `server/.env`.

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:3000`

### Step 4: Use the Application

1. Open `http://localhost:3000` in your browser
2. Register a new account
3. Upload a lab report (PDF or image)
4. View extracted biomarkers and insights

## 📋 Features Available

✅ **Authentication** - Register/Login with JWT
✅ **Report Upload** - Upload PDF or image lab reports
✅ **Biomarker Extraction** - AI-powered extraction using Gemini Vision
✅ **Abnormal Detection** - Automatic flagging of high/low values
✅ **RAG Insights** - Contextual explanations via Pinecone
✅ **Personalized Recommendations** - Diet and lifestyle suggestions
✅ **Trend Analysis** - Visualize biomarker changes over time
✅ **Doctor Summary** - Concise medical summary

## 🧪 Testing with Sample Data

1. **Create Account**: Register with email and password
2. **Update Profile** (optional): Add age, gender, diet preference
3. **Upload Report**: Use a clear PDF or image of a lab report
4. **View Results**: Check biomarker details, trends, and summary

## ⚠️ Important Notes

- **Medical Disclaimer**: This is for informational purposes only. Always consult a doctor.
- **File Size**: Maximum upload size is 10MB
- **Supported Formats**: PDF, JPEG, PNG, GIF
- **Pinecone**: Currently uses sample context data. For production, set up proper embeddings.

## 🔧 Troubleshooting

**Backend won't start:**
- Check MongoDB connection string
- Verify all API keys in `.env`
- Ensure port 5000 is available

**Frontend won't start:**
- Check if backend is running
- Verify Node.js version (v18+)
- Clear `node_modules` and reinstall

**Upload fails:**
- Check file format (PDF or image)
- Verify file size (< 10MB)
- Check server logs for errors

## 📚 Next Steps

- Review `SETUP.md` for detailed configuration
- Check `README.md` for architecture overview
- Customize Pinecone embeddings for production use
- Add more biomarker context data

## 🎯 Production Deployment

1. Set `NODE_ENV=production`
2. Use secure JWT secrets
3. Enable HTTPS
4. Set up proper error logging
5. Configure rate limiting
6. Use production MongoDB instance

---

**Ready to go!** Start both servers and begin using VitalSense.

