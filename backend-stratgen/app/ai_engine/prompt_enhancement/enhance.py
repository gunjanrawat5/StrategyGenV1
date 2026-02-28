import json

import google.generativeai as genai
import httpx
from fastapi import HTTPException

genai.configure(api_key="YOUR_GEMINI_API_KEY")
FEATHERLESS_API_KEY = "YOUR_FEATHERLESS_API_KEY"


async def generate_game_spec(user_prompt: str, use_featherless: bool = False) -> list:
    system_prompt = """
    You are the Lead Game Designer and Architect for a Python-based game engine.
    Translate the user's request into a strict JSON array of technical steps.
    Identify which files need to be modified and what exactly needs to be coded.

    Required Output Format:
    [
      {
        "target_file": "name_of_file.py",
        "instruction": "Highly technical description of the exact code changes required."
      }
    ]

    Return ONLY valid JSON. Do not include markdown formatting or explanations.
    """

    try:
        if not use_featherless:
            model = genai.GenerativeModel(
                "gemini-1.5-flash",
                system_instruction=system_prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            response = await model.generate_content_async(user_prompt)
            raw_response = response.text
        else:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url="https://api.featherless.ai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
                    },
                    json={
                        "model": "Qwen/Qwen2.5-7B-Instruct",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.1,
                    },
                    timeout=15.0,
                )
                response.raise_for_status()
                response_data = response.json()
                raw_response = response_data["choices"][0]["message"]["content"]

        clean_json_string = (
            raw_response.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        return json.loads(clean_json_string)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail="The Planner Model failed to return valid JSON.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Planner Agent Error: {str(exc)}") from exc
