# backend-stratgen/app/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- INPUT SCHEMAS (What React sends to FastAPI) ---

class StrategyRequest(BaseModel):
    """The payload expected from the frontend."""
    objective: str = Field(..., description="The main goal of the strategy (e.g., 'Increase user retention by 20%')")
    context: str = Field(..., description="Background info, constraints, or current state")
    target_audience: Optional[str] = Field(None, description="Who this strategy is for")
    model_temperature: float = Field(0.7, ge=0.0, le=1.0, description="Creativity vs. strictness")
    use_advanced_planner: bool = Field(False, description="Toggle to use a heavier model for planning")

# --- OUTPUT SCHEMAS (What FastAPI/LLM sends back to React) ---

class StrategyStep(BaseModel):
    """A single actionable step in the generated strategy."""
    step_number: int
    title: str
    action_items: List[str]
    expected_outcome: str

class StrategyResponse(BaseModel):
    """The final structured response returned to the frontend."""
    status: str = "success"
    objective_summary: str
    steps: List[StrategyStep]
    estimated_timeline: str