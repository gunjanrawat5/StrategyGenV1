# backend-stratgen/app/ai_engine/generator.py
import json
import httpx
import google.generativeai as genai
from fastapi import HTTPException
import os

# Grab keys from environment variables (Make sure to put these in your .env file)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_KEY")
FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY", "YOUR_FEATHERLESS_KEY")

genai.configure(api_key=GEMINI_API_KEY)

async def generate_strategy_payload(objective: str, context: str, audience: str, temp: float, use_featherless: bool) -> dict:
    """Routes the prompt to either Gemini or Featherless and forces a JSON response."""
    
    # We define the exact JSON structure we expect back so it maps perfectly to your Pydantic schemas
    system_prompt = """
    You are an elite Business Strategy AI. 
    Analyze the objective and context, and return a highly structured strategic plan.
    
    You MUST return ONLY a valid JSON object matching this exact schema:
    {
      "status": "success",
      "objective_summary": "A 1-sentence summary of the goal.",
      "steps": [
        {
          "step_number": 1,
          "title": "Name of the phase",
          "action_items": ["Action 1", "Action 2"],
          "expected_outcome": "What this step achieves"
        }
      ],
      "estimated_timeline": "e.g., 3 Months"
    }
    """
    
    user_prompt = f"Objective: {objective}\nContext: {context}\nTarget Audience: {audience or 'General'}"

    try:
        if not use_featherless:
            # --- PRIMARY ROUTE: Gemini ---
            model = genai.GenerativeModel(
                'gemini-1.5-flash',
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=temp
                )
            )
            response = await model.generate_content_async(user_prompt)
            raw_response = response.text
            
        else:
            # --- SECONDARY ROUTE: Featherless API ---
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url="https://api.featherless.ai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {FEATHERLESS_API_KEY}"
                    },
                    json={
                        "model": "Qwen/Qwen2.5-7B-Instruct", # Or whichever model you prefer
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": temp
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                raw_response = response.json()["choices"][0]["message"]["content"]

        # Clean the response (in case Featherless wraps it in markdown blocks)
        clean_json = raw_response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(clean_json)

    except Exception as e:
        print(f"AI Generation Error: {e}")
        raise HTTPException(status_code=500, detail="The AI engine failed to generate a valid strategy.")