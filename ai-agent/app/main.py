import json
import os
from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.googlesearch import GoogleSearch
from phi.agent.duckdb import DuckDbAgent
from app.api.get_csv_url import get_csv_url
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.WARNING)

# Simple chatbot for greetings and basic interactions
basic_chat = Agent(
    name="Sales Assistant",
    role="Handle basic greetings and non-analytical questions",
    model=OpenAIChat(model="gpt-4o"),
    instructions=[
        "You are a friendly sales analysis assistant named SalesBot",
        "Keep responses short, friendly and personable",
        "For greetings, introduce yourself as SalesBot, the sales analytics assistant",
        "For simple questions, provide brief, helpful responses",
        "If unsure, suggest asking about sales metrics or analytics"
    ],
    add_history_to_messages=True,
    num_history_responses=10,
    markdown=True
)

# Modify the data analysis agent
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
        "Analyze sales data comprehensively",
        "Always calculate and provide the following key metrics in your analysis:",
        "- Total Sales Revenue = Sum of all invoice totals",
        "- Total Number of Sales = Count of invoices",
        "- Average Order Value (AOV) = Total Sales Revenue / Total Number of Sales",
        "- Sales Growth Rate = (Current Period Sales - Previous Period Sales) / Previous Period Sales",
        "- Top & Low-Selling Products by both revenue and quantity",
        "- Profit Per Product calculations where possible",
        "- Customer retention rates and purchase frequency",
        "- Seasonal sales patterns with month/quarter breakdowns",
        "- Impact of discounts on revenue and purchase behavior",
        "Include visual-friendly formatting for data presentation",
        "Provide sales forecasts based on historical trends",
        "NEVER INCLUDE ANY SQL QUERIES IN YOUR RESPONSES",
        "DO NOT MENTION SQL OR QUERY SYNTAX AT ALL",
        "Provide actionable insights for improving sales and profitability",
        "Focus on data-driven recommendations for the business",
    ],
    add_history_to_messages=True,
    num_history_responses=10,
    markdown=True,
    show_sql=False,
)

# Modify the web search agent
web_agent = Agent(
    name="Web Agent",
    role="Search the web for market trends",
    model=OpenAIChat(id="gpt-4o"),
    tools=[GoogleSearch()],
    instructions=[
        "Always include sources and dates in responses",
        "Focus on industry trends, market forecasts, and consumer preferences",
        "Provide specific, actionable insights for business improvement"
    ],
    add_history_to_messages=True,
    num_history_responses=10,
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

def analysis_handler(user_input):
    """Handle cake shop analysis requests"""
    response = data_analyst.run(user_input)
    return extract_response_content(response)

def web_search_handler(user_input):
    """Handle web search requests"""
    response = web_agent.run(user_input)
    return extract_response_content(response)

def handle_user_input(user_input):
    """Route user input to the appropriate handler"""
    # Simple greeting detection
    greeting_phrases = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "howdy"]
    
    # Check if this is a simple greeting
    if any(phrase in user_input.lower() for phrase in greeting_phrases) or len(user_input.strip().split()) < 3:
        return greeting_handler(user_input)
    
    # Check for analytics keywords
    analytics_keywords = [
        "sales", "revenue", "product", "customer", "profit", "trend", 
        "analysis", "data", "performance", "forecast", "recommend",
        "metrics", "growth", "inventory", "orders", "returns"
    ]
    
    if any(keyword in user_input.lower() for keyword in analytics_keywords):
        return analysis_handler(user_input)
    
    # Check for web search keywords
    web_keywords = [
        "market", "industry", "trends", "popular", "future", 
        "consumer", "preference", "competitor", "benchmark",
        "forecast", "outlook", "demand"
    ]
    
    if any(keyword in user_input.lower() for keyword in web_keywords):
        return web_search_handler(user_input)
    
    # Default to basic chat for everything else
    return greeting_handler(user_input)

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    clear_screen()
    print("======== CakeBuddy: Your Cake Shop Analytics Assistant =======")
    print("Ask me anything about your cake shop's performance or just say hello!")
    print("Type 'exit' to quit.\n")
    
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() in ['exit', 'quit', 'bye']:
            print("\nThank you for using CakeBuddy. Goodbye!")
            break
        
        if not user_input:
            continue
        
        try:
            # Get response and post-process it
            response_text = handle_user_input(user_input)
            
            # Remove SQL queries from the response
            response_text = remove_sql_queries(response_text)
            
            # Format data as tables when appropriate
            response_text = format_as_tables(response_text)
            
            print("\n🤖 CakeBuddy: " + response_text + "\n")
        except Exception as e:
            print(f"\nI encountered an error while processing your request: {str(e)}")
            fallback = "I'm having trouble with that question. Could you try asking something else about the cake shop?"
            print("\n🤖 CakeBuddy: " + fallback + "\n")
        
        print("-" * 120)

def remove_sql_queries(text):
    """Remove SQL query blocks from the response text"""
    import re
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
    import re
    
    # Look for numbered list patterns that might be better as tables
    product_list_pattern = r'(\d+)\.\s+\*\*(.*?)\*\*\s*-\s*(.+?):\s*([\d,.]+)(.*?)(?=\d+\.\s+\*\*|\Z)'
    
    # Check if there's a pattern match for product lists with metrics
    if re.search(product_list_pattern, text, re.DOTALL):
        # Extract product data
        matches = re.findall(product_list_pattern, text, re.DOTALL)
        
        if matches and len(matches) >= 3:  # Only convert to table if we have enough items
            # Replace the list with a table
            table_header = "\n| # | Product | Metric | Value |\n|---|---------|--------|-------|\n"
            table_rows = ""
            
            for match in matches:
                num, product, metric_type, value, extra = match
                # Clean up the metric type
                metric_type = metric_type.strip(': ')
                
                # Add the main row
                table_rows += f"| {num} | {product} | {metric_type} | {value} |\n"
                
                # Check for additional metrics in the extra text
                extra_metrics = re.findall(r'(.*?):\s*([\d,.]+)', extra)
                for extra_metric, extra_value in extra_metrics:
                    table_rows += f"|  | {product} | {extra_metric.strip()} | {extra_value} |\n"
            
            # Find where the list starts and ends
            list_start = text.find(f"1. **")
            if list_start >= 0:
                list_end = len(text)
                for i in range(len(matches)):
                    if i < len(matches) - 1:
                        next_item = f"{i+2}. **"
                        next_pos = text.find(next_item, list_start)
                        if next_pos > 0:
                            list_start = next_pos
                    else:
                        # For the last item, find where it ends
                        last_item_start = text.find(f"{i+1}. **", list_start)
                        if last_item_start > 0:
                            # Find the next paragraph or end of text
                            paragraph_end = text.find("\n\n", last_item_start)
                            if paragraph_end > 0:
                                list_end = paragraph_end
                
                # Replace the list with the table
                text = text[:list_start] + table_header + table_rows + text[list_end:]
    
    return text
if __name__ == "__main__":
    main()