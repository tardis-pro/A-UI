import uuid
from datetime import datetime
from typing import Optional, List
from pathlib import Path

import dspy
from dspy.predict import Predictor
from dspy.signatures import SignatureBuilder
from fastapi import Depends

from ..models.chat import Message, ChatResponse, Conversation
from ..core.exceptions import OrchestrationError
from ..config import get_settings

# Define DSPy signatures for different agent types
class ChatSignature(SignatureBuilder):
    """Signature for basic chat responses"""
    context = dspy.InputField(desc="Current conversation context")
    user_message = dspy.InputField(desc="User's message")
    response = dspy.OutputField(desc="Assistant's response")

class ReactSignature(SignatureBuilder):
    """Signature for ReAct-style reasoning and action"""
    context = dspy.InputField(desc="Current context and tools available")
    user_message = dspy.InputField(desc="User's message")
    thought = dspy.OutputField(desc="Reasoning about the action to take")
    action = dspy.OutputField(desc="Action to perform")
    response = dspy.OutputField(desc="Final response to user")

class AgentOrchestrator:
    """DSPy-based agent orchestrator implementing different conversation patterns"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.settings = get_settings()
        
        # Initialize DSPy with selected model
        # Model will be downloaded during container build
        self.lm = dspy.HFModel(
            model_path or "huggingface/mistral-7b-instruct",
            max_length=2048,
            device="cuda" if self.settings.USE_GPU else "cpu"
        )
        dspy.settings.configure(lm=self.lm)
        
        # Initialize different agent types
        self.chat_agent = dspy.Predict(ChatSignature)
        self.react_agent = dspy.Predict(ReactSignature)

    async def handle_chat(self, context: List[Message], message: str) -> str:
        """Handle basic chat interactions"""
        try:
            context_text = "\n".join([
                f"{msg.role}: {msg.content}" for msg in context
            ])
            
            prediction = self.chat_agent(
                context=context_text,
                user_message=message
            )
            return prediction.response

        except Exception as e:
            raise OrchestrationError(f"Chat processing failed: {str(e)}")

    async def handle_react(self, context: List[Message], message: str) -> str:
        """Handle ReAct-style interactions with reasoning and actions"""
        try:
            context_text = "\n".join([
                f"{msg.role}: {msg.content}" for msg in context
            ])
            
            prediction = self.react_agent(
                context=context_text,
                user_message=message
            )
            
            # Log the reasoning process
            print(f"Thought: {prediction.thought}")
            print(f"Action: {prediction.action}")
            
            return prediction.response

        except Exception as e:
            raise OrchestrationError(f"ReAct processing failed: {str(e)}")

class AgentOrchestratorService:
    """
    Service class for managing interactions with DSPy-based agents.
    Handles conversation state and agent selection.
    """
    
    def __init__(self):
        self._active_conversations = {}  # user_id -> Conversation mapping
        self._orchestrator = AgentOrchestrator()
    
    async def process_message(self, message: str, user_id: str) -> ChatResponse:
        """
        Process a user message through the appropriate agent.
        
        Args:
            message: The user's message content
            user_id: The ID of the user sending the message
            
        Returns:
            ChatResponse containing the assistant's response
            
        Raises:
            OrchestrationError: If message processing fails
        """
        try:
            # Create or get existing conversation
            if user_id not in self._active_conversations:
                conv_id = str(uuid.uuid4())
                self._active_conversations[user_id] = Conversation(
                    id=conv_id,
                    messages=[],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

            conversation = self._active_conversations[user_id]
            
            # Add user message to conversation
            user_message = Message(
                content=message,
                role="user",
                timestamp=datetime.utcnow()
            )
            conversation.messages.append(user_message)
            
            # Process message through appropriate agent
            # TODO: Add logic to select between chat and react agents based on message content
            response_content = await self._orchestrator.handle_chat(
                context=conversation.messages,
                message=message
            )
            
            # Create and store assistant's response
            assistant_message = Message(
                content=response_content,
                role="assistant",
                timestamp=datetime.utcnow()
            )
            conversation.messages.append(assistant_message)
            
            # Update conversation timestamp
            conversation.updated_at = datetime.utcnow()
            
            return ChatResponse(
                response=assistant_message,
                conversation_id=conversation.id
            )
            
        except Exception as e:
            raise OrchestrationError(f"Failed to process message: {str(e)}")
    
    async def get_active_conversation(self, user_id: str) -> Optional[Conversation]:
        """Get the current active conversation for a user."""
        return self._active_conversations.get(user_id)