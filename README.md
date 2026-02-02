# AI Agents MVP

AI-powered product development assistant with multiple specialized agents.

## Quick Start

### 1. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run backend
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Architecture

### AI Agents

1. **Business Agent (CPO/CRO)** - Main orchestrator
   - Owns product vision and strategy
   - Makes business decisions
   - Coordinates other agents
   - Escalates to CEO/Founder when needed

2. **Discovery Agent** - Market validation
   - Validates business ideas
   - Market research
   - GO/NO-GO recommendations

3. **Delivery Agent** - Requirements
   - User stories
   - MVP scope
   - System architecture

4. **Tech Lead Agent** - Technical decisions
   - Technology stack
   - Implementation planning
   - Effort estimation

### Tech Stack

**Backend:**
- Python 3.11+
- FastAPI
- SQLite (can switch to PostgreSQL)
- Anthropic Claude API

**Frontend:**
- React 18 + TypeScript
- TailwindCSS
- Zustand (state management)
- React Query (API calls)

## Project Structure

```
ai-agents-mvp/
├── backend/
│   ├── app/
│   │   ├── agents/       # AI Agents
│   │   ├── api/          # FastAPI routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── orchestrator/ # Agent orchestration
│   │   └── main.py       # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── store/        # Zustand stores
│   │   └── types/        # TypeScript types
│   └── package.json
│
└── README.md
```

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=sqlite+aiosqlite:///./ai_agents.db
ANTHROPIC_API_KEY=your-api-key-here
CHROMA_PERSIST_DIRECTORY=./chroma_db
SECRET_KEY=your-secret-key
DEBUG=true
```

## API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Chat
- `POST /api/chat/message` - Send message to agents
- `GET /api/chat/history/{project_id}` - Get chat history
- `GET /api/chat/conversations/{project_id}` - Get conversations
- `GET /api/chat/agents` - List available agents

## Usage

1. Create a new project with business goal
2. Describe your product idea in chat
3. Business Agent will ask clarifying questions
4. Agent will delegate to specialists as needed
5. CEO decisions will be escalated when significant

## License

MIT
