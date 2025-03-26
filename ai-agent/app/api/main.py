from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.get_csv_url import get_csv_url
from pydantic import BaseModel
import os
import sys
import logging

# Add parent directory to path so we can import modules
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import the AI agent functions
from app.main import handle_user_input, remove_sql_queries

app = FastAPI(title="CakeBuddy API", description="API for the Cake Shop Analytics AI Assistant")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    csvFilename: str = None
    fileId: str = None

class ChatResponse(BaseModel):
    response: str
    

@app.get("/")
async def root():
    return {
        "message": "CakeBuddy API is running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": ["/chat"]
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.message}")
        
        # Log the file ID if provided
        if request.fileId:
            logger.info(f"Using file ID: {request.fileId}")
            csv_url = get_csv_url(request.fileId)
        else:
            logger.info("No file ID provided, using default CSV file")
            csv_url = get_csv_url()
            
        logger.info(f"Using CSV URL: {csv_url}")
        
        # Process the message using the AI agent
        response_text = handle_user_input(request.message, csv_url)
        
        # Make sure to filter any SQL queries that might have slipped through
        response_text = remove_sql_queries(response_text)
        
        logger.info(f"Generated response: {response_text[:100]}...")  # Log first 100 chars
        
        return ChatResponse(response=response_text)
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing your request: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}