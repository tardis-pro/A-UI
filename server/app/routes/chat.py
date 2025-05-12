from fastapi import APIRouter, HTTPException, Depends
from ..models.chat import ChatMessage, ChatResponse, ConversationResponse
from ..core.auth import get_current_user
from ..services.agent_orchestrator import AgentOrchestratorService
from ..core.websocket import connection_manager
from ..dependencies import get_db
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["chat"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

@router.post("/", response_model=ChatResponse)
async def process_message(
    request: ChatRequest,
    orchestrator: AgentOrchestratorService = Depends(),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ChatResponse:
    """
    Process a chat message and get the assistant's response.
    
    Args:
        request: The chat message request containing the user's message
        orchestrator: The agent orchestrator service instance
        current_user: The authenticated user's information
        db: Database session
        
    Returns:
        ChatResponse containing the assistant's response and conversation ID
        
    Raises:
        HTTPException: If message processing fails
    """
    try:
        response = await orchestrator.process_message(
            message=request.message,
            user_id=current_user["id"]
        )
        
        # Create a new ChatMessage object
        chat_message = ChatMessage(
            user_id=current_user["id"],
            message=request.message,
            response=response.response,
            conversation_id=response.conversation_id
        )
        
        # Add the ChatMessage to the database session
        db.add(chat_message)
        db.commit()
        db.refresh(chat_message)
        
        # Send the response to all connected clients in the channel
        channel_id = current_user["id"]  # Assuming user ID is the channel ID
        message = {
            "type": "chat_message",
            "data": response.dict()
        }
        await connection_manager.send_to_channel(channel_id, message)
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process message: {str(e)}"
        )

@router.get("/conversation", response_model=ConversationResponse)
async def get_conversation(
    orchestrator: AgentOrchestratorService = Depends(),
    current_user: dict = Depends(get_current_user)
) -> ConversationResponse:
    """
    Get the current active conversation.
    
    Args:
        orchestrator: The agent orchestrator service instance
        current_user: The authenticated user's information
        
    Returns:
        ConversationResponse containing the current conversation or None
        
    Raises:
        HTTPException: If conversation retrieval fails
    """
    try:
        conversation = await orchestrator.get_active_conversation(
            user_id=current_user["id"]
        )
        return ConversationResponse(conversation=conversation)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get conversation: {str(e)}"
        )