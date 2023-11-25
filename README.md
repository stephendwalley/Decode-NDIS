# Decode NDIS
An assistant app for self-managed NDIS participants to scan invoices and interpret activity and item text descriptions into relevant and applicable numerical NDIS codes for insurance claims.

## Decode NDIS | AI Hack 2023 Submission
https://youtu.be/bZ5OensSb6k

## Overview
- Utilises GPT-4 Vision to extract uploaded invoice image data (works on handwritten invoices)
- Utilises langchain and supabase queries on vector database of official NDIS documents
- Outputs most relevant codes and summarises rules using gpt-4
- React JS frontend
- Tailwind CSS styles


## Project Setup
1. Clone the repo
2. Run `npm install` to install dependencies
3. Create a .env file in the root directory and add your OpenAI API key as `REACT_APP_OPENAI_API_KEY={your openai api key}` and add your Supabase URL `REACT_APP_SUPABASE_URL`={your supabse url} and add your Supabase API key as `REACT_APP_OPENAI_API_KEY={your supabase api key`
4. Run `npm start` to start the app
