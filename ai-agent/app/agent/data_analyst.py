# import json
# from phi.model.openai import OpenAIChat
# from phi.agent.duckdb import DuckDbAgent
# from app.api.get_csv_url import get_csv_url
# from dotenv import load_dotenv

# load_dotenv()

# data_analyst = DuckDbAgent(
#     model=OpenAIChat(model="o3-mini"),
#     semantic_model=json.dumps(
#         {
#             "tables": [
#                 {
#                     "name": "sales_data",
#                     "description": "Contains information about sales data cake shop",
#                     "path": get_csv_url(),
#                 }
#             ]
#         }
#     ),
#     markdown=True,
# )
# data_analyst.print_response(
#     # "What are the top 5 products by revenue in the sales data?",
#     # "Generate a report on the sales data for the month of January 2022.",
#     # "What is the total revenue for the month of February 2022?",
#     "Can you provide suggestions to improve sales performance in 2026?, which product i want to focus on?",
#     stream=True,
# )