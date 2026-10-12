package com.example.grpc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.ClientCallStreamObserver;
import io.grpc.stub.ClientResponseObserver;
import io.grpc.stub.StreamObserver;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.websocket.WsContext;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * SensorGateway: Cầu nối (Bridge/Gateway) giữa Web Browser và Java gRPC Backend.
 * - Cung cấp REST API & WebSocket Server trên cổng 8080.
 * - Đóng vai trò là gRPC Client kết nối tới SensorServer (port 50051).
 * - Chuyển tiếp các thông điệp giữa Web Client (JSON/WebSocket) và gRPC Server (Protobuf/HTTP/2).
 */
public class SensorGateway {

    private static final int GATEWAY_PORT = 8080;
    private static final String GRPC_HOST = "localhost";
    private static final int GRPC_PORT = 50051;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ObjectMapper mapper = new ObjectMapper();
    private final ManagedChannel channel;
    private final SensorServiceGrpc.SensorServiceBlockingStub blockingStub;
    private final SensorServiceGrpc.SensorServiceStub asyncStub;

    // Lưu trữ trạng thái phiên WebSocket của từng kết nối trình duyệt
    private final Map<String, SessionState> sessions = new ConcurrentHashMap<>();

    private static class SessionState {
        volatile ClientCallStreamObserver<?> activeServerStreamCall;
        volatile StreamObserver<SensorData> clientStreamRequestObserver;
        volatile StreamObserver<SensorData> bidiStreamRequestObserver;

        void cleanup() {
            if (activeServerStreamCall != null) {
                try {
                    activeServerStreamCall.cancel("Client disconnected", null);
                } catch (Exception ignored) {}
                activeServerStreamCall = null;
            }
            if (clientStreamRequestObserver != null) {
                try {
                    clientStreamRequestObserver.onError(new RuntimeException("Session closed"));
                } catch (Exception ignored) {}
                clientStreamRequestObserver = null;
            }
            if (bidiStreamRequestObserver != null) {
                try {
                    bidiStreamRequestObserver.onCompleted();
                } catch (Exception ignored) {}
                bidiStreamRequestObserver = null;
            }
        }
    }

    public SensorGateway() {
        this.channel = ManagedChannelBuilder.forAddress(GRPC_HOST, GRPC_PORT)
                .usePlaintext()
                .build();
        this.blockingStub = SensorServiceGrpc.newBlockingStub(channel);
        this.asyncStub = SensorServiceGrpc.newStub(channel);
    }

    public void start() {
        Javalin app = Javalin.create(config -> {
            // Cho phép Cross-Origin (CORS) cho tất cả domain (Vite chạy localhost:5173)
            config.plugins.enableCors(cors -> cors.add(it -> it.anyHost()));

            // Nếu thư mục frontend/dist tồn tại sau khi build, phục vụ trực tiếp web UI
            File distDir = new File("frontend/dist");
            if (distDir.exists() && distDir.isDirectory()) {
                String distPath = distDir.getAbsolutePath();
                config.staticFiles.add(staticFiles -> {
                    staticFiles.hostedPath = "/";
                    staticFiles.directory = distPath;
                    staticFiles.location = Location.EXTERNAL;
                });
                config.spaRoot.addFile("/", new File(distDir, "index.html").getAbsolutePath(), Location.EXTERNAL);
            }
        });

        // 1. REST Health check
        app.get("/api/health", ctx -> {
            ObjectNode res = mapper.createObjectNode();
            res.put("status", "UP");
            res.put("service", "Sensor Gateway Bridge");
            res.put("grpcTarget", GRPC_HOST + ":" + GRPC_PORT);
            res.put("timestamp", LocalDateTime.now().format(TIME_FORMATTER));
            ctx.json(res);
        });

        // 2. REST Endpoint cho Unary RPC
        app.get("/api/sensor/current", ctx -> {
            String sensorId = ctx.queryParam("id");
            if (sensorId == null || sensorId.isBlank()) {
                sensorId = "SENSOR-HVAC-01";
            }
            long start = System.currentTimeMillis();
            try {
                SensorRequest request = SensorRequest.newBuilder().setSensorId(sensorId).build();
                SensorData response = blockingStub.getCurrentTemperature(request);
                long latency = System.currentTimeMillis() - start;

                ObjectNode node = mapper.createObjectNode();
                node.put("sensorId", response.getSensorId());
                node.put("temperature", response.getTemperature());
                node.put("timestamp", response.getTimestamp());
                node.put("status", response.getStatus());
                node.put("latencyMs", latency);
                ctx.json(node);
            } catch (StatusRuntimeException e) {
                ctx.status(500).json(Map.of(
                        "error", e.getStatus().getDescription() != null ? e.getStatus().getDescription() : e.getMessage(),
                        "code", e.getStatus().getCode().name()
                ));
            }
        });

        // 3. WebSocket Endpoint: /ws/sensor
        app.ws("/ws/sensor", ws -> {
            ws.onConnect(ctx -> {
                String sessionId = ctx.getSessionId();
                sessions.put(sessionId, new SessionState());
                System.out.println("[GATEWAY] WebSocket client da ket noi: " + sessionId);

                ObjectNode welcome = mapper.createObjectNode();
                welcome.put("type", "CONNECTION_ESTABLISHED");
                welcome.put("message", "Ket noi den gRPC Gateway thanh cong");
                welcome.put("serverTime", LocalDateTime.now().format(TIME_FORMATTER));
                ctx.send(welcome.toString());
            });

            ws.onMessage(ctx -> {
                String sessionId = ctx.getSessionId();
                SessionState session = sessions.get(sessionId);
                if (session == null) return;

                try {
                    JsonNode msg = mapper.readTree(ctx.message());
                    String action = msg.path("action").asText("");

                    switch (action) {
                        case "UNARY" -> handleUnaryWs(ctx, msg);
                        case "START_SERVER_STREAM" -> handleStartServerStream(ctx, session, msg);
                        case "STOP_SERVER_STREAM" -> handleStopServerStream(ctx, session);
                        case "START_CLIENT_STREAM" -> handleStartClientStream(ctx, session, msg);
                        case "SEND_CLIENT_STREAM_RECORD" -> handleSendClientStreamRecord(ctx, session, msg);
                        case "FINISH_CLIENT_STREAM" -> handleFinishClientStream(ctx, session);
                        case "START_BIDI_STREAM" -> handleStartBidiStream(ctx, session, msg);
                        case "SEND_BIDI_RECORD" -> handleSendBidiRecord(ctx, session, msg);
                        case "STOP_BIDI_STREAM" -> handleStopBidiStream(ctx, session);
                        default -> {
                            ObjectNode err = mapper.createObjectNode();
                            err.put("type", "UNKNOWN_ACTION");
                            err.put("error", "Hanh dong khong hop le: " + action);
                            ctx.send(err.toString());
                        }
                    }
                } catch (Exception e) {
                    ObjectNode err = mapper.createObjectNode();
                    err.put("type", "ERROR");
                    err.put("error", "Loi xu ly ban tin: " + e.getMessage());
                    ctx.send(err.toString());
                }
            });

            ws.onClose(ctx -> {
                String sessionId = ctx.getSessionId();
                SessionState session = sessions.remove(sessionId);
                if (session != null) {
                    session.cleanup();
                }
                System.out.println("[GATEWAY] WebSocket client ngat ket noi: " + sessionId);
            });

            ws.onError(ctx -> {
                System.err.println("[GATEWAY] Loi WebSocket tren session " + ctx.getSessionId() + ": " + ctx.error());
            });
        });

        app.start(GATEWAY_PORT);
        System.out.println("======================================================================");
        System.out.println("   SENSOR REST/WEBSOCKET GATEWAY DA KHOI DONG (PORT " + GATEWAY_PORT + ")   ");
        System.out.println("======================================================================");
        System.out.println("[*] HTTP REST & WebSocket endpoint: ws://localhost:" + GATEWAY_PORT + "/ws/sensor");
        System.out.println("[*] REST Health check endpoint   : http://localhost:" + GATEWAY_PORT + "/api/health");
        System.out.println("[*] Dang ket noi toi gRPC Backend: " + GRPC_HOST + ":" + GRPC_PORT);
        System.out.println("----------------------------------------------------------------------");
    }

    // --- 1. UNARY RPC QUA WEBSOCKET ---
    private void handleUnaryWs(WsContext ctx, JsonNode msg) {
        String sensorId = msg.path("sensorId").asText("SENSOR-HVAC-01");
        long start = System.currentTimeMillis();

        try {
            SensorRequest request = SensorRequest.newBuilder().setSensorId(sensorId).build();
            SensorData data = blockingStub.getCurrentTemperature(request);
            long elapsed = System.currentTimeMillis() - start;

            ObjectNode res = mapper.createObjectNode();
            res.put("type", "UNARY_RESPONSE");
            res.put("latencyMs", elapsed);
            ObjectNode d = res.putObject("data");
            d.put("sensorId", data.getSensorId());
            d.put("temperature", data.getTemperature());
            d.put("timestamp", data.getTimestamp());
            d.put("status", data.getStatus());

            ctx.send(res.toString());
        } catch (StatusRuntimeException e) {
            ObjectNode err = mapper.createObjectNode();
            err.put("type", "RPC_ERROR");
            err.put("rpc", "UNARY");
            err.put("error", e.getStatus().getDescription() != null ? e.getStatus().getDescription() : e.getMessage());
            ctx.send(err.toString());
        }
    }

    // --- 2. SERVER STREAMING RPC ---
    private void handleStartServerStream(WsContext ctx, SessionState session, JsonNode msg) {
        String sensorId = msg.path("sensorId").asText("SENSOR-ROOM-102");
        int duration = msg.path("duration").asInt(6);

        // Hủy luồng server stream cũ nếu đang chạy
        if (session.activeServerStreamCall != null) {
            try {
                session.activeServerStreamCall.cancel("Bat dau luong moi", null);
            } catch (Exception ignored) {}
            session.activeServerStreamCall = null;
        }

        SubscribeRequest request = SubscribeRequest.newBuilder()
                .setSensorId(sensorId)
                .setDurationSeconds(duration)
                .build();

        asyncStub.monitorTemperature(request, new ClientResponseObserver<SubscribeRequest, SensorData>() {
            @Override
            public void beforeStart(ClientCallStreamObserver<SubscribeRequest> requestStream) {
                session.activeServerStreamCall = requestStream;
            }

            @Override
            public void onNext(SensorData value) {
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "SERVER_STREAM_RECORD");
                    ObjectNode d = res.putObject("data");
                    d.put("sensorId", value.getSensorId());
                    d.put("temperature", value.getTemperature());
                    d.put("timestamp", value.getTimestamp());
                    d.put("status", value.getStatus());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(Throwable t) {
                session.activeServerStreamCall = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "SERVER_STREAM_ERROR");
                    res.put("error", t.getMessage());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onCompleted() {
                session.activeServerStreamCall = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "SERVER_STREAM_COMPLETED");
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }
        });
    }

    private void handleStopServerStream(WsContext ctx, SessionState session) {
        if (session.activeServerStreamCall != null) {
            try {
                session.activeServerStreamCall.cancel("Nguoi dung yeu cau dung", null);
            } catch (Exception ignored) {}
            session.activeServerStreamCall = null;
        }
        ObjectNode res = mapper.createObjectNode();
        res.put("type", "SERVER_STREAM_STOPPED");
        ctx.send(res.toString());
    }

    // --- 3. CLIENT STREAMING RPC ---
    private void handleStartClientStream(WsContext ctx, SessionState session, JsonNode msg) {
        // Khởi tạo luồng Client Streaming lên gRPC Backend
        StreamObserver<SensorSummary> responseObserver = new StreamObserver<SensorSummary>() {
            @Override
            public void onNext(SensorSummary summary) {
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "CLIENT_STREAM_SUMMARY");
                    ObjectNode d = res.putObject("data");
                    d.put("sensorId", summary.getSensorId());
                    d.put("totalRecords", summary.getTotalRecords());
                    d.put("averageTemperature", summary.getAverageTemperature());
                    d.put("maxTemperature", summary.getMaxTemperature());
                    d.put("minTemperature", summary.getMinTemperature());
                    d.put("summaryMessage", summary.getSummaryMessage());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(Throwable t) {
                session.clientStreamRequestObserver = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "CLIENT_STREAM_ERROR");
                    res.put("error", t.getMessage());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onCompleted() {
                session.clientStreamRequestObserver = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "CLIENT_STREAM_COMPLETED");
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }
        };

        session.clientStreamRequestObserver = asyncStub.uploadSensorData(responseObserver);

        ObjectNode ready = mapper.createObjectNode();
        ready.put("type", "CLIENT_STREAM_READY");
        ready.put("message", "Da san sang nhan du lieu de stream len Server");
        ctx.send(ready.toString());
    }

    private void handleSendClientStreamRecord(WsContext ctx, SessionState session, JsonNode msg) {
        if (session.clientStreamRequestObserver == null) {
            ObjectNode err = mapper.createObjectNode();
            err.put("type", "ERROR");
            err.put("error", "Luong Client Streaming chua duoc khoi tao! Hay bam Start truoc.");
            ctx.send(err.toString());
            return;
        }

        String sensorId = msg.path("sensorId").asText("SENSOR-FACTORY-99");
        double temp = msg.path("temperature").asDouble(28.0);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        SensorData data = SensorData.newBuilder()
                .setSensorId(sensorId)
                .setTemperature(temp)
                .setTimestamp(timestamp)
                .setStatus("UPLOAD")
                .build();

        session.clientStreamRequestObserver.onNext(data);

        ObjectNode ack = mapper.createObjectNode();
        ack.put("type", "CLIENT_STREAM_RECORD_ACK");
        ack.put("temperature", temp);
        ack.put("timestamp", timestamp);
        ctx.send(ack.toString());
    }

    private void handleFinishClientStream(WsContext ctx, SessionState session) {
        if (session.clientStreamRequestObserver != null) {
            session.clientStreamRequestObserver.onCompleted();
            // Đợi responseObserver nhận SensorSummary và hoàn tất
        }
    }

    // --- 4. BIDIRECTIONAL STREAMING RPC ---
    private void handleStartBidiStream(WsContext ctx, SessionState session, JsonNode msg) {
        // Đóng luồng bidi cũ nếu có
        if (session.bidiStreamRequestObserver != null) {
            try {
                session.bidiStreamRequestObserver.onCompleted();
            } catch (Exception ignored) {}
            session.bidiStreamRequestObserver = null;
        }

        StreamObserver<SensorAlert> responseObserver = new StreamObserver<SensorAlert>() {
            @Override
            public void onNext(SensorAlert alert) {
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "BIDI_ALERT");
                    ObjectNode d = res.putObject("data");
                    d.put("sensorId", alert.getSensorId());
                    d.put("temperature", alert.getTemperature());
                    d.put("alertLevel", alert.getAlertLevel());
                    d.put("alertMessage", alert.getAlertMessage());
                    d.put("timestamp", alert.getTimestamp());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onError(Throwable t) {
                session.bidiStreamRequestObserver = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "BIDI_ERROR");
                    res.put("error", t.getMessage());
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }

            @Override
            public void onCompleted() {
                session.bidiStreamRequestObserver = null;
                try {
                    ObjectNode res = mapper.createObjectNode();
                    res.put("type", "BIDI_SERVER_COMPLETED");
                    ctx.send(res.toString());
                } catch (Exception ignored) {}
            }
        };

        session.bidiStreamRequestObserver = asyncStub.liveTemperatureControl(responseObserver);

        ObjectNode ready = mapper.createObjectNode();
        ready.put("type", "BIDI_READY");
        ready.put("message", "Kenh Bidirectional da san sang.");
        ctx.send(ready.toString());
    }

    private void handleSendBidiRecord(WsContext ctx, SessionState session, JsonNode msg) {
        if (session.bidiStreamRequestObserver == null) {
            ObjectNode err = mapper.createObjectNode();
            err.put("type", "ERROR");
            err.put("error", "Kenh Bidirectional chua duoc khoi tao! Hay bam Start truoc.");
            ctx.send(err.toString());
            return;
        }

        String sensorId = msg.path("sensorId").asText("SENSOR-BOILER-07");
        double temp = msg.path("temperature").asDouble(30.0);
        String timestamp = LocalDateTime.now().format(TIME_FORMATTER);

        SensorData data = SensorData.newBuilder()
                .setSensorId(sensorId)
                .setTemperature(temp)
                .setTimestamp(timestamp)
                .setStatus("LIVE")
                .build();

        session.bidiStreamRequestObserver.onNext(data);

        ObjectNode ack = mapper.createObjectNode();
        ack.put("type", "BIDI_RECORD_SENT");
        ObjectNode d = ack.putObject("record");
        d.put("sensorId", sensorId);
        d.put("temperature", temp);
        d.put("timestamp", timestamp);
        ctx.send(ack.toString());
    }

    private void handleStopBidiStream(WsContext ctx, SessionState session) {
        if (session.bidiStreamRequestObserver != null) {
            try {
                session.bidiStreamRequestObserver.onCompleted();
            } catch (Exception ignored) {}
            session.bidiStreamRequestObserver = null;
        }
        ObjectNode res = mapper.createObjectNode();
        res.put("type", "BIDI_CLIENT_COMPLETED");
        ctx.send(res.toString());
    }

    private static void ensureServerRunning() {
        try (java.net.Socket socket = new java.net.Socket("localhost", GRPC_PORT)) {
            System.out.println("[GATEWAY] Phat hien SensorServer da dang chay tren port " + GRPC_PORT);
        } catch (Exception e) {
            System.out.println("[GATEWAY] SensorServer chua chay. Tu dong khoi dong SensorServer tren port " + GRPC_PORT + "...");
            Thread serverThread = new Thread(() -> {
                try {
                    SensorServer server = new SensorServer();
                    server.start();
                    server.blockUntilShutdown();
                } catch (Exception ex) {
                    System.err.println("[GATEWAY] Loi khi khoi dong SensorServer: " + ex.getMessage());
                }
            }, "SensorServer-Thread");
            serverThread.setDaemon(true);
            serverThread.start();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {}
        }
    }

    public static void main(String[] args) {
        ensureServerRunning();
        SensorGateway gateway = new SensorGateway();
        gateway.start();
    }
}
