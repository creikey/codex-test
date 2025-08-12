import os
import re
import asyncio
import logging
import discord
from discord.ext import commands
from openai import AsyncOpenAI

CHEAP_MODEL = os.getenv("CHEAP_MODEL", "gpt-5-mini")
THINKING_MODEL = os.getenv("THINKING_MODEL", "gpt-5")

client = AsyncOpenAI()

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


# ----- Logging -----
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s %(message)s",
)
logger = logging.getLogger("fact-check-bot")


# ----- Helpers -----
def _truncate(text: str, max_len: int = 500) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "…"


async def _build_context_for_message(msg: discord.Message, history_count: int = 9) -> str:
    """Build a short transcript of the last ~10 messages including the current one.

    We collect up to `history_count` messages before the current message, then append
    the current message as the most recent line. Returns a plain-text transcript.
    """
    try:
        prior_messages = []
        async for m in msg.channel.history(limit=history_count, before=msg):
            prior_messages.append(m)
        # Oldest → Newest for readability
        prior_messages = list(reversed(prior_messages))

        lines = []
        for m in prior_messages:
            author = getattr(m.author, "display_name", str(m.author))
            content = _truncate(m.content or "")
            lines.append(f"{author}: {content}")

        # Include the current message last
        current_author = getattr(msg.author, "display_name", str(msg.author))
        current_content = _truncate(msg.content or "")
        lines.append(f"{current_author}: {current_content}")

        return "\n".join(lines)
    except Exception as exc:
        logger.warning("Failed to build context: %s", exc)
        # Fallback to just the current message
        return _truncate(msg.content or "")


async def _call_responses_api(model: str, prompt: str) -> tuple[str, int, int]:
    """Call the Responses API and return (text, input_tokens, output_tokens)."""
    response = await client.responses.create(model=model, input=prompt)

    # Prefer SDK convenience accessor when present
    text = getattr(response, "output_text", None)
    if not (isinstance(text, str) and text.strip()):
        # Fallback: traverse structured output
        try:
            parts = []
            for item in getattr(response, "output", []) or []:
                for content in getattr(item, "content", []) or []:
                    ctext = getattr(content, "text", None) or getattr(content, "output_text", None)
                    if isinstance(ctext, str):
                        parts.append(ctext)
            text = "".join(parts)
        except Exception:
            text = ""

    usage = getattr(response, "usage", None)
    in_tok = int(getattr(usage, "input_tokens", 0) or 0)
    out_tok = int(getattr(usage, "output_tokens", 0) or 0)
    return (text or "", in_tok, out_tok)


def _canonical_model(model: str) -> str:
    m = model.strip().lower()
    # normalize variants like "gpt5", "gpt_5", etc.
    m = m.replace("_", "-").replace(" ", "-")
    m = re.sub(r"-+", "-", m)
    if m in {"gpt5", "gpt-5"}:
        return "gpt-5"
    if m in {"gpt5mini", "gpt-5-mini", "gpt5-mini"}:
        return "gpt-5-mini"
    if m in {"gpt5nano", "gpt-5-nano", "gpt5-nano"}:
        return "gpt-5-nano"
    return m


def _get_model_pricing(model: str) -> tuple[float, float]:
    """Return (input_price_per_1k, output_price_per_1k) in USD.

    Prices hardcoded from current schedule (per 1M tokens), converted to per 1k:
    - gpt-5: input $1.250/M → $0.00125/1k, output $10.000/M → $0.01000/1k
    - gpt-5-mini: input $0.250/M → $0.00025/1k, output $2.000/M → $0.00200/1k
    - gpt-5-nano: input $0.050/M → $0.00005/1k, output $0.400/M → $0.00040/1k
    """
    cm = _canonical_model(model)
    if cm == "gpt-5":
        return 0.00125, 0.01000
    if cm == "gpt-5-mini":
        return 0.00025, 0.00200
    if cm == "gpt-5-nano":
        return 0.00005, 0.00040
    return 0.0, 0.0


def _estimate_cost_usd(model: str, input_tokens: int, output_tokens: int) -> float:
    in_price, out_price = _get_model_pricing(model)
    cost = (input_tokens / 1000.0) * in_price + (output_tokens / 1000.0) * out_price
    return round(cost, 6)

async def contains_inaccuracy(message: discord.Message) -> bool:
    transcript = await _build_context_for_message(message, history_count=9)
    prompt = (
        "You are an acerbic, contrarian assistant named Dr. Snoid.") + (
        " Reply 'yes' if the FINAL line in the transcript either (a) contains an objective factual inaccuracy,"
        " (b) makes a naive, popular, or debatable claim with surface area to disagree with, or (c) confidently asserts"
        " something that could use a corrective counterpoint. Reply 'no' only if there is nothing reasonable to correct or gripe about."
        " Use earlier lines only as context; judge ONLY the final line."
        " Answer with exactly 'yes' or 'no' and nothing else.\n\nTranscript (older → newer):\n" + transcript
    )
    decision_text, in_tok, out_tok = await _call_responses_api(CHEAP_MODEL, prompt)
    decision = (decision_text or "").strip().lower()
    cost = _estimate_cost_usd(CHEAP_MODEL, in_tok, out_tok)
    logger.info(
        "Query cost=%.6f USD model=%s tokens(in=%d,out=%d) decision for message id=%s by %s in #%s: %s",
        cost,
        CHEAP_MODEL,
        in_tok,
        out_tok,
        message.id,
        getattr(message.author, "display_name", str(message.author)),
        getattr(message.channel, "name", str(message.channel.id)),
        decision,
    )
    return decision.startswith("y")

async def craft_critique(message: discord.Message, *, force_response: bool = False) -> str:
    transcript = await _build_context_for_message(message, history_count=9)
    base = (
        "Adopt the persona of Dr. Snoid: acerbic, gripey, impatient, and contrarian."
        " Identify the mistakes, naive assumptions, or weak arguments in ONLY the final line of the transcript below."
        " Provide a pointed corrective counter-argument in a sharply critical tone."
        " Keep it to at most two sentences."
    )
    if force_response:
        tail = (
            " You must respond with a contrarian correction even if the issue is minor; do NOT output '<no response necessary>'.\n\n"
        )
    else:
        tail = (
            " If there is truly nothing to correct or gripe about, reply exactly '<no response necessary>'.\n\n"
        )
    prompt = base + tail + ("Transcript (older → newer):\n" + transcript)
    reply_text, in_tok, out_tok = await _call_responses_api(THINKING_MODEL, prompt)
    cost = _estimate_cost_usd(THINKING_MODEL, in_tok, out_tok)
    logger.info(
        "Response cost=%.6f USD model=%s tokens(in=%d,out=%d) for message id=%s",
        cost,
        THINKING_MODEL,
        in_tok,
        out_tok,
        message.id,
    )
    return (reply_text or "").strip()


async def craft_presence(message: discord.Message) -> str:
    """Generate a short, personal presence acknowledgement in Dr. Snoid's voice."""
    transcript = await _build_context_for_message(message, history_count=9)
    prompt = (
        "You are Dr. Snoid: acerbic, sardonic, and terse."
        " Someone appears to be addressing or greeting you. Respond with a very short, personal acknowledgement"
        " (max one short sentence), in-character. Do not be overly friendly."
        " Avoid emojis.\n\nTranscript (older → newer):\n" + transcript
    )
    text, in_tok, out_tok = await _call_responses_api(THINKING_MODEL, prompt)
    cost = _estimate_cost_usd(THINKING_MODEL, in_tok, out_tok)
    logger.info(
        "Presence cost=%.6f USD model=%s tokens(in=%d,out=%d) for message id=%s",
        cost,
        THINKING_MODEL,
        in_tok,
        out_tok,
        message.id,
    )
    return (text or "I'm here").strip()

@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    # Always respond with a gripey correction if directly pinged (bot mention)
    try:
        if message.mentions and bot.user and bot.user in message.mentions:
            async with message.channel.typing():
                reply = await craft_critique(message, force_response=True)
            cleaned = (reply or "").strip()
            if cleaned:
                await message.reply(cleaned, mention_author=False)
            return
    except Exception:
        # If mentions not available or any error, fall back to normal flow
        pass

    # Mention by name (not a ping): provide a brief in-character presence reply if it seems like a greeting
    content_lower = (message.content or "").strip().lower()
    if "snoid" in content_lower:
        greeting_triggers = ["hey", "hi", "hello", "yo", "sup", "what's up", "whats up", "what is up"]
        if any(trigger in content_lower for trigger in greeting_triggers):
            async with message.channel.typing():
                presence = await craft_presence(message)
            if presence:
                await message.reply(presence, mention_author=False)
            return

    try:
        if await contains_inaccuracy(message):
            async with message.channel.typing():
                reply = await craft_critique(message)
            cleaned = (reply or "").strip()
            if cleaned and cleaned != "<no response necessary>":
                await message.reply(reply, mention_author=False)
                logger.info("Replied to message id=%s with critique (%d chars)", message.id, len(reply))
            else:
                logger.info("No critique generated for message id=%s", message.id)
    except Exception as exc:
        logger.exception("Error handling message id=%s: %s", message.id, exc)
    await bot.process_commands(message)

if __name__ == "__main__":
    token = os.environ["DISCORD_BOT_TOKEN"]
    bot.run(token)
