# Decode NDIS
![Decode_NDIS](https://github.com/stephendwalley/Decode-NDIS/assets/76471970/2a44329f-28e3-40be-94b7-d37fc86c4bd3)

An assistant app for NDIS participants to scan invoices and interpret activity and item text descriptions into relevant and applicable numerical NDIS codes for insurance claims.

## Decode NDIS | AI Hack 2023 Submission
https://youtu.be/bZ5OensSb6k

## Overview
- Utilises GPT-4 Vision to extract uploaded invoice image data (works on handwritten invoices)
- Utilises langchain and queries on supabase vector database of official NDIS documents - using openai embeddings.
- Outputs most relevant codes and summarises rules using gpt-4
- React JS frontend
- Tailwind CSS styles


## Project Setup
1. Clone the repo
2. Run `npm install` to install dependencies
3. Create a .env file in the root directory and add your OpenAI API key as `REACT_APP_OPENAI_API_KEY={your openai api key}` and add your Supabase URL `REACT_APP_SUPABASE_URL`={your supabse url} and add your Supabase API key as `REACT_APP_OPENAI_API_KEY={your supabase api key}`
4. To add vector embeddings for supabase cd to langchain-test folder. Create a .env file with the keys `OPENAI_API_KEY={your openai api key}`, `SUPABASE_URL={your supabse url}`, `OPENAI_API_KEY={your supabase api key}`. Run `node index` to embed information to Supabase.
5. cd to root folder and run `npm start` to start the app.


## Using the app
1. Option to either upload an image of the invoice, this can be either handwritten or a type document or the user can copy paste or type the item description into the textbox.
2. Press the decode button to decode your invoice and wait.
3. Decode NDIS will output the most relevant code or codes for the item.

### Example: Psychologist Appointment
<p align="center">
  <img width="521" alt="285592133-579fe7f2-5e21-4045-b8ca-1aa19919ac3f" src="https://github.com/stephendwalley/Decode-NDIS/assets/76471970/7d97e84d-4a8e-455d-9776-a05569e2fb28">
</p>

**Multiple options:**
<p align="center">
  <img width="527" alt="285592249-633ebb18-83b4-4499-939a-f5faf5d7e974" src="https://github.com/stephendwalley/Decode-NDIS/assets/76471970/8fc3f144-c606-4226-ba4f-cf07b7844a95">
</p>

This item actually provides 5 different codes that could be applicable. It orders them based on what it deems the most likely to be applicable. Multiple options will often be the case where the item description is not detailed enough. In this case it provides many options as it does not know the age of the participant. Similarly, some charges can be coded to two different plans so it provides the same code under 15 and category 1.

## Future implementations
1. Currently initial work into plan selection for queries has been implemented. Metadata has been structured so that when using a self query a filter can be added that will restrict query results to only return items from the categories that the participant selects they have within their plan. This will allow them to have more personalised results.
2. Math verification on invoice totals and line item charges. Currently the software extracts this data however doesn't validate using math. This would be useful as participants can then directly extract line items and also ensure that charges are appropriate without having to interact at all with the invoice.
3. Further functionality for multiple line item input. Currently this partially works however, it has not been optimised for multiple line items and therefore should be adjusted to include so that entire multi line, multi-page invoices can be extracted and evaluated.

