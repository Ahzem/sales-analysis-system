import json
import os
import sys
from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.googlesearch import GoogleSearch
from phi.agent.duckdb import DuckDbAgent
from app.api.get_csv_url import get_csv_url
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                   handlers=[logging.StreamHandler(sys.stdout)])

logger = logging.getLogger("CakeBuddy")

# Simple chatbot for greetings and basic interactions
basic_chat = Agent(
    name="Cake Shop Assistant",
    role="Handle basic greetings and non-analytical questions",
    model=OpenAIChat(model="gpt-4o"),
    instructions=[
        "You are a friendly cake shop assistant named CakeBuddy",
        "Keep responses short, friendly and personable",
        "For greetings, introduce yourself as CakeBuddy, the cake shop analytics assistant",
        "For simple questions, provide brief, helpful responses",
        "If unsure, suggest asking about cake shop sales or analytics"
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
                    "description": "Contains detailed sales data for a cake shop including product names, order dates, quantities, prices, customer information, and total invoice amounts",
                    "path": get_csv_url(),
                }
            ]
        }
    ),
    instructions=[
        "You are CakeBuddy's AI-powered analytics system that analyzes cake shop sales data comprehensively",
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
    ],
    markdown=True,
    show_sql=False,
)

# Web search agent for bakery trends
web_agent = Agent(
    name="Web Agent",
    role="Search the web for bakery and cake market trends",
    model=OpenAIChat(id="gpt-4o"),
    tools=[GoogleSearch()],
    instructions=[
        "Always include sources and dates in responses",
        "Focus on bakery industry trends, cake market forecasts, and consumer preferences",
        "Provide specific, actionable insights for a cake shop business"
    ],
    show_tool_calls=True,
    markdown=True,
)

team_agent = Agent(
    name="Team Agent",
    team=[basic_chat, data_analyst, web_agent],
    role="Coordinate responses from multiple agents",
    model=OpenAIChat(model="gpt-4o"),
    instructions=[
        "You are the team coordinator for CakeBuddy's AI agents",
        "Manage responses from multiple specialized team members:",
        "1. Basic chat agent - For greetings and simple questions",
        "2. Data analyst agent - For detailed analytics and reports on cake shop data",
        "3. Web search agent - For market trends and external information",
        
        "For each user query, determine which team member(s) are best suited to respond",
        "When coordinating responses, consider:",
        "- For data questions, use the data analyst first",
        "- For market trends or competitor info, use the web search agent",
        "- For simple interactions, use the basic chat agent",
        "- For complex queries, combine insights from multiple team members",
        
        "Always maintain continuity with previous conversation history",
        "Reference previous exchanges when relevant to provide context",
        "For follow-up questions, connect to earlier responses",
        
        "When providing analytical insights:",
        "- Highlight key metrics with clear formatting",
        "- Present data in well-organized sections",
        "- Include actionable recommendations based on data",
        
        "Keep the final response conversational but informative",
        "Aim to provide comprehensive but concise answers"
    ],
    add_history_to_messages=True,
    num_history_responses=15,
    markdown=True
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
    
    # Ensure all currency values have dollar signs
    def add_dollar_sign(match):
        value = match.group(1)
        # Only add $ if it doesn't already have one
        if not value.strip().startswith('$'):
            return f"${value}"
        return value
    
    # Add dollar signs to currency values (matches numbers with decimal points not preceded by $)
    # response_text = re.sub(r'(\d{1,3}(?:,\d{3})*\.\d{2})', add_dollar_sign, response_text)
    
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
    if not csv_url:
        csv_url = get_csv_url()
    logger.info(f"Current CSV URL: {csv_url}")
    
    # Check if this is a simple greeting
    is_greeting = any(phrase in user_input_lower for phrase in greeting_phrases)
    is_short = len(user_input.strip().split()) < 3
    
    if is_greeting and is_short:
        logger.info(f"Routing to greeting handler: is_greeting={is_greeting}, is_short={is_short}")
        return greeting_handler(user_input)

    # Create a dynamic data analyst agent with the specific CSV URL
    if csv_url:
        data_analyst_instance = create_data_analyst_agent(csv_url)
        # Use this instance for analysis
        return analysis_with_agent(user_input, data_analyst_instance)
    else:
        logger.error("No CSV URL available. Cannot perform analysis.")
        return greeting_handler("I'm sorry, I don't have access to any data files at the moment. Please upload a CSV file first.")

    # Check for report generation requests first - these are high priority
    # report_keywords = ["report", "detailed", "performance", "analysis", "analytics", "statistics", "metrics", "kpi", "dashboard"]
    # time_period_keywords = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", 
    #                        "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
    #                        "2025", "2024", "2023", "q1", "q2", "q3", "q4", "quarter", "monthly", "annual", "yearly"]
    
    # has_report_keyword = any(keyword in user_input_lower for keyword in report_keywords)
    # has_time_period = any(period in user_input_lower for period in time_period_keywords)
    
    # # Direct routing for report requests
    # if has_report_keyword and has_time_period:
    #     logger.info(f"Detected report request with time period, routing to analysis handler")
    #     try:
    #         return analysis_handler(user_input)
    #     except Exception as e:
    #         logger.error(f"Error in analysis_handler for report: {str(e)}")
    #         return "I'm sorry, I couldn't generate the requested report. There might be an issue with accessing the data for the specified time period."
    
    
    # # Expanded analytics keywords organized by category
    # analytics_keywords = {
    #     "sales": ["sales", "revenue", "income", "turnover", "earnings", "growth", "decline", "increase", "decrease"],
    #     "products": ["cake", "cakes", "product", "best-selling", "best selling", "top", "lowest", "highest", "popular", "unpopular"],
    #     "metrics": ["profit", "margin", "percentage", "ratio", "average", "mean", "total", "sum", "count", "number"],
    #     "time": ["month", "year", "quarter", "seasonal", "season", "period", "trend", "forecast", "predict", "projection", "2026"],
    #     "customer": ["customer", "buyer", "consumer", "client", "retention", "repeat", "frequency", "lifetime", "loyal", "churn"],
    #     "inventory": ["inventory", "stock", "supply", "turnover", "slow-moving", "excess", "shortage"],
    #     "pricing": ["price", "pricing", "discount", "markdown", "promotion", "deal", "offer", "sale", "reduction"]
    # }
    
    # # Expanded priority combinations
    # priority_combinations = [
    #     # Product analysis combinations
    #     ("cake", "highest"), ("cake", "top"), ("cake", "profit"), ("cake", "margin"),
    #     ("cake", "revenue"), ("cake", "sales"), ("cake", "popular"), ("cake", "best"),
        
    #     # Time-based analysis
    #     ("monthly", "trends"), ("quarterly", "performance"), ("year", "comparison"),
    #     ("seasonal", "pattern"), ("forecast", "2026"),
        
    #     # Customer analysis
    #     ("customer", "retention"), ("customer", "lifetime"), ("customer", "frequent"),
        
    #     # Discount analysis
    #     ("discount", "impact"), ("discount", "effectiveness"), ("price", "sensitivity")
    # ]
    
    # # Check for priority combinations
    # for combo in priority_combinations:
    #     if all(term in user_input_lower for term in combo):
    #         logger.info(f"Priority routing to analysis handler: matched combination={combo}")
    #         try:
    #             return analysis_handler(user_input)
    #         except Exception as e:
    #             logger.error(f"Error in analysis_handler: {str(e)}")
    #             return greeting_handler(f"I couldn't analyze that data about {combo[0]} {combo[1]}. Our system might not have that specific information.")
    
    # # Flattened list of all analytics keywords
    # all_analytics_keywords = [word for category in analytics_keywords.values() for word in category]
    
    # # Regular keyword matching - using all flattened keywords
    # matching_keywords = [keyword for keyword in all_analytics_keywords if keyword in user_input_lower]
    # logger.info(f"Analytics keywords found: {matching_keywords}")
    
    # # Determine if this is likely an analytical question
    # if matching_keywords:
    #     # Count keywords by category to determine the most relevant category
    #     category_counts = {}
    #     for category, keywords in analytics_keywords.items():
    #         category_counts[category] = sum(1 for kw in keywords if kw in user_input_lower)
        
    #     dominant_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else None
    #     logger.info(f"Dominant question category: {dominant_category}")
        
    #     if dominant_category:
    #         logger.info(f"Routing to analysis handler with category: {dominant_category}")
    #         try:
    #             return analysis_handler(user_input)
    #         except Exception as e:
    #             logger.error(f"Error in analysis_handler: {str(e)}")
    #             # Provide more specific fallback message based on category
    #             if dominant_category == "sales":
    #                 return greeting_handler(f"I couldn't analyze the sales data as requested. The information might be incomplete or unavailable.")
    #             elif dominant_category == "products":
    #                 return greeting_handler(f"I couldn't analyze the product data you asked about. The data might not be available in our system.")
    #             elif dominant_category == "customers":
    #                 return greeting_handler(f"I couldn't retrieve the customer insights you requested. Our database might not have that specific information.")
    #             else:
    #                 return greeting_handler(f"I couldn't analyze that data about {', '.join(matching_keywords[:2])}. Our system might not have that specific information.")
    
    # # Check specifically for profit margin or similar terms
    # profit_margin_keywords = ["profit margin", "margins", "profitability", "profitable"]
    # if any(term in user_input_lower for term in profit_margin_keywords):
    #     logger.info(f"Detected profit margin question, routing to analysis handler")
    #     try:
    #         return analysis_handler(user_input)
    #     except Exception as e:
    #         logger.error(f"Error in analysis_handler for profit margin query: {str(e)}")
    #         return greeting_handler("I couldn't analyze the profit margin data you requested. This information might not be available in our system.")
    
    # # Default to basic chat for everything else
    # logger.info("No keyword matches found, defaulting to greeting handler")
    # return greeting_handler(user_input)

def create_data_analyst_agent(csv_url):
    """Create a new data analyst agent with the specified CSV URL"""
    return DuckDbAgent(
        model=OpenAIChat(model="gpt-4o"),
        semantic_model=json.dumps(
            {
                "tables": [
                    {
                        "name": "sales_data",
                        "description": "Contains detailed sales data for a cake shop including product names, order dates, quantities, prices, customer information, and total invoice amounts",
                        "path": csv_url,
                    }
                ]
            }
        ),
        instructions=[
            "You are CakeBuddy's AI-powered analytics system that analyzes cake shop sales data comprehensively",
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
        ],
        markdown=True,
        show_sql=False,
    )
    
def analysis_with_agent(user_input, agent):
    """Handle cake shop analysis requests with enhanced error handling using the provided agent"""
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
            return "I'm sorry, I couldn't calculate the profit margins you requested. Our system might not have the cost data needed for this analysis."
        elif "forecast" in user_input.lower() or "predict" in user_input.lower():
            return "I'm sorry, I couldn't generate the forecast you requested. This might require more historical data than is currently available."
        elif "customer" in user_input.lower():
            return "I'm sorry, I couldn't retrieve the customer data you requested. Our customer information might be limited in the current dataset."
        else:
            return "I'm sorry, I encountered an error while analyzing that data. Could you try asking a different question about our sales or products?"

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