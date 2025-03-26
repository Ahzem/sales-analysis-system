from phi.agent import Agent
from phi.model.openai import OpenAIChat
from phi.tools.googlesearch import GoogleSearch

web_agent = Agent(
            name="Web Search Agent",
            model=OpenAIChat(
                model="gpt-4o",
                temperature=0.7
            ),
            tools=[GoogleSearch()],
            description="Expert web search agent that finds relevant and up-to-date information",
            instructions=[
                "Always include sources and dates in responses",
                "Prioritize recent information",
                "Verify information from multiple sources when possible",
                "Format responses in clear sections",
                "Include relevant quotes when appropriate"
            ],
            add_history_to_messages=True,
            num_history_responses=5,
            show_tool_calls=True,
            markdown=True
        )

# web_agent.print_response("Whats happening in France?", stream=True)