# Fact-Checking Discord Bot

This repository provides a minimal Discord bot that critiques messages containing factual inaccuracies.
It uses two OpenAI models:

- A cheap model to flag potential inaccuracies.
- A more capable model to craft a terse, critical correction.

## Setup

1. **Create a Discord application and bot** at [https://discord.com/developers](https://discord.com/developers) and invite it to your server.
2. **Set environment variables**:
   ```bash
   export DISCORD_BOT_TOKEN="your discord bot token"
   export OPENAI_API_KEY="your openai api key"
   # Optional overrides
   export CHEAP_MODEL="gpt-4o-mini"
   export THINKING_MODEL="gpt-4o"
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the bot**:
   ```bash
   python bot.py
   ```

The bot will watch messages in servers where it is present and reply with a terse critique when it detects a factual mistake.
