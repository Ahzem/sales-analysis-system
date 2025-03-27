# Sales Analysis System

A full-stack web application that allows users to upload sales data files (CSV) and analyze them using AI-powered insights.

## System Architecture

The project is built with a three-tier architecture:

1. **Frontend**: React application for file uploads and interactive chat interface
2. **Backend**: Node.js REST API for file management and storage
3. **AI Agent**: Python FastAPI service for data analysis and AI-powered insights

![Architecture Diagram](https://via.placeholder.com/800x400?text=Sales+Analysis+System+Architecture)

## Features

- **File Management**
  - Upload CSV sales data files
  - Store files securely in Amazon S3
  - Manage file history and metadata
  - Delete uploaded files

- **AI-Powered Analysis**
  - Interactive chat interface for natural language data queries
  - Comprehensive sales metrics and KPIs
  - Product performance insights
  - Customer segmentation
  - Seasonal trends and forecasting
  - Strategic recommendations based on data analysis

- **User Experience**
  - Intuitive drag-and-drop upload interface
  - Persistent chat history for each file
  - Responsive design for desktop and mobile
  - Suggested queries for quick insights

## Technologies

### Frontend
- React 19
- Vite
- React Dropzone
- React Markdown
- Axios for API communication

### Backend
- Node.js with Express
- MongoDB for metadata storage
- AWS S3 for file storage
- Winston for logging

### AI Agent
- Python with FastAPI
- DuckDB for CSV data analysis
- OpenAI integration
- Phi Data framework for agent capabilities
- Google Search API for market research

## Getting Started

### Prerequisites
- Node.js 18 or higher
- Python 3.12
- MongoDB
- AWS account with S3 bucket
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ahzem/sales-analysis-system.git
   cd sales-analysis-system
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in each directory (frontend, backend, ai-agent)
   - Configure the following:
     - MongoDB connection string
     - AWS S3 credentials
     - OpenAI API key

3. Install dependencies:

   **Backend:**
   ```bash
   cd backend
   npm install
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

   **AI Agent:**
   ```bash
   cd ai-agent
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the AI agent:
   ```bash
   cd ai-agent
   python run_api.py
   ```

3. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Docker Deployment

You can also run the entire application using Docker Compose:

```bash
docker-compose up
```

This will start all three services (frontend, backend, and AI agent) as well as a MongoDB container.

## Using the Application

1. **Upload a CSV file**:
   - Drag and drop a CSV file or click to select
   - The file should contain sales data with columns like order ID, product name, date, quantity, price, etc.

2. **Analyze your data**:
   - After upload, you'll be redirected to the chat interface
   - Ask questions about your sales data in natural language
   - Use suggested queries for common analyses
   - View responses with formatted tables and insights

3. **Manage your files**:
   - Access your upload history on the main page
   - Continue previous chats or start new analyses
   - Delete files when no longer needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
