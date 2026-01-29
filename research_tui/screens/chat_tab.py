"""Chat Tab - AI chat interface"""

from textual.containers import Vertical, Horizontal
from textual.widgets import Input, TextArea, Static, Button
from textual import on
from api_client import api_client
import httpx


class ChatTab(Vertical):
    """Chat tab for AI interaction"""

    def compose(self):
        yield Static("Chat with Research Pilot AI", classes="header")
        yield TextArea(id="chat_history", read_only=True)
        yield Horizontal(
            Input(placeholder="Ask Research Pilot anything...", id="chat_input"),
            Button("Send", id="send_button", variant="primary")
        )

    @on(Button.Pressed, "#send_button")
    async def send_message(self):
        """Send message to AI"""
        input_widget = self.query_one(Input)
        message = input_widget.value.strip()

        if not message:
            return

        # Add user message to history
        history = self.query_one(TextArea)
        current_text = history.text
        history.text = f"{current_text}\n[You]: {message}\n"

        # Clear input
        input_widget.value = ""

        # Call AI action endpoint
        try:
            response = await api_client.client.post(
                "http://localhost:8000/api/ai/action",
                json={
                    "action": "chat",
                    "content": message
                }
            )
            response.raise_for_status()
            result = response.json()

            # Add AI response to history
            history.text = f"{history.text}\n[AI]: {result.get('response', 'No response')}\n"

        except Exception as e:
            history.text = f"{history.text}\n[Error]: {str(e)}\n"

        # Scroll to bottom
        history.scroll_end()
