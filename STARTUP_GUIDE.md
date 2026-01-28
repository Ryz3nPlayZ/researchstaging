# 🚀 Startup Scripts Guide

All scripts are in: `/home/zemul/Programming/research/`

---

## Quick Start (Recommended)

```bash
cd /home/zemul/Programming/research

# Option 1: Start backend (auto-starts Redis)
./start-backend.sh

# Option 2: Start everything in background
./start-all.sh --background
```

---

## Available Scripts

### 1. **start-redis.sh** - Redis Server
```bash
./start-redis.sh
```
- Starts Redis on port 6379
- Checks if already running (won't duplicate)
- Auto-started by `start-backend.sh`

### 2. **start-backend.sh** - Backend API
```bash
./start-backend.sh
```
- **Auto-starts Redis** if not running
- Starts FastAPI server on port 8000
- API Docs: http://localhost:8000/docs

### 3. **start-frontend-v2.sh** - Your New Frontend
```bash
./start-frontend-v2.sh
```
- Starts on port 3001
- Your development workspace

### 4. **start-frontend-v1.sh** - Reference UI
```bash
./start-frontend-v1.sh
```
- Starts on port 3000
- For reference only (old design)

### 5. **start-all.sh** - Master Script
```bash
# Interactive mode (shows instructions)
./start-all.sh

# Background mode (starts everything)
./start-all.sh --background
```

---

## Startup Order

**Redis is auto-started**, so you don't need to start it manually:

1. ✅ `./start-backend.sh` (starts Redis + backend)
2. ✅ `./start-frontend-v2.sh` (your frontend)
3. ✅ `./start-frontend-v1.sh` (optional reference)

---

## Stop Services

### Stop All:
```bash
pkill -f 'uvicorn server:app'
pkill -f 'react-scripts'
redis-cli shutdown
```

### Stop Individual:
```bash
# Backend
pkill -f 'uvicorn server:app'

# Frontend V2
pkill -f 'PORT=3001'

# Frontend V1
pkill -f 'node.*frontend'  # careful: stops all

# Redis
redis-cli shutdown
```

---

## Verify Services

```bash
# Redis
redis-cli ping
# Should return: PONG

# Backend
curl http://localhost:8000/
# Should return JSON

# Frontend V2
curl http://localhost:3001
# Should return HTML

# Frontend V1
curl http://localhost:3000
# Should return HTML
```

---

## Common Issues

### Port Already in Use
```bash
# Find what's using the port
lsof -i :8000  # backend
lsof -i :3000  # v1 frontend
lsof -i :3001  # v2 frontend
lsof -i :6379  # redis

# Kill the process
kill -9 <PID>
```

### Redis Warning (Memory Overcommit)
**Ignore this warning** - it's harmless:
```
WARNING Memory overcommit must be enabled!
```

To fix permanently (optional):
```bash
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory=1" | sudo tee -a /etc/sysctl.conf
```

### Backend Won't Start
1. Check Redis: `redis-cli ping`
2. Check logs: `tail -f /tmp/backend.log`
3. Verify venv exists: `ls backend/venv/bin/python`

---

## URLs

- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Frontend V2:** http://localhost:3001
- **Frontend V1:** http://localhost:3000

---

## Tips

1. **Use 3 separate terminals** (recommended for development)
2. **V1 is just for reference** - don't edit it
3. **Backend auto-starts Redis** - no need to run start-redis.sh manually
4. **Check background processes:** `ps aux | grep -E "(uvicorn|redis|react-scripts)"`

---

**Happy coding!** 🚀
