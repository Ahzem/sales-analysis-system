import requests
import logging
import os

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')

logger = logging.getLogger("CakeBuddy")

def fetch_urls():
    """Fetch all file URLs from backend API and return them"""
    try:
        response = requests.get(f'{BACKEND_URL}/api/urls')
        
        if response.status_code == 200:
            data = response.json()
            urls = data.get('urls', [])
            return urls
        else:
            logger.error(f"Error: Received status code {response.status_code}")
            logger.error(response.text)
            return []
            
    except Exception as e:
        logger.error(f"Error fetching URLs: {e}")
        return []

def get_file_url_by_id(file_id):
    """Get a specific file URL by its ID"""
    try:
        response = requests.get(f'http://localhost:5000/api/url/{file_id}')
        
        if response.status_code == 200:
            data = response.json()
            url = data.get('url')
            logger.info(f"Found URL for file ID {file_id}: {url}")
            return url
        else:
            logger.error(f"Error: Received status code {response.status_code} when fetching file ID {file_id}")
            logger.error(response.text)
            return None
            
    except Exception as e:
        logger.error(f"Error fetching URL for file ID {file_id}: {e}")
        return None

# Default function that gets the first URL (for backward compatibility)
def get_csv_url(file_id=None):
    """
    Get a CSV file URL:
    - If file_id is provided, get that specific file URL
    - Otherwise, get the first URL from the list
    """
    if file_id:
        url = get_file_url_by_id(file_id)
        if url:
            return url
        # Fall back to first URL if file_id doesn't exist
        logger.warning(f"File ID {file_id} not found, falling back to first available URL")
    
    urls = fetch_urls()
    if urls and len(urls) > 0:
        return urls[0]
    return None

if __name__ == "__main__":
    # Example of accessing the URL as a variable
    csv_url = get_csv_url()
    if csv_url:
        print(f"{csv_url}")