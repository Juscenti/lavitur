// index.js - Lavitúr AI Server with Supabase Integration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { OpenAI } = require('openai');
const { searchProducts, extractSearchFilters } = require('./productSearch');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Instantiate OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI concierge
const SYSTEM_PROMPT = `You are Lavitúr's friendly AI shopping concierge. Your role is to help customers find the perfect clothing items from our inventory. 

When customers ask about products:
1. If products are found in our database, describe them with details (name, price, availability).
2. If we don't have a specific item, suggest similar alternatives from what we carry.
3. Always be helpful, honest, and enthusiastic about our collection.
4. If no products match the search, politely explain and offer to help them find something else.

Product information context will be provided to you. Use it to give accurate, personalized recommendations.`;

/**
 * Main endpoint: Process user message and return AI response with product context
 */
app.post('/api/ai', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'No valid message provided' });
  }

  try {
    console.log('📨 User message:', message);

    // Extract product search filters from user message
    const filters = extractSearchFilters(message);
    console.log('🔍 Extracted filters:', filters);

    // Search database for matching products
    const products = await searchProducts(filters);
    console.log(`📦 Found ${products.length} products`);

    // Build context about available products for the AI
    let productContext = '';
    if (products.length > 0) {
      productContext = '\n\nRelevant products from our inventory:\n';
      productContext += products
        .map(
          (p) =>
            `- ${p.title}: $${p.price} (${p.inStock ? 'In Stock' : 'Out of Stock'}) - ${p.description}`
        )
        .join('\n');
    } else {
      productContext = '\n\n(No exact matches found in inventory for this search)';
    }

    // Build messages array with conversation history
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: `${message}${productContext}`,
      },
    ];

    // Call OpenAI with context
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiReply = response.choices?.[0]?.message?.content;
    if (!aiReply) {
      return res.status(500).json({ error: 'No reply from AI' });
    }

    console.log('✅ AI response generated');

    return res.json({
      reply: aiReply.trim(),
      productsShown: products.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        image: p.image,
      })),
      filtersUsed: filters,
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({ error: 'AI request failed', details: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Lavitúr AI Server' });
});

app.listen(PORT, () => {
  console.log(`✅ Lavitúr AI Server running at http://localhost:${PORT}`);
  console.log(`📚 System prompt configured for product assistance`);
});
