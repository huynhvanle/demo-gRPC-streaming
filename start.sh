#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

export JAVA_HOME="/Users/levanhuynh/Library/Java/JavaVirtualMachines/temurin-17.0.18/Contents/Home"
export PATH="$HOME/.nodejs/bin:$PATH"

echo "======================================================================"
echo "   KHOI DONG REAL-TIME SENSOR MONITORING SYSTEM (gRPC + FRONTEND)     "
echo "======================================================================"

# 1. Khoi dong Backend (SensorGateway tu dong kich hoat ca SensorServer 50051)
echo "[1/2] Dang khoi dong gRPC Server & Gateway (port 50051 & 8080)..."
./mvnw exec:java -Dexec.mainClass="com.example.grpc.SensorGateway" &
GATEWAY_PID=$!

# Doi 3 giay de Gateway san sang
sleep 3

# 2. Khoi dong Vite dev server
echo "[2/2] Dang khoi dong Vite Frontend Dev Server (port 5173)..."
cd frontend
npm run dev &
VITE_PID=$!

echo "----------------------------------------------------------------------"
echo "(*) HE THONG DA SAN SANG!"
echo "    -> Link 1 (Khuyen dung - Dev Mode) : http://localhost:5173"
echo "    -> Link 2 (Production tinh hop)    : http://localhost:8080"
echo "    -> gRPC Server                     : localhost:50051"
echo "(*) Nhan Ctrl+C de dung tat ca he thong."
echo "----------------------------------------------------------------------"

trap "kill $GATEWAY_PID $VITE_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM
wait
