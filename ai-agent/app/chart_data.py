# import pandas as pd
# from datetime import datetime
# import logging
# import traceback

# logger = logging.getLogger("ChartData")

# def collect_sales_chart_data(csv_url, selected_month=None):
#     """
#     Collect and prepare sales data for charting purposes
    
#     Args:
#         csv_url (str): URL to the CSV file containing sales data
#         selected_month (str, optional): Month in format 'YYYY-MM' to filter data. If None, uses most recent month.
    
#     Returns:
#         dict: Dictionary containing chart data and metadata
#     """
#     try:
#         # Load the CSV data
#         df = pd.read_csv(csv_url)
#         logger.info(f"Successfully loaded CSV data with {len(df)} rows")
        
#         # Identify date column (looking for common naming patterns)
#         date_column = None
#         possible_date_columns = ['date', 'order_date', 'transaction_date', 'invoice_date', 'Date', 'OrderDate']
#         for col in possible_date_columns:
#             if col in df.columns:
#                 date_column = col
#                 break
        
#         if not date_column:
#             # Try to find a column with datetime values
#             for col in df.columns:
#                 if df[col].dtype == 'datetime64[ns]' or ('date' in col.lower()):
#                     try:
#                         # Try converting first value to datetime as a test
#                         pd.to_datetime(df[col].iloc[0])
#                         date_column = col
#                         break
#                     except:
#                         continue
        
#         if not date_column:
#             logger.error("No date column found in the CSV data")
#             return {"error": "No date column could be identified in the data"}
        
#         # Identify sales/amount column
#         amount_column = None
#         possible_amount_columns = ['total', 'amount', 'total_amount', 'sales', 'revenue', 'price', 
#                                   'Total', 'Amount', 'TotalAmount', 'Sales', 'Revenue', 'Price']
#         for col in possible_amount_columns:
#             if col in df.columns:
#                 amount_column = col
#                 break
                
#         if not amount_column:
#             # Try to identify columns with numeric values that might represent monetary amounts
#             numeric_columns = df.select_dtypes(include=['float64', 'int64']).columns
#             for col in numeric_columns:
#                 if any(term in col.lower() for term in ['total', 'amount', 'sales', 'revenue', 'price']):
#                     amount_column = col
#                     break
            
#             # If still no match, take the first numeric column that has reasonable values for sales
#             if not amount_column and len(numeric_columns) > 0:
#                 for col in numeric_columns:
#                     if df[col].mean() > 1:  # Assuming sales values are typically > 1
#                         amount_column = col
#                         break
        
#         if not amount_column:
#             logger.error("No amount/sales column found in the CSV data")
#             return {"error": "No sales amount column could be identified in the data"}
        
#         # Convert date column to datetime
#         df[date_column] = pd.to_datetime(df[date_column], errors='coerce')
#         df = df.dropna(subset=[date_column])  # Remove rows with invalid dates
        
#         # Extract year and month for filtering
#         df['year'] = df[date_column].dt.year
#         df['month'] = df[date_column].dt.month
#         df['day'] = df[date_column].dt.day
        
#         # Get available months for filtering
#         available_months = df.groupby(['year', 'month']).size().reset_index()
#         available_months['month_str'] = available_months.apply(
#             lambda x: f"{int(x['year'])}-{int(x['month']):02d}", axis=1
#         )
#         month_options = available_months['month_str'].tolist()
        
#         # Determine the month to use (selected or most recent)
#         if selected_month and selected_month in month_options:
#             year, month = map(int, selected_month.split('-'))
#         else:
#             # Use the most recent month
#             latest_date = df[date_column].max()
#             year = latest_date.year
#             month = latest_date.month
#             selected_month = f"{year}-{month:02d}"
        
#         # Filter data for the selected month
#         monthly_data = df[(df['year'] == year) & (df['month'] == month)]
        
#         # Group by day and sum sales
#         daily_sales = monthly_data.groupby('day')[amount_column].sum().reset_index()
#         daily_sales = daily_sales.sort_values('day')
        
#         # Create a complete series for all days in the month
#         import calendar
#         _, last_day = calendar.monthrange(year, month)
#         all_days = pd.DataFrame({'day': range(1, last_day + 1)})
        
#         # Merge to include days with no sales
#         complete_daily_sales = all_days.merge(daily_sales, on='day', how='left')
#         complete_daily_sales[amount_column] = complete_daily_sales[amount_column].fillna(0)
        
#         # Format data for Chart.js
#         labels = complete_daily_sales['day'].tolist()
#         data = complete_daily_sales[amount_column].tolist()
        
#         return {
#             "success": True,
#             "labels": labels,
#             "data": data,
#             "month_options": month_options,
#             "selected_month": selected_month,
#             "month_name": datetime(year, month, 1).strftime('%B %Y')
#         }
        
#     except Exception as e:
#         logger.error(f"Error collecting chart data: {str(e)}")
#         logger.error(traceback.format_exc())
#         return {
#             "error": f"Failed to process sales data for charting: {str(e)}",
#             "success": False
#         }