# backend-stratgen/app/api/routes.py
from fastapi import APIRouter
from app.models.schemas import StrategyRequest, StrategyResponse
from app.ai_engine.generator import generate_strategy_payload

router = APIRouter()

@router.post("/generate-strategy", response_model=StrategyResponse)
async def create_strategy(request: StrategyRequest):
    """
    Receives frontend request, calls the AI engine, and returns structured data.
    """
    # Call our AI router
    generated_data = await generate_strategy_payload(
        objective=request.objective,
        context=request.context,
        audience=request.target_audience,
        temp=request.model_temperature,
        use_featherless=request.use_advanced_planner
    )
    
    # Return the data. FastAPI will automatically validate it against the StrategyResponse schema!
    return generated_data