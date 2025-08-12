import os
import asyncio
import discord
from discord.ext import commands
from openai import OpenAI

CHEAP_MODEL = os.getenv("CHEAP_MODEL", "gpt-4o-mini")
THINKING_MODEL = os.getenv("THINKING_MODEL", "gpt-4o")

client = OpenAI()

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

async def contains_inaccuracy(message: str) -> bool:
    prompt = (
        "You are a fact-checking assistant. Reply with 'yes' if the message contains any factual "
        "inaccuracies and 'no' otherwise.\n\nMessage:\n" + message
    )
    response = await asyncio.to_thread(
        client.responses.create,
        model=CHEAP_MODEL,
        input=prompt,
    )
    decision = response.output_text.strip().lower()
    return decision.startswith("y")

async def craft_critique(message: str) -> str:
    prompt = (
        "You are a terse and critical fact checker. Point out factual inaccuracies in the message "
        "below. Respond in at most two sentences, and be extremely terse and critical.\n\nMessage:\n"
        + message
    )
    response = await asyncio.to_thread(
        client.responses.create,
        model=THINKING_MODEL,
        input=prompt,
    )
    return response.output_text.strip()

@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return
    if await contains_inaccuracy(message.content):
        reply = await craft_critique(message.content)
        if reply:
            await message.channel.send(reply)
    await bot.process_commands(message)

if __name__ == "__main__":
    token = os.environ["DISCORD_BOT_TOKEN"]
    bot.run(token)
