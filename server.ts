import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { SAMPLE_PRODUCTS } from "./src/sampleData";

dotenv.config();

console.log("[AI Commerce Server] Verifying runtime secrets...");
if (process.env.GEMINI_API_KEY) {
  console.log(`[AI Commerce Server] GEMINI_API_KEY secret is available in runtime (length: ${process.env.GEMINI_API_KEY.length})`);
} else {
  console.warn("[AI Commerce Server] GEMINI_API_KEY secret is NOT available in runtime.");
}

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const PORT = 3000;

// Lazy initialize GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiAI() {
  if (!aiClient) {
    let key = process.env.GEMINI_API_KEY;
    if (key) {
      // Strip surrounding double or single quotes if any
      key = key.replace(/^['"]|['"]$/g, "").trim();
    }
    if (key && key !== "" && key !== "MY_GEMINI_API_KEY") {
      console.log(`[AI Commerce Server] Initializing GoogleGenAI client with User-Agent telemetry header (Key length: ${key.length})`);
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } else {
      console.warn("[AI Commerce Server] GEMINI_API_KEY environment variable is missing, empty, or set to placeholder.");
    }
  }
  return aiClient;
}

async function generateContentWithRetry(ai: any, params: any, maxRetries = 3, initialDelay = 1000): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      attempt++;
      const status = error.status || (error.code ? Number(error.code) : null);
      const isRetriable = 
        status === 503 || 
        status === 429 || 
        status === 500 || 
        status === 504 ||
        (error.message && (
          error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("UNAVAILABLE") || 
          error.message.includes("RESOURCE_EXHAUSTED") || 
          error.message.includes("high demand") ||
          error.message.toLowerCase().includes("unexpected token") ||
          error.message.toLowerCase().includes("not valid json") ||
          error.message.toLowerCase().includes("doctype") ||
          error.message.toLowerCase().includes("service unavailable")
        ));

      if (isRetriable && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[AI Commerce Server] Gemini API returned retriable error (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`, error.message || error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Global products store in-memory (starts with sample products)
// Allows add/edit/delete in memory so changes are immediately reflected
let inMemoryProducts = [...SAMPLE_PRODUCTS];

// API Route: Get all products
app.get("/api/products", (req, res) => {
  res.json(inMemoryProducts);
});

// API Route: Add a product (Seller Dashboard)
app.post("/api/products", (req, res) => {
  const newProduct = req.body;
  if (!newProduct.id) {
    newProduct.id = "prod-" + Date.now();
  }
  newProduct.createdAt = new Date().toISOString();
  inMemoryProducts.push(newProduct);
  res.status(201).json(newProduct);
});

// API Route: Edit a product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    inMemoryProducts[index] = { ...inMemoryProducts[index], ...updatedData };
    res.json(inMemoryProducts[index]);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// API Route: Delete a product
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const index = inMemoryProducts.findIndex((p) => p.id === id);
  if (index !== -1) {
    inMemoryProducts.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

function filterProductsForQuery(queryText: string, allProducts: any[]): { filtered: any[], isExactMatch: boolean } {
  const lowerQuery = (queryText || "").toLowerCase().trim();
  if (!lowerQuery) {
    return { filtered: allProducts, isExactMatch: true };
  }

  // 1. Identify category keyword matches
  const keywordToCategories: Record<string, string[]> = {
    "shoe": ["Shoes"],
    "sneaker": ["Shoes"],
    "runner": ["Shoes"],
    "boots": ["Shoes"],
    "loafer": ["Shoes"],
    "footwear": ["Shoes"],
    "brogue": ["Shoes"],
    "sandals": ["Shoes"],
    "book": ["Books"],
    "read": ["Books"],
    "novel": ["Books"],
    "guide": ["Books"],
    "jewel": ["Jewellery"],
    "ring": ["Jewellery"],
    "gold": ["Jewellery"],
    "silver": ["Jewellery"],
    "pendant": ["Jewellery"],
    "diamond": ["Jewellery"],
    "earring": ["Jewellery"],
    "necklace": ["Jewellery"],
    "bangle": ["Jewellery"],
    "choker": ["Jewellery"],
    "grocery": ["Grocery"],
    "atta": ["Grocery"],
    "dal": ["Grocery"],
    "oil": ["Grocery"],
    "sugar": ["Grocery"],
    "tea": ["Grocery"],
    "coffee": ["Grocery"],
    "milk": ["Grocery"],
    "bread": ["Grocery"],
    "biscuit": ["Grocery"],
    "snack": ["Grocery"],
    "masala": ["Grocery"],
    "noodle": ["Grocery"],
    "juice": ["Grocery"],
    "dry fruit": ["Grocery"],
    "honey": ["Grocery"],
    "rice": ["Grocery"],
    "salt": ["Grocery"],
    "almond": ["Grocery"],
    "beauty": ["Beauty"],
    "cream": ["Beauty"],
    "serum": ["Beauty"],
    "cleanser": ["Beauty"],
    "makeup": ["Beauty"],
    "kitchen": ["Kitchen"],
    "cooker": ["Kitchen"],
    "blender": ["Kitchen"],
    "juicer": ["Kitchen"],
    "espresso": ["Kitchen"],
    "pan": ["Kitchen"],
    "decor": ["Home Decor"],
    "vase": ["Home Decor"],
    "candle": ["Home Decor"],
    "cushion": ["Home Decor"],
    "rug": ["Home Decor"],
    "wall art": ["Home Decor"],
    "laptop": ["Laptops"],
    "notebook": ["Laptops"],
    "macbook": ["Laptops"],
    "mobile": ["Mobiles"],
    "phone": ["Mobiles"],
    "iphone": ["Mobiles"],
    "watch": ["Watches"],
    "fashion": ["Fashion", "Men", "Women"],
    "shirt": ["Fashion", "Men", "Women"],
    "dress": ["Fashion", "Men", "Women"],
    "kurta": ["Fashion", "Men", "Women"],
    "jacket": ["Fashion", "Men", "Women"],
    "furniture": ["Furniture"],
    "chair": ["Furniture"],
    "table": ["Furniture"],
    "gaming": ["Gaming"],
    "game": ["Gaming"],
    "headphone": ["Electronics"],
    "earphone": ["Electronics"],
    "soundbar": ["Electronics"],
    "audio": ["Electronics"]
  };

  // Find targeted categories based on keywords
  const targetedCategoriesSet = new Set<string>();
  for (const [kw, cats] of Object.entries(keywordToCategories)) {
    if (lowerQuery.includes(kw)) {
      cats.forEach(c => targetedCategoriesSet.add(c));
    }
  }

  const targetedCategories = Array.from(targetedCategoriesSet);

  // Parse maximum price from query if present (e.g. "under 1000", "under 10k", "below rs 10000", "under ₹10000")
  let maxPriceLimit: number | null = null;
  
  // Regex to extract price values with "under/below/less than/within" followed by optional currency/spacing and number with optional "k"
  const priceRegex = /(?:under|below|less than|within|budget of)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(k\b)?/i;
  const match = lowerQuery.match(priceRegex);
  if (match) {
    let priceVal = parseFloat(match[1]);
    const isK = !!match[2];
    if (isK || (lowerQuery.includes(match[1] + "k"))) {
      priceVal *= 1000;
    }
    maxPriceLimit = priceVal;
  } else {
    // Fallback search for patterns like "under 10k" where the 'k' might be attached to the number
    const kRegex = /(?:under|below|less than|within|budget of)\s*(?:rs\.?|₹)?\s*(\d+)\s*k/i;
    const kMatch = lowerQuery.match(kRegex);
    if (kMatch) {
      maxPriceLimit = parseInt(kMatch[1], 10) * 1000;
    }
  }

  // 2. Filter products
  let filtered = allProducts;
  let isExactMatch = false;

  if (targetedCategories.length > 0) {
    // Strict category filtering! If user asks for shoes, show ONLY shoes.
    filtered = allProducts.filter(p => p.category && targetedCategories.includes(p.category));
    
    // Also apply price limit if parsed
    if (maxPriceLimit !== null) {
      filtered = filtered.filter(p => p.price <= maxPriceLimit);
    }
    isExactMatch = filtered.length > 0;
  } else {
    // If no specific category keyword matches, search titles, descriptions, categories, specifications
    filtered = allProducts.filter(p => {
      const matchName = p.name?.toLowerCase().includes(lowerQuery) || p.title?.toLowerCase().includes(lowerQuery);
      const matchDesc = p.description?.toLowerCase().includes(lowerQuery);
      const matchCat = p.category?.toLowerCase().includes(lowerQuery);
      const matchBrand = p.brand?.toLowerCase().includes(lowerQuery);
      return matchName || matchDesc || matchCat || matchBrand;
    });

    // Apply price limit if parsed
    if (maxPriceLimit !== null) {
      filtered = filtered.filter(p => p.price <= maxPriceLimit);
    }
    isExactMatch = filtered.length > 0;
  }

  if (!isExactMatch) {
    // If no exact match found, we select closest relevant products.
    // Return a small subset of high-rating premium products as closest alternatives
    filtered = allProducts.filter(p => p.rating >= 4.5);
    if (maxPriceLimit !== null) {
      filtered = filtered.filter(p => p.price <= maxPriceLimit);
    }
    filtered = filtered.slice(0, 6);
  }

  return { filtered, isExactMatch };
}

// AI Shopping Assistant chat route
app.post("/api/chat", async (req, res) => {
  const { messages, products } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format" });
  }

  const lastUserMsg = messages[messages.length - 1]?.content || "";
  const ai = getGeminiAI();

  // Use the products from client (synchronized with Firestore) if available, fallback to server's in-memory catalog
  const activeProducts = products && Array.isArray(products) && products.length > 0 ? products : inMemoryProducts;

  // Perform precise pre-filtering based on query
  const { filtered, isExactMatch } = filterProductsForQuery(lastUserMsg, activeProducts);

  // Create context from filtered products
  const catalogContext = filtered.map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: `₹${p.price}`,
    originalPrice: `₹${p.originalPrice}`,
    discount: `${p.discount || 0}% off`,
    rating: p.rating,
    stock: p.stock,
    description: p.description,
    specs: p.specifications || {}
  }));

  const systemInstruction = `You are the ultimate AI Shopping Assistant for "AI Commerce" (tagline: Future of Intelligent Shopping), a premium e-commerce marketplace.
Your tone is professional, friendly, elegant, and intelligent.
Always quote all prices in Indian Rupees (₹) only. Do NOT use US Dollars ($).

We have filtered our product catalog to match the user's specific query.
The matches available are:
${JSON.stringify(catalogContext, null, 2)}

Is this an exact match to the query? ${isExactMatch ? "YES" : "NO"}

Your strict rules:
1. Recommend products ONLY according to the user query. Do NOT suggest unrelated products (e.g. if the user asks for shoes, show ONLY shoes from the available matches. Never suggest earphones or books when they ask for shoes).
2. If exact products are not available (exact match is "NO"), you MUST politely say no exact match is available in our catalog, and then show the closest relevant products from the provided matches.
3. If a product has low stock (stock < 5), mention it to create urgency (e.g., "Only 3 left in stock!"). If stock is 0, do not recommend it.
4. When recommending any product, you MUST include its exact name (e.g. "Puma Ignite Hybrid Sports Running Shoes") exactly as written in the catalog so that our interactive interface can render "+Cart" buttons. Do not abbreviate or modify names.
5. When comparing, use beautiful markdown tables.
6. Keep answers clean, beautifully formatted in Markdown. Avoid self-praise.`;

  if (!ai) {
    // Elegant fallback simulation using filtered catalog products
    console.log("Gemini API key is not configured. Simulating filtered response.");
    let reply = "";

    if (!isExactMatch) {
      reply = `I apologize, but we do not have an exact match for your search in our premium inventory. However, here are some of our closest relevant luxury items that you might love:\n\n`;
      filtered.slice(0, 3).forEach((p, idx) => {
        reply += `${idx + 1}. **${p.name}** — **₹${p.price.toLocaleString("en-IN")}** (Rating: ${p.rating}★)\n   *${p.description}*\n\n`;
      });
      reply += `Feel free to browse our categories which have now been fully stocked with Jewellery, Groceries, Home Decor, Books, Beauty products, and Shoes!`;
    } else {
      reply = `### Tailored Recommendations matching your search\n\nBased on your query, here are the most relevant premium matches from our catalog:\n\n`;
      filtered.slice(0, 3).forEach((p, idx) => {
        reply += `${idx + 1}. **${p.name}** — **₹${p.price.toLocaleString("en-IN")}** (Rating: ${p.rating}★, Category: ${p.category})\n   *${p.description}*\n   *Specifications:* ${Object.entries(p.specifications || {}).map(([k, v]) => `${k}: ${v}`).join(", ")}\n\n`;
      });
      reply += `Would you like me to add any of these matches directly to your cart?`;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return res.json({ content: reply });
  }

  try {
    const rawContents = messages.map(m => ({
      role: m.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: m.content }]
    }));

    const contents: typeof rawContents = [];
    for (const msg of rawContents) {
      if (contents.length === 0) {
        if (msg.role === "user") {
          contents.push(msg);
        }
      } else {
        const last = contents[contents.length - 1];
        if (last.role === msg.role) {
          last.parts[0].text += "\n" + msg.parts[0].text;
        } else {
          contents.push(msg);
        }
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: "No user messages provided for AI completion" });
    }

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Lower temperature for more exact adherence
      }
    });

    const reply = response.text || "I apologize, but I could not formulate a response at this moment. How else may I assist you today?";
    res.json({ content: reply });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error.message || String(error);
    const errorStatus = error.status || (error.code ? Number(error.code) : null);
    const is503 = errorStatus === 429 ||
                  errorStatus === 503 ||
                  errorMsg.includes("429") ||
                  errorMsg.includes("503") ||
                  errorMsg.toLowerCase().includes("quota") ||
                  errorMsg.toLowerCase().includes("resource_exhausted") ||
                  errorMsg.toLowerCase().includes("limit") ||
                  errorMsg.toLowerCase().includes("exceeded") ||
                  errorMsg.toLowerCase().includes("unavailable") || 
                  errorMsg.toLowerCase().includes("high demand") ||
                  errorMsg.toLowerCase().includes("busy") ||
                  errorMsg.toLowerCase().includes("unexpected token") ||
                  errorMsg.toLowerCase().includes("not valid json") ||
                  errorMsg.toLowerCase().includes("doctype") ||
                  errorMsg.toLowerCase().includes("service unavailable");
    res.status(is503 ? 503 : 500).json({ error: "Failed to communicate with AI: " + errorMsg });
  }
});

// API Route: AI Intelligent Search
app.post("/api/ai-search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  const ai = getGeminiAI();

  if (!ai) {
    // Simulate keyword-based fuzzy search if API key is missing
    const q = query.toLowerCase();
    const matches = inMemoryProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
    const results = matches.map(m => m.id);
    const explanation = `Found ${results.length} products matching "${query}" using smart keyword matching. Configure GEMINI_API_KEY in secrets for semantic AI query understanding.`;
    return res.json({ productIds: results, explanation });
  }

  try {
    const catalogBrief = inMemoryProducts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      brand: p.brand
    }));

    const prompt = `You are a semantic search query understander.
Analyze the user's natural language search query: "${query}"
Determine which of the following products from our catalog match this query best.
Catalog: ${JSON.stringify(catalogBrief, null, 2)}

Respond ONLY with a JSON object of this exact schema:
{
  "productIds": ["prod-id1", "prod-id2"],
  "explanation": "A one-sentence human explanation of why these match"
}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("AI Search Error:", error);
    // Fallback to keyword matching on error
    const q = query.toLowerCase();
    const results = inMemoryProducts
      .filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .map(p => p.id);
    res.json({ productIds: results, explanation: "Fuzzy keyword fallback due to AI exception." });
  }
});

// API Route: Compare products
app.post("/api/compare", async (req, res) => {
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ error: "Invalid product IDs" });
  }

  const selectedProducts = inMemoryProducts.filter(p => productIds.includes(p.id));
  if (selectedProducts.length === 0) {
    return res.json({ comparison: "No matching products to compare." });
  }

  const ai = getGeminiAI();
  if (!ai) {
    // Generate standard markdown table
    let table = `### Product Comparison\n\n`;
    table += `| Feature | ` + selectedProducts.map(p => p.name).join(" | ") + ` |\n`;
    table += `| --- | ` + selectedProducts.map(() => "---").join(" | ") + ` |\n`;
    table += `| **Price** | ` + selectedProducts.map(p => `$${p.price}`).join(" | ") + ` |\n`;
    table += `| **Brand** | ` + selectedProducts.map(p => p.brand).join(" | ") + ` |\n`;
    table += `| **Rating** | ` + selectedProducts.map(p => `★ ${p.rating}`).join(" | ") + ` |\n`;
    table += `| **Key Specs** | ` + selectedProducts.map(p => Object.entries(p.specifications).slice(0,2).map(([k,v]) => `${k}: ${v}`).join(", ")).join(" | ") + ` |\n`;
    table += `\n\n*Note: Configure GEMINI_API_KEY to see detailed intelligent comparison pros and cons.*`;
    return res.json({ comparison: table });
  }

  try {
    const prompt = `Compare these products in detail. Create a clean, beautiful Markdown comparison table, then provide structured bullet points listing the "Pros and Cons" and a final "AI Recommendation" based on use cases.
Products: ${JSON.stringify(selectedProducts, null, 2)}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ comparison: response.text || "Comparison error" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Route: Summarize reviews
app.post("/api/summarize-reviews", async (req, res) => {
  const { reviews } = req.body;
  if (!reviews || !Array.isArray(reviews)) {
    return res.status(400).json({ error: "No reviews provided" });
  }

  if (reviews.length === 0) {
    return res.json({ summary: "No reviews available yet to summarize." });
  }

  const ai = getGeminiAI();
  if (!ai) {
    return res.json({
      summary: `### Review Summary (AI Sandbox Mode)\n\nBased on ${reviews.length} customer reviews, buyers generally give this product positive ratings. Pros include build quality, ease of use, and premium feel. To see automated AI semantic review sentiment analysis, configure the Google Gemini API key.`
    });
  }

  try {
    const prompt = `Analyze these customer reviews for a product. Provide a concise summary of user sentiment, highlighting the Key Pros, Key Cons, and an overall purchase decision verdict.
Reviews: ${JSON.stringify(reviews, null, 2)}`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ summary: response.text || "Summary error" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for API routes to return clean JSON error instead of falling through to Vite or SPA static index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.url}` });
});

// Serve Vite or static assets depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Commerce Server] Express running on http://localhost:${PORT}`);
  });
}

startServer();
