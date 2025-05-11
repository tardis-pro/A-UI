from fastapi import APIRouter, HTTPException, Depends
from ..models.chat import ChatRequest, ChatResponse, ConversationResponse
from ..core.auth import get_current_user
from ..services.agent_orchestrator import AgentOrchestratorService

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
    current_user: dict = Depends(get_current_user)
) -> ChatResponse:
    """
    Process a chat message and get the assistant's response.
    
    Args:
        request: The chat message request containing the user's message
        orchestrator: The agent orchestrator service instance
        current_user: The authenticated user's information
        
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