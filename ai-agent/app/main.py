from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.googlesearch import GoogleSearch
from phi.agent.duckdb import DuckDbAgent
from app.api.get_csv_url import get_csv_url
from dotenv import load_dotenv
import logging
import sys
import json
import re
import os

load_dotenv()

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[logging.StreamHandler(sys.stdout)])

logger = logging.getLogger("SalesAnalyst")

# Simple chatbot for greetings and basic interactions
basic_chat = Agent(
    name="Sales Analysis Assistant",
    role="Handle basic greetings and non-analytical questions",
    model=OpenAIChat(model="gpt-4o"),
    instructions=[
        "You are a friendly sales data analysis assistant named SalesAnalyst",
        "Keep responses short, friendly and personable",
        "For greetings, introduce yourself as SalesAnalyst, the sales analytics assistant",
        "For simple questions, provide brief, helpful responses",
        "If unsure, suggest asking about sales data or analytics",
        "If user uploads a new file, remind them about required fields for sales analysis:",
        "- Order/Transaction ID",
        "- Product name/ID",
        "- Order date/timestamp",
        "- Quantity sold",
        "- Unit price",
        "- Total amount",
        "- Optional but useful: customer information, region/location, payment method, etc."
    ],
    markdown=True
)

# Data analysis agent
data_analyst = DuckDbAgent(
    model=OpenAIChat(model="gpt-4o"),
    semantic_model=json.dumps(
        {
            "tables": [
                {
                    "name": "sales_data",
                    "description": "Contains detailed sales data including product information, order dates, quantities, prices, customer information, and total invoice amounts",
                    "path": get_csv_url(),
                }
            ]
        }
    ),
    instructions=[
        "You are an AI-powered sales analytics system that analyzes sales data comprehensively",
        "When generating performance reports, always include these key sections:",
        
        "EXECUTIVE SUMMARY:",
        "- Provide a concise 2-3 sentence overview highlighting the most significant findings",
        "- Compare overall performance to previous periods (month-over-month and year-over-year)",
        "- Include one critical recommendation based on the data",
        
        "1. Sales Performance Metrics:",
        "   - Total Sales Revenue = Sum of all invoice totals",
        "   - Total Number of Sales = Count of invoices",
        "   - Average Order Value (AOV) = Total Sales Revenue / Total Number of Sales",
        "   - Sales Growth Rate = (Current Period Sales - Previous Period Sales) / Previous Period Sales",
        
        "2. Product Performance & Profitability:",
        "   - Top 5 Selling Products by both revenue and quantity",
        "   - Bottom 5 Selling Products by both revenue and quantity",
        "   - Profit Per Product where possible",
        "   - Total Profit across all products",
        
        "3. Customer Insights:",
        "   - Top 5 Customers by Revenue (if customer data is available)",
        "   - Customer Retention Rate = Percentage of repeat customers",
        "   - Average Purchase Frequency = Total Orders / Unique Customers",
        "   - Customer Lifetime Value (CLV) = (Average Order Value × Purchase Frequency × Retention Rate)",
        
        "4. Inventory & Stock Analysis:",
        "   - Most Profitable Products = Products with the highest total profit",
        "   - Slow-Moving Inventory = Products with low sales over a period",
        "   - Stock Turnover analysis where possible",
        
        "5. Seasonal Trends & Forecasting:",
        "   - Monthly/Quarterly Sales Trends with clear identification of peak periods",
        "   - Demand Forecasting for upcoming months based on historical trends",
        "   - Price Sensitivity Analysis where possible",
        
        "6. Discount & Pricing Effectiveness:",
        "   - Impact of Discounts on Sales = Comparing sales before and after discounts",
        "   - Best-Performing Discount Strategies",
        "   - Markdown Loss analysis if data permits",
        
        "7. Performance Comparison:",
        "   - Compare with previous month (month-over-month)",
        "   - Compare with same month last year (year-over-year)",
        "   - Highlight significant changes (>10% change)",
        
        "8. Strategic Recommendations:",
        "   - Provide 3-5 specific, actionable recommendations based on the data",
        "   - Prioritize recommendations with highest potential impact",
        "   - Include expected outcomes for each recommendation",
        
        "Always provide precise numerical answers with calculations explained",
        "Use visual-friendly formatting like tables and lists for data presentation",
        "Ensure all percentages are properly calculated and clearly labeled",
        "When answering specific questions, focus on the requested metric but include related insights",
        "For forecasting, use time series analysis techniques and explain your methodology",
        "Use consistent number formatting (e.g., '$1,234.56' for currency)",
        
        "NEVER INCLUDE ANY SQL QUERIES IN YOUR RESPONSES",
        "DO NOT MENTION SQL OR QUERY SYNTAX AT ALL",
        "Present all findings as if they came from direct data analysis without mentioning database operations",
        
        "If certain data is missing (like cost data for profit calculations), clearly state this limitation",
        "Identify common data fields automatically and adjust your analysis based on available columns",
        "Adapt terminology to match the dataset (e.g., 'products' vs 'services', 'customers' vs 'clients')"
    ],
    markdown=True,
    show_sql=False,
)

# Web search agent for market trends
web_agent = Agent(
    name="Web Agent",
    role="Search the web for market trends related to sales data",
    model=OpenAIChat(id="gpt-4o"),
    tools=[GoogleSearch()],
    instructions=[
        "Always include sources and dates in responses",
        "Focus on industry trends, market forecasts, and consumer preferences",
        "Provide specific, actionable insights for business optimization"
    ],
    show_tool_calls=True,
    markdown=True,
)

def extract_response_content(response):
    """Extract the actual text content from a phi agent response"""
    if hasattr(response, 'content'):
        return response.content
    elif hasattr(response, 'messages'):
        # Find the last assistant message
        for msg in reversed(response.messages):
            if msg.role == 'assistant' and msg.content:
                return msg.content
    # Default fallback
    return str(response)

def greeting_handler(user_input):
    """Handle greetings and simple questions"""
    response = basic_chat.run(user_input)
    return extract_response_content(response)

def format_analysis_response(response_text):
    """Enhance and format the analysis response for better presentation"""
    import re
    
    # Format percentages consistently (ensure % symbol is attached)
    response_text = re.sub(r'(\d+\.?\d*)\s+%', r'\1%', response_text)
    
    # Emphasize key metrics for visibility
    response_text = re.sub(r'(Total Sales Revenue|Average Order Value|Sales Growth Rate|Total Profit|Customer Retention Rate):', r'**\1**:', response_text)
    
    # Format section headings for reports
    response_text = re.sub(r'EXECUTIVE SUMMARY:', r'## EXECUTIVE SUMMARY', response_text)
    response_text = re.sub(r'(\d+\.\s+)([\w\s&]+:)', r'### \1\2', response_text)
    response_text = re.sub(r'(Strategic Recommendations:)', r'### \1', response_text)
    
    # Add section dividers for long responses
    if len(response_text) > 500:
        if "Product Performance" in response_text and "---" not in response_text:
            response_text = response_text.replace("Product Performance", "\n---\n### Product Performance", 1)
        if "Customer Insights" in response_text and "---" not in response_text:
            response_text = response_text.replace("Customer Insights", "\n---\n### Customer Insights", 1)
        if "Strategic Recommendations" in response_text and "---" not in response_text:
            response_text = response_text.replace("Strategic Recommendations", "\n---\n### Strategic Recommendations", 1)
    
    return response_text

def analysis_handler(user_input):
    """Handle cake shop analysis requests with enhanced error handling"""
    try:
        response = data_analyst.run(user_input)
        response_text = extract_response_content(response)
        # Apply formatting enhancements
        response_text = format_analysis_response(response_text)
        return response_text
    except Exception as e:
        logger.error(f"Analysis handler error: {str(e)}", exc_info=True)
        # Provide a more specific error based on the query type
        if "profit margin" in user_input.lower():
            return "I'm sorry, I couldn't calculate the profit margins you requested. Our system might not have the cost data needed for this analysis."
        elif "forecast" in user_input.lower() or "predict" in user_input.lower():
            return "I'm sorry, I couldn't generate the forecast you requested. This might require more historical data than is currently available."
        elif "customer" in user_input.lower():
            return "I'm sorry, I couldn't retrieve the customer data you requested. Our customer information might be limited in the current dataset."
        else:
            return "I'm sorry, I encountered an error while analyzing that data. Could you try asking a different question about our sales or products?"

def web_search_handler(user_input):
    """Handle web search requests"""
    response = web_agent.run(user_input)
    return extract_response_content(response)

def handle_user_input(user_input, csv_url=None):
    """Route user input to the appropriate handler"""
    # Simple greeting detection
    greeting_phrases = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "howdy"]
    user_input_lower = user_input.lower()
    
    # Print debug info
    logger.info(f"Processing user input: '{user_input}'")
    
    # First check if this is a simple greeting BEFORE loading any CSV data
    is_greeting = any(phrase in user_input_lower for phrase in greeting_phrases)
    is_short = len(user_input.strip().split()) < 3
    
    # Check if this is a new file upload notification
    is_file_upload = "upload" in user_input_lower or "new file" in user_input_lower or "csv file" in user_input_lower
    
    if is_file_upload:
        logger.info("Detected file upload notification, providing file requirements info")
        return greeting_handler("Welcome! For best results with the sales analysis, your CSV file should include these fields:\n\n" + 
                               "**Required Fields:**\n" +
                               "- **Order/Transaction ID**: Unique identifier for each transaction\n" +
                               "- **Product Name or ID**: What was sold\n" +
                               "- **Date/Timestamp**: When the sale occurred\n" +
                               "- **Quantity**: Number of units sold\n" +
                               "- **Unit Price**: Price per unit\n" +
                               "- **Total Amount**: Total sale value\n\n" +
                               "**Recommended Additional Fields:**\n" +
                               "- **Customer ID/Name**: Who purchased (for customer analytics)\n" +
                               "- **Region/Location**: Where the sale occurred\n" +
                               "- **Category/Department**: Product grouping\n" +
                               "- **Cost**: Unit cost (for profit analysis)\n" +
                               "- **Discount**: Any applied discounts\n\n" +
                               "Don't worry if your file doesn't have all these fields - I'll work with what you have!")
    
    if is_greeting and is_short:
        logger.info(f"Routing to greeting handler: is_greeting={is_greeting}, is_short={is_short}")
        return greeting_handler(user_input)
    
    # Only get the CSV URL if we're actually going to analyze data
    if not csv_url:
        csv_url = get_csv_url()
    logger.info(f"Current CSV URL: {csv_url}")

    # Create a dynamic data analyst agent with the specific CSV URL
    if csv_url:
        data_analyst_instance = create_data_analyst_agent(csv_url)
        # Use this instance for analysis
        return analysis_with_agent(user_input, data_analyst_instance)
    else:
        logger.error("No CSV URL available. Cannot perform analysis.")
        return greeting_handler("I'm sorry, I don't have access to any data files at the moment. Please upload a CSV file first. For best analysis results, your CSV should include fields like order ID, product name, order date, quantity, price, and total amount.")

def create_data_analyst_agent(csv_url):
    """Create a new data analyst agent with the specified CSV URL"""
    return DuckDbAgent(
        model=OpenAIChat(model="gpt-4o"),
        semantic_model=json.dumps(
            {
                "tables": [
                    {
                        "name": "sales_data",
                        "description": "Contains detailed sales data including product information, order dates, quantities, prices, customer information, and total invoice amounts",
                        "path": csv_url,
                    }
                ]
            }
        ),
        instructions=[
            "You are an AI-powered sales analytics system that analyzes sales data comprehensively",
            "When generating performance reports, always include these key sections:",
            
            "EXECUTIVE SUMMARY:",
            "- Provide a concise 2-3 sentence overview highlighting the most significant findings",
            "- Compare overall performance to previous periods (month-over-month and year-over-year)",
            "- Include one critical recommendation based on the data",
            
            "1. Sales Performance Metrics:",
            "   - Total Sales Revenue = Sum of all invoice totals",
            "   - Total Number of Sales = Count of invoices/orders",
            "   - Average Order Value (AOV) = Total Sales Revenue / Total Number of Sales",
            "   - Sales Growth Rate = (Current Period Sales - Previous Period Sales) / Previous Period Sales",
            
            "2. Product Performance & Profitability:",
            "   - Top 5 Selling Products by both revenue and quantity",
            "   - Bottom 5 Selling Products by both revenue and quantity",
            "   - Profit Per Product where possible (if cost data is available)",
            "   - Total Profit across all products (if cost data is available)",
            
            "3. Customer Insights (if customer data is available):",
            "   - Top 5 Customers by Revenue",
            "   - Customer Retention Rate = Percentage of repeat customers",
            "   - Average Purchase Frequency = Total Orders / Unique Customers",
            "   - Customer Lifetime Value (CLV) = (Average Order Value × Purchase Frequency × Retention Rate)",
            
            "4. Inventory & Stock Analysis:",
            "   - Most Profitable Products = Products with the highest total profit",
            "   - Slow-Moving Inventory = Products with low sales over a period",
            "   - Stock Turnover analysis where possible",
            
            "5. Seasonal Trends & Forecasting:",
            "   - Monthly/Quarterly Sales Trends with clear identification of peak periods",
            "   - Demand Forecasting for upcoming months based on historical trends",
            "   - Price Sensitivity Analysis where possible",
            
            "6. Discount & Pricing Effectiveness (if discount data is available):",
            "   - Impact of Discounts on Sales = Comparing sales before and after discounts",
            "   - Best-Performing Discount Strategies",
            "   - Markdown Loss analysis if data permits",
            
            "7. Performance Comparison:",
            "   - Compare with previous month (month-over-month)",
            "   - Compare with same month last year (year-over-year)",
            "   - Highlight significant changes (>10% change)",
            
            "8. Strategic Recommendations:",
            "   - Provide 3-5 specific, actionable recommendations based on the data",
            "   - Prioritize recommendations with highest potential impact",
            "   - Include expected outcomes for each recommendation",
            
            "Always provide precise numerical answers with calculations explained",
            "Use visual-friendly formatting like tables and lists for data presentation",
            "Ensure all percentages are properly calculated and clearly labeled",
            "When answering specific questions, focus on the requested metric but include related insights",
            "For forecasting, use time series analysis techniques and explain your methodology",
            "Use consistent number formatting (e.g., '$1,234.56' for currency)",
            
            "NEVER INCLUDE ANY SQL QUERIES IN YOUR RESPONSES",
            "DO NOT MENTION SQL OR QUERY SYNTAX AT ALL",
            "Present all findings as if they came from direct data analysis without mentioning database operations",
            
            "First identify and interpret the data schema to understand the available columns",
            "Adapt your analysis based on available data fields - skip sections that aren't applicable",
            "When certain data is missing for calculations, clearly explain the limitation",
            "Use appropriate terminology matching the data (products vs services, customers vs clients, etc.)"
        ],
        markdown=True,
        show_sql=False,
    )
    
def analysis_with_agent(user_input, agent):
    """Handle sales data analysis requests with enhanced error handling using the provided agent"""
    try:
        response = agent.run(user_input)
        response_text = extract_response_content(response)
        # Apply formatting enhancements
        response_text = format_analysis_response(response_text)
        return response_text
    except Exception as e:
        logger.error(f"Analysis handler error: {str(e)}", exc_info=True)
        # Provide a more specific error based on the query type
        if "profit margin" in user_input.lower():
            return "I'm sorry, I couldn't calculate the profit margins you requested. This might be because the dataset doesn't include cost information needed for profit calculations."
        elif "forecast" in user_input.lower() or "predict" in user_input.lower():
            return "I'm sorry, I couldn't generate the forecast you requested. This might require more historical data than is currently available in your dataset."
        elif "customer" in user_input.lower():
            return "I'm sorry, I couldn't retrieve the customer data you requested. Your dataset might not contain sufficient customer information for this analysis."
        else:
            return "I'm sorry, I encountered an error while analyzing that data. This might be due to missing fields in your dataset or an unsupported query type. Could you try asking a different question about your sales?"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    clear_screen()
    print("======== Sales Data Analyst: Your Business Analytics Assistant =======")
    print("Ask me anything about your sales performance or just say hello!")
    print("Type 'exit' to quit.\n")
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nThank you for using Sales Data Analyst. Goodbye!")
            break
        
        if not user_input:
            continue
        
        try:
            response = handle_user_input(user_input)
            print("\nSales Analyst:", response)
        except Exception as e:
            print(f"\nSorry, I encountered an error: {str(e)}")
        
        print("-" * 120)

def remove_sql_queries(text):
    """Remove SQL query blocks from the response text"""
    # Remove code blocks with SQL
    text = re.sub(r'```sql[\s\S]*?```', '', text)
    
    # Remove references to SQL queries
    text = re.sub(r'Here is the SQL query used.*', '', text)
    text = re.sub(r'The SQL query.*', '', text)
    text = re.sub(r'Using the following SQL.*', '', text)
    
    # Clean up any double newlines created
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    
    return text

def format_as_tables(text):
    """Format lists of data as markdown tables when appropriate"""
    
    # Look for numbered list patterns that might be better as tables
    product_list_pattern = r'(\d+)\.\s+\*\*(.*?)\*\*\s*-\s*(.+?):\s*([\d,.]+)(.*?)(?=\d+\.\s+\*\*|\Z)'
    
    # Check if there's a pattern match for product lists with metrics
    if re.search(product_list_pattern, text, re.DOTALL):
        # Extract product data
        matches = re.findall(product_list_pattern, text, re.DOTALL)
        
        if matches and len(matches) >= 3:
            # Enough data to create a table
            pass  # Implementation details omitted for brevity
    
    return text

if __name__ == "__main__":
    main()