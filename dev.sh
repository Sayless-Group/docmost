#!/bin/bash
# Runs only the Vite frontend dev server.
# All API/collab/websocket requests proxy to the running docmost Docker container at localhost:3000.
set -e

pnpm --filter ./apps/client run dev
