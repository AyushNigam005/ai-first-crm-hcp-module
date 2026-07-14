"""Thin wrapper around Groq's chat completion API with JSON-mode + retries."""
import json
import logging
from typing import Optional

from groq import Groq

from app.core.config import settings

logger = logging.getLogger("hcp_crm.groq")

_client: Optional[Groq] = None


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def chat_completion(
    system_prompt: str,
    user_prompt: str,
    json_mode: bool = False,
    max_retries: int = 2,
    model: Optional[str] = None,
) -> str:
    """Call Groq chat completion, retrying on transient/malformed-output failures."""
    client = get_client()
    chosen_model = model or settings.groq_model
    last_error: Optional[Exception] = None

    for attempt in range(max_retries + 1):
        try:
            kwargs = {
                "model": chosen_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content

            if json_mode:
                # Validate it's actually parseable JSON before returning.
                json.loads(content)
            return content

        except Exception as exc:  # noqa: BLE001 - want to retry/fallback broadly
            last_error = exc
            logger.warning("Groq call failed (attempt %s) with %s: %s", attempt, chosen_model, exc)
            # On the final retry, fall back to the larger model for robustness.
            if attempt == max_retries - 1 and chosen_model != settings.groq_fallback_model:
                chosen_model = settings.groq_fallback_model

    logger.error("Groq call failed after %s attempts: %s", max_retries + 1, last_error)
    raise RuntimeError(f"Groq completion failed: {last_error}")


def safe_json_completion(system_prompt: str, user_prompt: str) -> dict:
    """Chat completion that always returns a dict, falling back to {} on malformed output."""
    try:
        raw = chat_completion(system_prompt, user_prompt, json_mode=True)
        return json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        logger.error("safe_json_completion fallback triggered: %s", exc)
        return {}
