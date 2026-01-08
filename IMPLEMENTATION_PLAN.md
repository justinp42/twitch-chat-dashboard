# Twitch Chat Intelligence Platform
## Complete Project Phases & Implementation Guide

---

## Executive Summary

This document outlines the complete development roadmap for the Twitch Chat Intelligence Platform - a real-time analytics dashboard that monitors Twitch chat streams, calculates engagement metrics, and automatically detects viral "hype moments" for clip creators.

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Python/FastAPI + React/TypeScript + SQLite + WebSocket |
| **Approach** | Phase-by-phase implementation |
| **Test Channel** | jasontheween |
| **Target Completion** | February 2026 |

---

# Phase 0: Prerequisites & Setup

## Objective
Establish all required accounts, credentials, and development environment before writing any code.

## Duration
1-2 hours

## Tasks

### Task 0.1: Twitch Developer Application Registration
1. Navigate to https://dev.twitch.tv/console
2. Log in with your Twitch account
3. Click "Register Your Application"
4. Configure application:
   - **Name:** Use a unique name (e.g., `ChatAnalytics-[your-username]`)
   - **OAuth Redirect URLs:** `http://localhost:3000`
   - **Category:** Analytics Tool
5. Save and record your **Client ID**
6. Generate and record your **Client Secret**

### Task 0.2: Generate Access Token
1. Visit https://twitchtokengenerator.com
2. Select the `chat:read` scope (minimum required for reading chat)
3. Authorize with your Twitch account
4. Save the generated **Access Token**

### Task 0.3: Development Environment Setup
1. Ensure Python 3.11+ is installed
2. Ensure Node.js 18+ is installed
3. Install Git if not present
4. Choose IDE (VS Code recommended)

## Deliverables
- [ ] Twitch Client ID obtained
- [ ] Twitch Client Secret obtained
- [ ] Access Token generated
- [ ] Development tools installed

---

# Phase 1: Core Chat Ingestion

## Objective
Establish a working connection to Twitch IRC and capture live chat messages from any public channel.

## Duration
1 week

## What We're Building
A Python backend service that connects to Twitch's IRC servers using the `twitchio` library, parses incoming chat messages, and stores them in an in-memory buffer for processing.

## Architecture
```
Twitch IRC Servers ──► twitchio Client ──► Message Parser ──► Memory Buffer
```

## Tasks

### Task 1.1: Backend Project Scaffolding
**What:** Create the foundational project structure and install dependencies.

**Files to Create:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py
│   └── models/
│       └── __init__.py
├── requirements.txt
├── .env.example
└── .gitignore
```

**Dependencies (requirements.txt):**
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
twitchio==2.8.2
websockets==12.0
python-dotenv==1.0.0
pydantic==2.5.3
sqlalchemy==2.0.25
aiosqlite==0.19.0
```

### Task 1.2: Configuration Management
**What:** Create a centralized configuration system using Pydantic BaseSettings.

**File:** `backend/app/config.py`

**Configuration Values:**
| Variable | Description | Example |
|----------|-------------|---------|
| `TWITCH_CLIENT_ID` | OAuth Client ID | `abc123...` |
| `TWITCH_CLIENT_SECRET` | OAuth Client Secret | `xyz789...` |
| `TWITCH_ACCESS_TOKEN` | Chat access token | `oauth:...` |
| `DEFAULT_CHANNELS` | Comma-separated channel list | `jasontheween` |
| `MESSAGE_BUFFER_SIZE` | Max messages in memory | `10000` |

### Task 1.3: Data Models
**What:** Define Pydantic models for type-safe message handling.

**File:** `backend/app/models/chat_message.py`

**ChatMessage Model:**
```python
class ChatMessage:
    id: str              # Unique message ID from Twitch
    channel: str         # Channel name (without #)
    username: str        # Sender's display name
    content: str         # Message text content
    timestamp: datetime  # UTC timestamp
    emotes: List[str]    # Emote codes used in message
    badges: List[str]    # User badges (sub, mod, vip, etc.)
```

### Task 1.4: Twitch IRC Client
**What:** Implement the core IRC connection using twitchio.

**File:** `backend/app/services/twitch_client.py`

**Functionality:**
- Connect to Twitch IRC servers (`irc.chat.twitch.tv`)
- Join specified channels on startup
- Parse incoming messages into ChatMessage objects
- Extract emotes from message tags
- Extract badges from user data
- Handle disconnection with automatic reconnection
- Support dynamic channel join/leave

### Task 1.5: Message Buffer Service
**What:** In-memory storage for recent messages using thread-safe deques.

**File:** `backend/app/services/message_buffer.py`

**Functionality:**
- Store messages per channel in separate deques
- Enforce maximum buffer size (10,000 messages default)
- Retrieve messages since a given timestamp
- List all active channels

### Task 1.6: CLI Verification Script
**What:** A standalone script to verify the Twitch connection works.

**File:** `backend/cli_test.py`

**Expected Output:**
```
Connected to Twitch IRC
Joined channel: jasontheween
[jasontheween] UserA: Hello everyone!
[jasontheween] UserB: KEKW KEKW
[jasontheween] UserC: PogChamp that was insane
```

## Deliverables
- [ ] Backend project structure created
- [ ] Twitch IRC connection established
- [ ] Messages parsed with username, content, timestamp, emotes, badges
- [ ] Multi-channel support working
- [ ] CLI script prints live chat messages

## Success Criteria
- Connect to jasontheween channel
- Messages appear in console within 5 seconds of being sent
- No disconnection errors over 10-minute test period

---

# Phase 2: Real-Time Dashboard

## Objective
Build a complete full-stack application with FastAPI WebSocket backend and React frontend that displays live-updating metrics.

## Duration
2-3 weeks

## What We're Building
A FastAPI server that calculates metrics from the message buffer and broadcasts them via WebSocket, plus a React dashboard that visualizes these metrics in real-time.

## Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Twitch IRC     │────►│  FastAPI Backend │────►│  React Frontend │
│  (twitchio)     │     │  (WebSocket)     │     │  (Recharts)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Message Buffer      Metrics Calculator
```

## Tasks

### Task 2.1: FastAPI Application Setup
**What:** Create the main FastAPI application with lifespan management.

**File:** `backend/app/main.py`

**Functionality:**
- Initialize FastAPI app with CORS middleware
- Start Twitch client on application startup
- Start metrics broadcast loop (1 Hz)
- Graceful shutdown handling
- Include all API routers

### Task 2.2: Database Setup
**What:** Configure SQLite with SQLAlchemy for hype event persistence.

**File:** `backend/app/db/database.py`

**Tables:**
| Table | Purpose |
|-------|---------|
| `hype_events` | Store detected hype moments with timestamps |

### Task 2.3: Metrics Calculator Service
**What:** Aggregate raw messages into actionable metrics.

**File:** `backend/app/services/metrics_calculator.py`

**Metrics Calculated:**
| Metric | Description | Window |
|--------|-------------|--------|
| `messages_per_second` | Current chat velocity | 1 second |
| `messages_last_minute` | Message count | 60 seconds |
| `unique_chatters_5min` | Unique usernames | 5 minutes |
| `top_emotes` | Most used emotes with counts | 5 minutes |
| `avg_message_length` | Average characters per message | 5 minutes |

### Task 2.4: REST API Routes
**What:** Implement channel management and health endpoints.

**Files:** `backend/app/api/routes/`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/channels` | List all monitored channels |
| POST | `/api/channels` | Add a new channel to monitor |
| DELETE | `/api/channels/{name}` | Stop monitoring a channel |
| GET | `/api/health` | Health check with connection status |

### Task 2.5: WebSocket Endpoints
**What:** Real-time data streaming to frontend clients.

**Files:** `backend/app/api/websockets/`

**Endpoints:**
| Path | Description | Frequency |
|------|-------------|-----------|
| `/ws/metrics` | All channel metrics | Every 1 second |
| `/ws/channel/{name}` | Single channel metrics | Every 1 second |

**Message Format:**
```json
{
  "type": "metrics",
  "channel": "jasontheween",
  "timestamp": "2026-01-15T20:30:00Z",
  "messages_per_second": 12.5,
  "messages_last_minute": 423,
  "unique_chatters_5min": 156,
  "top_emotes": [["LUL", 89], ["KEKW", 67]],
  "avg_message_length": 18.3
}
```

### Task 2.6: Frontend Scaffolding
**What:** Initialize React project with TypeScript and required dependencies.

**Commands:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install recharts axios
```

**Project Structure:**
```
frontend/src/
├── App.tsx
├── components/
├── hooks/
├── services/
├── types/
└── styles/
```

### Task 2.7: TypeScript Type Definitions
**What:** Define interfaces matching backend data structures.

**File:** `frontend/src/types/index.ts`

**Interfaces:**
- `ChannelMetrics` - Metrics data from WebSocket
- `HypeEvent` - Hype event data
- `WebSocketMessage` - Generic message wrapper

### Task 2.8: WebSocket Hook
**What:** Custom React hook for WebSocket connection management.

**File:** `frontend/src/hooks/useWebSocket.ts`

**Features:**
- Automatic connection on mount
- Automatic reconnection with exponential backoff
- Connection state tracking
- Message parsing and state updates

### Task 2.9: Metrics Hook
**What:** Custom hook to manage metrics state and history.

**File:** `frontend/src/hooks/useMetrics.ts`

**Features:**
- Current metrics per channel
- 5-minute history for charting (300 data points)
- Channel switching support

### Task 2.10: Dashboard Components
**What:** Build all UI components for the dashboard.

**Components:**

| Component | Purpose | Update Frequency |
|-----------|---------|------------------|
| `VelocityGauge` | Large number showing messages/sec | 1 second |
| `ChattersCount` | Unique users in 5-minute window | 5 seconds |
| `VelocityChart` | Line chart of velocity over time | 1 second |
| `TopEmotes` | Sorted list of trending emotes | 5 seconds |
| `ChannelSelector` | Dropdown to switch/add channels | On demand |
| `Dashboard` | Main layout composing all components | - |

**VelocityGauge Color Coding:**
| Velocity | Color |
|----------|-------|
| < 50/sec | Green |
| 50-100/sec | Yellow |
| > 100/sec | Red |

### Task 2.11: API Service
**What:** HTTP client for REST API calls.

**File:** `frontend/src/services/api.ts`

**Functions:**
- `getChannels()` - Fetch monitored channels
- `addChannel(name)` - Add new channel
- `removeChannel(name)` - Remove channel
- `getHypeEvents()` - Fetch hype history

### Task 2.12: Deployment - Backend
**What:** Deploy FastAPI backend to Railway.

**Files:**
- `backend/Dockerfile` or `Procfile`
- Environment variables in Railway dashboard

**Procfile:**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Task 2.13: Deployment - Frontend
**What:** Deploy React frontend to Vercel.

**File:** `frontend/vercel.json`

**Configuration:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## Deliverables
- [ ] FastAPI backend running with WebSocket support
- [ ] React frontend connected and displaying live metrics
- [ ] Time-series chart updating in real-time
- [ ] Channel add/remove functionality working
- [ ] Deployed to Railway (backend) + Vercel (frontend)
- [ ] Public URL accessible and functional

## Success Criteria
- Dashboard loads within 3 seconds
- Metrics update every 1 second with < 100ms latency
- Chart displays 5 minutes of rolling data
- Can monitor 3+ channels simultaneously

---

# Phase 3: Hype Detection

## Objective
Implement automatic detection of viral moments when chat activity spikes significantly above normal levels.

## Duration
1-2 weeks

## What We're Building
A statistical algorithm that detects when chat velocity exceeds 2 standard deviations above the rolling 60-second mean, logs these events to SQLite, and pushes real-time alerts to the frontend.

## Architecture
```
Metrics Calculator ──► Hype Detector ──► SQLite Storage
                              │
                              ▼
                       WebSocket Alert ──► Frontend Alert Banner
```

## Algorithm
```
Spike Detected When:
  current_velocity > mean(last_60_seconds) + (2 × std_dev(last_60_seconds))

Cooldown: 30 seconds between alerts per channel
```

## Tasks

### Task 3.1: Hype Detector Service
**What:** Statistical spike detection engine.

**File:** `backend/app/services/hype_detector.py`

**Functionality:**
- Maintain 60-second rolling window of velocity values per channel
- Calculate mean and standard deviation of window
- Detect when current velocity exceeds threshold
- Enforce 30-second cooldown between alerts
- Return HypeEvent when spike detected

**Configuration:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `window_seconds` | 60 | Baseline calculation window |
| `threshold_std` | 2.0 | Standard deviations above mean |
| `cooldown_seconds` | 30 | Minimum time between alerts |

### Task 3.2: Hype Event Model & Persistence
**What:** Database model and repository for hype events.

**File:** `backend/app/models/hype_event.py`

**HypeEvent Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Auto-increment primary key |
| `channel` | str | Channel where spike occurred |
| `timestamp` | datetime | When spike was detected |
| `velocity` | float | Messages/sec at spike |
| `baseline_mean` | float | Rolling average before spike |
| `baseline_std` | float | Rolling std dev before spike |
| `top_emotes` | str | JSON of trending emotes at moment |

### Task 3.3: Hype Event Repository
**What:** Data access layer for hype events.

**File:** `backend/app/db/repositories/hype_event_repo.py`

**Functions:**
- `create(event)` - Save new hype event
- `get_all(channel, limit)` - Retrieve events with optional filter
- `export_csv(channel)` - Generate CSV export string

### Task 3.4: Hype Events API Routes
**What:** REST endpoints for hype event access.

**File:** `backend/app/api/routes/hype_events.py`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/hype-events` | List hype events (optional channel filter) |
| GET | `/api/hype-events/export` | Download events as CSV |

**CSV Export Format:**
```csv
channel,timestamp,velocity,baseline_mean,baseline_std,multiplier
jasontheween,2026-01-15T20:45:32Z,156.0,23.5,12.3,6.64
jasontheween,2026-01-15T21:02:15Z,203.0,31.2,18.7,6.51
```

### Task 3.5: Hype WebSocket
**What:** Real-time push notifications for hype events.

**File:** `backend/app/api/websockets/hype_ws.py`

**Endpoint:** `/ws/hype`

**Message Format:**
```json
{
  "type": "hype_event",
  "channel": "jasontheween",
  "timestamp": "2026-01-15T20:45:32Z",
  "velocity": 156.0,
  "baseline_mean": 23.5,
  "multiplier": 6.64
}
```

### Task 3.6: Integration with Metrics Loop
**What:** Connect hype detector to the main metrics broadcast loop.

**Modification:** `backend/app/main.py`

**Logic:**
```python
# In broadcast_metrics_loop():
for channel in channels:
    metrics = calculator.calculate_metrics(channel)
    hype_detector.record_velocity(channel, metrics.messages_per_second)

    hype_event = hype_detector.check_for_hype(channel, metrics.messages_per_second)
    if hype_event:
        await save_hype_event(hype_event)
        await broadcast_hype_alert(hype_event)
```

### Task 3.7: Hype Alert Component
**What:** Visual notification banner when hype is detected.

**File:** `frontend/src/components/HypeAlert/HypeAlert.tsx`

**Behavior:**
- Appears at top of dashboard when hype detected
- Shows velocity and timestamp
- Auto-dismisses after 10 seconds
- Pulsing animation to draw attention

### Task 3.8: Hype History Component
**What:** Scrollable list of past hype events with export.

**File:** `frontend/src/components/HypeHistory/HypeHistory.tsx`

**Features:**
- List of recent hype events (newest first)
- Timestamp, velocity, and visual intensity bar
- "Export CSV" button triggers download
- Filter by current channel

### Task 3.9: Hype WebSocket Hook
**What:** Subscribe to hype event notifications.

**File:** `frontend/src/hooks/useHypeEvents.ts`

**Features:**
- Connect to `/ws/hype` endpoint
- Maintain list of recent events
- Track latest event for alert display
- Fetch historical events on mount

## Deliverables
- [ ] Hype detection algorithm implemented with 2σ threshold
- [ ] Hype events stored in SQLite database
- [ ] Alerts appear on dashboard when spike detected
- [ ] Hype history panel shows past events
- [ ] Export functionality produces valid CSV
- [ ] Configurable sensitivity threshold

## Success Criteria
- Detects obvious chat spikes (verified manually)
- No false positives during normal chat activity
- Alerts appear within 2 seconds of spike
- CSV export contains accurate timestamps and multipliers

---

# Phase 4: Polish & Documentation

## Objective
Finalize the project for portfolio presentation with professional documentation and demo materials.

## Duration
1 week

## Tasks

### Task 4.1: README Documentation
**What:** Comprehensive project documentation.

**File:** `README.md`

**Sections:**
- Project overview with screenshot/GIF
- Features list
- Technology stack
- Architecture diagram
- Installation instructions
- Configuration guide
- Usage examples
- API documentation link
- Deployment guide

### Task 4.2: Architecture Diagram
**What:** Visual representation of system components.

**Include:**
- Twitch IRC connection
- Backend services
- Database
- WebSocket connections
- Frontend components
- Deployment infrastructure

### Task 4.3: Demo Video
**What:** 2-3 minute video showcasing the platform.

**Content:**
1. Introduction (10 sec)
2. Dashboard overview (30 sec)
3. Real-time metrics demonstration (45 sec)
4. Hype detection in action (45 sec)
5. Export functionality (20 sec)
6. Multi-channel support (20 sec)
7. Closing with tech stack (10 sec)

### Task 4.4: Resume Bullet Points
**What:** Quantified achievements for resume.

**Templates:**
> "Built real-time Twitch chat analytics platform processing **X** messages/second using WebSocket streaming, achieving **<100ms** dashboard latency across **3+** concurrent channel connections."

> "Implemented statistical hype detection algorithm identifying chat velocity spikes with **X%** accuracy, reducing manual VOD review time by **60%** for clip creation."

> "Deployed full-stack application (Python/FastAPI + React) to **Vercel + Railway**, serving users with **99%+** uptime."

### Task 4.5: Code Cleanup
**What:** Final code quality pass.

**Actions:**
- Remove debug console.logs
- Add meaningful comments where needed
- Ensure consistent formatting
- Remove unused imports/variables
- Verify all error handling is in place

## Deliverables
- [ ] Professional README with screenshots
- [ ] Architecture diagram
- [ ] Demo video recorded and uploaded
- [ ] 3+ quantified resume bullet points
- [ ] Clean, well-documented codebase

---

# Appendix: File Reference

## Backend Files
| File | Phase | Purpose |
|------|-------|---------|
| `backend/app/config.py` | 1 | Environment configuration |
| `backend/app/models/chat_message.py` | 1 | Chat message data model |
| `backend/app/services/twitch_client.py` | 1 | Twitch IRC connection |
| `backend/app/services/message_buffer.py` | 1 | In-memory message storage |
| `backend/cli_test.py` | 1 | CLI verification script |
| `backend/app/main.py` | 2 | FastAPI application |
| `backend/app/db/database.py` | 2 | SQLite database setup |
| `backend/app/services/metrics_calculator.py` | 2 | Metrics aggregation |
| `backend/app/api/routes/channels.py` | 2 | Channel REST endpoints |
| `backend/app/api/routes/health.py` | 2 | Health check endpoint |
| `backend/app/api/websockets/metrics_ws.py` | 2 | Metrics WebSocket |
| `backend/app/services/hype_detector.py` | 3 | Spike detection algorithm |
| `backend/app/models/hype_event.py` | 3 | Hype event model |
| `backend/app/api/routes/hype_events.py` | 3 | Hype events REST endpoints |
| `backend/app/api/websockets/hype_ws.py` | 3 | Hype alerts WebSocket |

## Frontend Files
| File | Phase | Purpose |
|------|-------|---------|
| `frontend/src/types/index.ts` | 2 | TypeScript interfaces |
| `frontend/src/hooks/useWebSocket.ts` | 2 | WebSocket connection hook |
| `frontend/src/hooks/useMetrics.ts` | 2 | Metrics state management |
| `frontend/src/services/api.ts` | 2 | REST API client |
| `frontend/src/components/Dashboard/` | 2 | Main dashboard layout |
| `frontend/src/components/VelocityGauge/` | 2 | Velocity display |
| `frontend/src/components/VelocityChart/` | 2 | Time-series chart |
| `frontend/src/components/TopEmotes/` | 2 | Emote leaderboard |
| `frontend/src/components/ChannelSelector/` | 2 | Channel management |
| `frontend/src/components/HypeAlert/` | 3 | Alert banner |
| `frontend/src/components/HypeHistory/` | 3 | Hype events list |
| `frontend/src/hooks/useHypeEvents.ts` | 3 | Hype state management |

---

# Quick Start Checklist

## Phase 0 (Prerequisites)
- [ ] Register Twitch developer app
- [ ] Obtain Client ID and Secret
- [ ] Generate Access Token
- [ ] Install Python 3.11+ and Node.js 18+

## Phase 1 (Chat Ingestion)
- [ ] Create backend project structure
- [ ] Install Python dependencies
- [ ] Implement config.py
- [ ] Implement ChatMessage model
- [ ] Implement TwitchClient
- [ ] Implement MessageBuffer
- [ ] Verify with CLI script

## Phase 2 (Dashboard)
- [ ] Create FastAPI main.py
- [ ] Set up SQLite database
- [ ] Implement MetricsCalculator
- [ ] Create REST API routes
- [ ] Create WebSocket endpoints
- [ ] Scaffold React frontend
- [ ] Implement WebSocket hooks
- [ ] Build all components
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel

## Phase 3 (Hype Detection)
- [ ] Implement HypeDetector
- [ ] Create HypeEvent model
- [ ] Add hype API routes
- [ ] Add hype WebSocket
- [ ] Build HypeAlert component
- [ ] Build HypeHistory component
- [ ] Test with live streams

## Phase 4 (Polish)
- [ ] Write comprehensive README
- [ ] Create architecture diagram
- [ ] Record demo video
- [ ] Draft resume bullets
- [ ] Final code cleanup
