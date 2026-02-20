"""LLM provider abstraction — supports Groq and OpenAI with streaming."""

from collections.abc import AsyncGenerator
from typing import Protocol

from groq import AsyncGroq
from openai import AsyncOpenAI

from app.config import settings
from app.core.exceptions import LLMProviderError
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMClient(Protocol):
    """Protocol for LLM providers."""

    async def stream_chat(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncGenerator[str, None]: ...


class GroqProvider:
    """Groq LLM provider using llama models."""

    def __init__(self):
        if not settings.groq_api_key:
            raise LLMProviderError("groq", "DOCUMIND_GROQ_API_KEY not set")
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model

    async def stream_chat(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        full_messages = [{"role": "system", "content": system_prompt}, *messages]
        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=full_messages,
                stream=True,
                temperature=0.3,
                max_tokens=2048,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            logger.error("groq_stream_error", error=str(e))
            raise LLMProviderError("groq", str(e))


class OpenAIProvider:
    """OpenAI LLM provider."""

    def __init__(self):
        if not settings.openai_api_key:
            raise LLMProviderError("openai", "DOCUMIND_OPENAI_API_KEY not set")
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    async def stream_chat(
        self, messages: list[dict], system_prompt: str
    ) -> AsyncGenerator[str, None]:
        full_messages = [{"role": "system", "content": system_prompt}, *messages]
        try:
            stream = await self._client.chat.completions.create(
                model=self._model,
                messages=full_messages,
                stream=True,
                temperature=0.3,
                max_tokens=2048,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content
        except Exception as e:
            logger.error("openai_stream_error", error=str(e))
            raise LLMProviderError("openai", str(e))


def get_llm_client() -> LLMClient:
    """Factory — returns the configured LLM provider."""
    provider = settings.llm_provider.lower()
    if provider == "groq":
        return GroqProvider()
    elif provider == "openai":
        return OpenAIProvider()
    else:
        raise LLMProviderError(provider, f"Unknown LLM provider '{provider}'. Use 'groq' or 'openai'.")
