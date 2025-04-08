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
    allow_origins=["*"],
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
        "message": "Sales Analyst API is running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": ["/chat"]
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request: {request.message}")
        
        # Check if it's a simple greeting first to avoid loading CSV
        greeting_phrases = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "howdy"]
        message_lower = request.message.lower()
        is_greeting = any(phrase in message_lower for phrase in greeting_phrases)
        is_short = len(request.message.strip().split()) < 3
        
        # Check if it's a new file notification
        is_new_file = "upload" in message_lower or "new file" in message_lower or "uploaded" in message_lower
        
        # For greetings or file notifications, don't even bother with the file ID and CSV URL
        if (is_greeting and is_short) or is_new_file:
            logger.info("Detected simple greeting or file upload notification, bypassing CSV loading")
            response_text = handle_user_input(request.message, None)
        else:
            # Only load the CSV URL if this is not a simple greeting
            if request.fileId:
                logger.info(f"Using file ID: {request.fileId}")
                csv_url = get_csv_url(request.fileId)
            else:
                logger.info("No file ID provided, using default CSV file")
                csv_url = get_csv_url()
                
            logger.info(f"Using CSV URL: {csv_url}")
            
            # Process the message using the AI agent
            response_text = handle_user_input(request.message, csv_url)
        
        # Always clean up the response
        response_text = remove_sql_queries(response_text)
        
        logger.info(f"Generated response: {response_text[:100]}...")
        
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