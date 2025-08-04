# AI Agent Server - Pluggable Backend with RAG + Memory

A TypeScript-based AI agent server featuring Retrieval-Augmented Generation (RAG), session memory, and a plugin system for weather and math operations.

## 🚀 Features

- **Conversational AI**: Google Gemini 1.5 Flash powered responses with context awareness
- **Unified AI Architecture**: Single provider (Gemini) for both chat completion and embeddings
- **Persistent Vector Store**: Smart caching system that only processes new/changed documents
- **Session Memory**: Persistent conversation history per session
- **RAG System**: Gemini-powered vector embeddings for enhanced document retrieval
- **Plugin System**: Extensible architecture with weather and math plugins
- **RESTful API**: Clean Express.js endpoints with proper error handling
- **TypeScript**: Fully typed codebase for reliability and maintainability

## 📋 Prerequisites

- Node.js 18+ 
- Google Gemini API key (for both chat and embeddings)
- (Optional) Weather API key from OpenWeatherMap

## 🛠️ Installation

1. **Clone and navigate to the project**:
   ```bash
   cd c:\Users\USER\Desktop\intern
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env` file and add your API keys:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   WEATHER_API_KEY=your_weather_api_key_here  # Optional
   PORT=3000
   NODE_ENV=development
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### 🤖 Agent Communication

**POST** `/agent/message`
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather in London?",
    "session_id": "user123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "The current weather in London is...",
    "session_id": "user123",
    "timestamp": "2024-08-08T12:00:00.000Z",
    "plugins_used": ["weather"],
    "context_retrieved": true
  }
}
```

### 📊 System Health

**GET** `/agent/health`
```bash
curl http://localhost:3000/agent/health
```

### 📈 Session Management

**GET** `/agent/session/{sessionId}/stats`
```bash
curl http://localhost:3000/agent/session/user123/stats
```

**DELETE** `/agent/session/{sessionId}`
```bash
curl -X DELETE http://localhost:3000/agent/session/user123
```

**GET** `/agent/vector-store-info`
```bash
curl http://localhost:3000/agent/vector-store-info
```

**POST** `/agent/rebuild-vector-store`
```bash
curl -X POST http://localhost:3000/agent/rebuild-vector-store
```

### 🔧 Capabilities

**GET** `/agent/capabilities`
```bash
curl http://localhost:3000/agent/capabilities
```

## 🔌 Plugin System

### Weather Plugin
- **Triggers**: weather, temperature, forecast, climate keywords
- **Example**: "What's the weather in Paris?"
- **Data**: Temperature, conditions, humidity, wind speed

### Math Plugin  
- **Triggers**: Mathematical expressions and calculation keywords
- **Example**: "What is 2 + 2 * 5?"
- **Supports**: Basic arithmetic, complex expressions

## 📚 RAG (Retrieval-Augmented Generation)

The system uses Google Gemini for all AI operations with intelligent caching:
1. **Smart Loading**: Checks `vector_store.json` for existing embeddings
2. **Change Detection**: Only processes new or modified markdown files  
3. **Chunks** documents into manageable pieces (1000 chars with 200 char overlap)
4. **Embeds** using Google Gemini's text-embedding-004 model (768-dimensional vectors)
5. **Retrieves** top 3 relevant chunks for each query using cosine similarity
6. **Caches** embeddings to disk for fast subsequent startups
7. **Generates responses** using Gemini 1.5 Flash with injected context

**Performance Benefits:**
- First run: ~30-60 seconds (processes all documents)
- Subsequent runs: ~2-5 seconds (loads from cache)
- Smart updates: Only reprocesses changed files
- Single API provider: Simplified architecture and billing

**Supported Documents**:
- `daext-blogging-with-markdown-complete-guide.md`
- `webex-boosting-ai-performance-llm-friendly-markdown.md`
- `john-apostol-custom-markdown-blog.md`
- `just-files-nextjs-blog-with-react-markdown.md`
- `wikipedia-lightweight-markup-language.md`

## 🧠 Memory System

- **Session-based**: Each `session_id` maintains separate conversation history
- **Context window**: Last 4 messages included in prompts
- **Automatic cleanup**: Keeps only recent 20 messages per session
- **Persistent**: Memory persists during server uptime

## 🏗️ Architecture

```
├── src/
│   ├── index.ts                 # Server entry point
│   ├── types/index.ts           # TypeScript interfaces
│   ├── services/
│   │   ├── agentService.ts      # Main agent orchestration
│   │   ├── geminiService.ts     # Google Gemini API (chat + embeddings)
│   │   ├── memoryService.ts     # Session memory management
│   │   ├── vectorStore.ts       # Vector search & similarity
│   │   ├── documentLoader.ts    # Document processing & chunking
│   │   └── persistentVectorStore.ts # Vector caching system
│   ├── plugins/
│   │   ├── pluginManager.ts     # Plugin orchestration
│   │   ├── weatherPlugin.ts     # Weather functionality
│   │   └── mathPlugin.ts        # Math calculations
│   ├── routes/
│   │   └── agent.ts             # API endpoints
│   └── middleware/
│       └── errorHandler.ts      # Error handling & validation
```

## 🔄 Agent Flow

1. **Receive** user message and session_id
2. **Store** message in session memory
3. **Retrieve** relevant context from vector store (using Gemini embeddings)
4. **Execute** applicable plugins (weather/math)
5. **Generate** system prompt with memory + context + plugin results
6. **Query** OpenAI GPT-3.5-turbo for response
7. **Store** AI response in memory
8. **Return** formatted response

## 📝 Sample Requests

### Weather Query
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the temperature in Tokyo?",
    "session_id": "demo1"
  }'
```

### Math Calculation
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Calculate 15 * 8 + 32",
    "session_id": "demo2"
  }'
```

### Knowledge Base Query
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about markdown blogging",
    "session_id": "demo3"
  }'
```

## 🚀 Deployment

The application is designed for easy deployment on:
- **Render**: Auto-deploy from GitHub
- **Railway**: Simple Node.js hosting
- **Vercel**: Serverless functions
- **Replit**: Instant cloud development

### Environment Variables for Production:
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
WEATHER_API_KEY=...  # Optional
PORT=3000
NODE_ENV=production
```

## 🧪 Testing

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Plugin Test:**
```bash
# Test weather plugin
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "weather in Mumbai", "session_id": "test"}'

# Test math plugin  
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "what is 100 / 4", "session_id": "test"}'
```

## 📊 Performance

- **Response Time**: ~2-4 seconds (including LLM calls)
- **Memory Usage**: Minimal, in-memory storage
- **Concurrent Sessions**: Supports multiple simultaneous users
- **Rate Limiting**: Handled by OpenAI API limits

## 🔧 Troubleshooting

**OpenAI/Gemini API Issues:**
- Verify `OPENAI_API_KEY` and `GEMINI_API_KEY` are valid
- Check API quota and billing for both services

**Vector Store Issues:**
- Ensure markdown files are in project root
- Check file permissions for reading documents

**Plugin Failures:**
- Weather plugin works with mock data if no API key
- Math plugin has comprehensive error handling

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the internship technical challenge**
