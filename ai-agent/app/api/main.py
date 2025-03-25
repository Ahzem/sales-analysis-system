from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
        
        # Process the message using the AI agent
        response_text = handle_user_input(request.message)
        
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