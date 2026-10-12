package com.example.grpc;

import io.grpc.Server;
import io.grpc.ServerBuilder;

import java.io.IOException;

/**
 * SensorServer: Lớp khởi chạy gRPC Server trên port 50051.
 * Đăng ký SensorService để phục vụ các yêu cầu từ Client.
 */
public class SensorServer {

    private static final int PORT = 50051;
    private Server server;

    public void start() throws IOException {
        // Khởi tạo Netty gRPC Server lắng nghe trên cổng 50051
        server = ServerBuilder.forPort(PORT)
                .addService(new SensorService()) // Đăng ký service xử lý
                .build()
                .start();

        System.out.println("======================================================================");
        System.out.println("   REAL-TIME SENSOR MONITORING SYSTEM - gRPC SERVER (PORT " + PORT + ")   ");
        System.out.println("======================================================================");
        System.out.println("[*] Server da khoi dong thanh cong va san sang lang nghe cac RPC:");
        System.out.println("    1. Unary RPC                  : GetCurrentTemperature");
        System.out.println("    2. Server Streaming RPC       : MonitorTemperature");
        System.out.println("    3. Client Streaming RPC       : UploadSensorData");
        System.out.println("    4. Bidirectional Streaming RPC: LiveTemperatureControl");
        System.out.println("[*] Nhan Ctrl+C de dung Server...");
        System.out.println("----------------------------------------------------------------------");

        // Đăng ký JVM Shutdown Hook để đóng server an toàn khi bị tắt
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[!] Nhan tin hieu dung tu he thong. Dang dong gRPC Server...");
            SensorServer.this.stop();
            System.out.println("[*] Server da tat hoan toan.");
        }));
    }

    public void stop() {
        if (server != null) {
            server.shutdown();
        }
    }

    public void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        SensorServer server = new SensorServer();
        server.start();
        server.blockUntilShutdown();
    }
}
