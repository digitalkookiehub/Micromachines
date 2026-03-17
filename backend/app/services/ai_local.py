"""Local AI service using Ollama for product description generation."""
import logging
import httpx

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma3:4b"


async def generate_product_description(
    product_name: str,
    brand: str = "",
    category: str = "",
) -> dict:
    """Generate product description, features, and specifications using local Ollama model."""

    prompt = f"""You are a product catalog writer for a computer peripherals e-commerce store in India.

Given this product:
- Product Name: {product_name}
{f'- Brand: {brand}' if brand else ''}
{f'- Category: {category}' if category else ''}

Generate the following in JSON format:
{{
  "description": "A compelling 2-3 sentence product description for the store listing",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "specifications": {{"key1": "value1", "key2": "value2"}},
  "suggested_category": "one of: mouse, keyboard, monitor, headset, storage, accessories",
  "suggested_hsn_code": "appropriate HSN code for this product type"
}}

Return ONLY valid JSON, no other text."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 350,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            raw_response = data.get("response", "")

            # Try to parse JSON from response
            import json
            # Find JSON in the response
            json_start = raw_response.find("{")
            json_end = raw_response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                parsed = json.loads(raw_response[json_start:json_end])
                return {
                    "success": True,
                    "data": parsed,
                    "model": DEFAULT_MODEL,
                }

            # If no valid JSON, return raw text as description
            return {
                "success": True,
                "data": {
                    "description": raw_response.strip(),
                    "features": [],
                    "specifications": {},
                },
                "model": DEFAULT_MODEL,
            }

    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama. Is it running?")
        return {
            "success": False,
            "error": "Ollama is not running. Start it with: ollama serve",
        }
    except Exception as e:
        logger.exception("AI generation failed")
        return {
            "success": False,
            "error": str(e),
        }


async def check_ollama_status() -> dict:
    """Check if Ollama is running and which models are available."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            model_names = [m["name"] for m in models]
            return {
                "running": True,
                "models": model_names,
                "default_model": DEFAULT_MODEL,
                "has_default": DEFAULT_MODEL in model_names or any(DEFAULT_MODEL.split(":")[0] in m for m in model_names),
            }
    except Exception:
        return {"running": False, "models": [], "default_model": DEFAULT_MODEL, "has_default": False}
