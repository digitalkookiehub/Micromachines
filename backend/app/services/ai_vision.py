import json
import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


def analyze_product_image(image_url: str) -> dict:
    """Send product image to OpenAI GPT-4 Vision for analysis."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Analyze this computer peripheral product image. "
                            "Return a JSON object with these fields:\n"
                            '- "product_type": the type of product (e.g., "mouse", "keyboard")\n'
                            '- "brand": the brand name\n'
                            '- "model": the model name/number\n'
                            '- "category": one of: mouse, keyboard, monitor, headset, storage, accessories\n'
                            '- "visible_features": array of visible features\n'
                            '- "name": a suggested product name\n'
                            "Return ONLY valid JSON, no markdown."
                        ),
                    },
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
        max_tokens=500,
    )

    content = response.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.error("Failed to parse AI response: %s", content)
        return {"raw_response": content}
