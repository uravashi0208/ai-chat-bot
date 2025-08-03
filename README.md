  ┌───────────────────────────────────────────────────────────────┐
  │                        Client Application                      │
  │  ┌─────────────┐    ┌─────────────┐        ┌─────────────┐    │
  │  │   Auth      │    │   Chat      │        │   Real-time │    │
  │  │  Context    │◄──►│  Context    │◄──────►│  Socket     │    │
  │  └─────────────┘    └─────────────┘        │  Service    │    │
  │         ▲                  ▲               └─────────────┘    │
  │         │                  │                      ▲           │
  │         ▼                  ▼                      │           │
  │  ┌─────────────┐    ┌─────────────┐        ┌─────┴───────┐    │
  │  │  Auth       │    │  Chat       │        │  WebSocket  │    │
  │  │  Service    │    │  Service    │        │  Client     │    │
  │  └─────────────┘    └─────────────┘        └─────────────┘    │
  └───────────────────────────────────────────────────────────────┘
                                   ▲
                                   │
                                   ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                        API Gateway                            │
  │  ┌─────────────────────────────────────────────────────────┐  │
  │  │                    Load Balancer                        │  │
  │  └─────────────────────────────────────────────────────────┘  │
  │                          ▲                                    │
  │                          │                                    │
  │                          ▼                                    │
  │  ┌─────────────┐    ┌─────────────┐        ┌─────────────┐    │
  │  │  Auth       │    │  Chat       │        │  Socket     │    │
  │  │  Service    │    │  Service    │        │  Service    │    │
  │  └─────────────┘    └─────────────┘        └─────────────┘    │
  │         │                  │                      ▲           │
  │         ▼                  ▼                      │           │
  │  ┌─────────────┐    ┌─────────────┐        ┌─────┴───────┐    │
  │  │  User       │    │  Message    │        │  WebSocket  │    │
  │  │  Database   │    │  Database   │        │  Server     │    │
  │  └─────────────┘    └─────────────┘        └─────────────┘    │
  └───────────────────────────────────────────────────────────────┘




  Key Technical Decisions
1. State Management Architecture
Implemented a hybrid state management solution combining:
React Context for global application state
Local component state for UI-specific state
Optimized re-renders using React.memo and useCallback
Rationale: Provides scalability while maintaining performance

2. Real-time Communication
WebSocket implementation features:
Connection heartbeat (30s interval)
Automatic reconnection strategy
Message acknowledgement protocol
Presence detection
Fallback to long-polling when WebSockets unavailable
