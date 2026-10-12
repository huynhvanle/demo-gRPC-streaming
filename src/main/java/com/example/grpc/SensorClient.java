package com.example.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Scanner;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * SensorClient: Lớp Client gRPC kết nối tới SensorServer (port 50051).
 * Minh họa chi tiết 4 mô hình giao tiếp gRPC:
 * 1. Unary RPC
 * 2. Server Streaming RPC
 * 3. Client Streaming RPC
 * 4. Bidirectional Streaming RPC
 */
public class SensorClient {

    private static final String HOST = "localhost";
    private static final int PORT = 50051;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ManagedChannel channel;
    // Blocking Stub: Dùng cho Unary RPC (gọi đồng bộ, chặn luồng cho đến khi có phản hồi)
    private final SensorServiceGrpc.SensorServiceBlockingStub blockingStub;
    // Async Stub: Dùng cho Streaming RPC (gọi bất đồng bộ qua StreamObserver)
    private final SensorServiceGrpc.SensorServiceStub asyncStub;

    public SensorClient(String host, int port) {
        // Khởi tạo ManagedChannel kết nối HTTP/2 đến server (dùng plaintext vì demo local)
        this.channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext()
                .build();
        this.blockingStub = SensorServiceGrpc.newBlockingStub(channel);
        this.asyncStub = SensorServiceGrpc.newStub(channel);
    }

    public void shutdown() throws InterruptedException {
        // Đóng kênh kết nối an toàn
        channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
    }

    // =========================================================================
    // CHỨC NĂNG 1: UNARY RPC
    // Mô hình: 1 Request -> 1 Response
    // Client gửi yêu cầu lấy nhiệt độ tức thời và nhận đúng 1 phản hồi từ Server.
    // =========================================================================
    public void demoUnaryRpc(String sensorId) {
        System.out.println("\n----------------------------------------------------------------------");
        System.out.println(">>> [1. DEMO UNARY RPC]: Lay nhiet do tuc thoi cua Sensor " + sensorId);
        System.out.println("----------------------------------------------------------------------");

        SensorRequest request = SensorRequest.newBuilder()
                .setSensorId(sensorId)
                .build();

        try {
            System.out.println("[CLIENT -> SERVER] Gui SensorRequest: sensor_id = '" + sensorId + "'");
            long startTime = System.currentTimeMillis();

            // Gọi đồng bộ qua blockingStub
            SensorData response = blockingStub.getCurrentTemperature(request);

            long elapsed = System.currentTimeMillis() - startTime;
            System.out.println("[CLIENT <- SERVER] Nhan ket qua Unary (thoi gian: " + elapsed + "ms):");
            System.out.println("    + Ma cam bien: " + response.getSensorId());
            System.out.println("    + Nhiet do   : " + response.getTemperature() + " °C");
            System.out.println("    + Thoi gian  : " + response.getTimestamp());
            System.out.println("    + Trang thai : " + response.getStatus());

        } catch (StatusRuntimeException e) {
            System.err.println("[CLIENT - LOI] RPC that bai: " + e.getStatus().getDescription());
        }
    }

    // =========================================================================
    // CHỨC NĂNG 2: SERVER STREAMING RPC
    // Mô hình: 1 Request -> Stream of Responses
    // Client gửi yêu cầu theo dõi. Server liên tục gửi về 5-10 bản ghi theo thời gian thực.
    // Client nhận và hiển thị ngay lập tức khi từng gói tin tới, không chờ server gửi hết.
    // =========================================================================
    public void demoServerStreamingRpc(String sensorId, int durationSeconds) {
        System.out.println("\n----------------------------------------------------------------------");
        System.out.printf(">>> [2. DEMO SERVER STREAMING RPC]: Theo doi Sensor %s trong %d giay%n", sensorId, durationSeconds);
        System.out.println("----------------------------------------------------------------------");

        SubscribeRequest request = SubscribeRequest.newBuilder()
                .setSensorId(sensorId)
                .setDurationSeconds(durationSeconds)
                .build();

        // Sử dụng CountDownLatch để luồng chính chờ luồng bất đồng bộ nhận đủ dữ liệu
        CountDownLatch finishLatch = new CountDownLatch(1);

        System.out.println("[CLIENT -> SERVER] Gui SubscribeRequest bat dau theo doi...");

        // Gọi bất đồng bộ qua asyncStub và truyền vào StreamObserver hứng phản hồi
        asyncStub.monitorTemperature(request, new StreamObserver<SensorData>() {
            private int recordIndex = 0;

            @Override
            public void onNext(SensorData data) {
                recordIndex++;
                System.out.printf("[CLIENT <- SERVER STREAM] Nhan ngay ban ghi #%d: Nhiet do = %.1f°C | Luc = %s | Status = %s%n",
                        recordIndex, data.getTemperature(), data.getTimestamp(), data.getStatus());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("[CLIENT - LOI] Luong Server Streaming gap loi: " + t.getMessage());
                finishLatch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("[CLIENT <- SERVER] Server da ket thuc luong (onCompleted). Nhan tong cong: " + recordIndex + " ban ghi.");
                finishLatch.countDown();
            }
        });

        try {
            // Chờ tối đa (durationSeconds + 5) giây để hoàn tất nhận stream
            if (!finishLatch.await(durationSeconds + 5L, TimeUnit.SECONDS)) {
                System.err.println("[CLIENT - CANH BAO] Het thoi gian cho Server Streaming.");
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    // =========================================================================
    // CHỨC NĂNG 3: CLIENT STREAMING RPC
    // Mô hình: Stream of Requests -> 1 Response
    // Client liên tục đẩy nhiều bản ghi nhiệt độ lên Server.
    // Sau khi Client hoàn tất gửi (onCompleted), Server mới trả về 1 phản hồi SensorSummary.
    // =========================================================================
    public void demoClientStreamingRpc(String sensorId) {
        System.out.println("\n----------------------------------------------------------------------");
        System.out.println(">>> [3. DEMO CLIENT STREAMING RPC]: Gui tap hop cac ban ghi nhiet do len Server");
        System.out.println("----------------------------------------------------------------------");

        CountDownLatch finishLatch = new CountDownLatch(1);

        // Định nghĩa observer để nhận phản hồi tổng kết duy nhất từ Server
        StreamObserver<SensorSummary> responseObserver = new StreamObserver<SensorSummary>() {
            @Override
            public void onNext(SensorSummary summary) {
                System.out.println("\n[CLIENT <- SERVER] Nhan ket qua tong ket tu Server (SensorSummary):");
                System.out.println("    + Ma cam bien      : " + summary.getSensorId());
                System.out.println("    + Tong so ban ghi  : " + summary.getTotalRecords());
                System.out.println("    + Nhiet do TB      : " + summary.getAverageTemperature() + " °C");
                System.out.println("    + Nhiet do cao nhat: " + summary.getMaxTemperature() + " °C");
                System.out.println("    + Nhiet do thap nhat: " + summary.getMinTemperature() + " °C");
                System.out.println("    + Danh gia tong quan: " + summary.getSummaryMessage());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("[CLIENT - LOI] Client Streaming that bai: " + t.getMessage());
                finishLatch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("[CLIENT] Luong Client Streaming hoan tat thanh cong.");
                finishLatch.countDown();
            }
        };

        // Gọi method trên asyncStub, nhận lại requestObserver để stream dữ liệu lên server
        StreamObserver<SensorData> requestObserver = asyncStub.uploadSensorData(responseObserver);

        // Tập dữ liệu mẫu mô phỏng 6 lần đo từ cảm biến
        double[] sampleTemperatures = {26.2, 27.5, 29.8, 32.1, 35.4, 28.0};

        try {
            for (int i = 0; i < sampleTemperatures.length; i++) {
                double temp = sampleTemperatures[i];
                SensorData data = SensorData.newBuilder()
                        .setSensorId(sensorId)
                        .setTemperature(temp)
                        .setTimestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .setStatus("ACTIVE")
                        .build();

                System.out.printf("[CLIENT -> SERVER STREAM] Gui ban ghi #%d: %.1f°C%n", (i + 1), temp);
                requestObserver.onNext(data);

                // Giả lập độ trễ giữa các lần đọc cảm biến (500ms)
                Thread.sleep(500);
            }

            // Báo cho Server biết Client đã gửi xong toàn bộ dữ liệu
            System.out.println("[CLIENT -> SERVER] Da gui xong toan bo. Goi requestObserver.onCompleted()...");
            requestObserver.onCompleted();

            // Chờ server tính toán và phản hồi lại summary
            if (!finishLatch.await(10, TimeUnit.SECONDS)) {
                System.err.println("[CLIENT - CANH BAO] Het thoi gian cho phan hoi tu Server.");
            }

        } catch (InterruptedException e) {
            requestObserver.onError(e);
            Thread.currentThread().interrupt();
        }
    }

    // =========================================================================
    // CHỨC NĂNG 4: BIDIRECTIONAL STREAMING RPC
    // Mô hình: Stream of Requests <-> Stream of Responses (2 chiều độc lập)
    // Client liên tục đẩy dữ liệu; Server ngay lập tức phản hồi cảnh báo tương ứng.
    // Client và Server có thể gửi và nhận song song hoàn toàn.
    // =========================================================================
    public void demoBidirectionalStreamingRpc(String sensorId) {
        System.out.println("\n----------------------------------------------------------------------");
        System.out.println(">>> [4. DEMO BIDIRECTIONAL STREAMING RPC]: Giam sat thoi gian thuc 2 chieu doc lap");
        System.out.println("----------------------------------------------------------------------");

        CountDownLatch finishLatch = new CountDownLatch(1);

        // 1. Định nghĩa luồng nhận phản hồi/cảnh báo từ Server
        StreamObserver<SensorAlert> responseObserver = new StreamObserver<SensorAlert>() {
            @Override
            public void onNext(SensorAlert alert) {
                // Nhận cảnh báo từ Server ngay lập tức khi Server phân tích xong
                String prefix = switch (alert.getAlertLevel()) {
                    case "CRITICAL" -> "[!!! ALERT - CRITICAL !!!]";
                    case "WARNING" -> "[! ALERT - WARNING !]";
                    default -> "[INFO - NORMAL]";
                };
                System.out.printf("  %s [%s] Nhiet do: %.1f°C -> %s (%s)%n",
                        prefix, alert.getSensorId(), alert.getTemperature(), alert.getAlertMessage(), alert.getTimestamp());
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("[CLIENT - LOI] Kenh Bidirectional gap loi: " + t.getMessage());
                finishLatch.countDown();
            }

            @Override
            public void onCompleted() {
                System.out.println("[CLIENT <- SERVER] Server da dong luong phan hoi Bidirectional.");
                finishLatch.countDown();
            }
        };

        // 2. Khởi tạo kết nối 2 chiều
        StreamObserver<SensorData> requestObserver = asyncStub.liveTemperatureControl(responseObserver);

        // Tập mẫu gồm các nhiệt độ: Bình thường -> Cảnh báo -> Nguy hiểm -> Hạ nhiệt
        double[] sampleStream = {27.0, 29.5, 33.2, 38.6, 41.5, 30.0};

        try {
            for (int i = 0; i < sampleStream.length; i++) {
                double temp = sampleStream[i];
                SensorData data = SensorData.newBuilder()
                        .setSensorId(sensorId)
                        .setTemperature(temp)
                        .setTimestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .setStatus("LIVE")
                        .build();

                System.out.printf("[CLIENT -> SERVER] Ban du lieu #%d: %.1f°C%n", (i + 1), temp);
                requestObserver.onNext(data);

                // Giả lập khoảng cách 800ms giữa các lần gửi
                Thread.sleep(800);
            }

            // Client hoàn tất việc gửi
            System.out.println("[CLIENT -> SERVER] Client hoan tat gui stream. Goi requestObserver.onCompleted()...");
            requestObserver.onCompleted();

            // Chờ server hoàn tất gửi các phản hồi còn lại
            if (!finishLatch.await(10, TimeUnit.SECONDS)) {
                System.err.println("[CLIENT - CANH BAO] Het thoi gian cho phan hoi Bidirectional.");
            }

        } catch (InterruptedException e) {
            requestObserver.onError(e);
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Chạy toàn bộ 4 kịch bản liên tiếp phục vụ demo thuyết trình mượt mà
     */
    public void runAllDemos() {
        System.out.println("======================================================================");
        System.out.println("   BAT DAU DEMO TOAN DIEN 4 KIEU GIAO TIEP gRPC STREAMING (JAVA)     ");
        System.out.println("======================================================================");

        demoUnaryRpc("SENSOR-HVAC-01");
        
        // Nghỉ 1 giây giữa các bài test để output terminal rõ ràng
        sleep(1000);

        demoServerStreamingRpc("SENSOR-ROOM-102", 5);

        sleep(1000);

        demoClientStreamingRpc("SENSOR-FACTORY-99");

        sleep(1000);

        demoBidirectionalStreamingRpc("SENSOR-BOILER-07");

        System.out.println("\n======================================================================");
        System.out.println("   [HOAN TAT] DA CHAY THANH CONG DAY DU 4 KIEU GIAO TIEP gRPC!       ");
        System.out.println("======================================================================");
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignored) {}
    }

    public static void main(String[] args) {
        SensorClient client = new SensorClient(HOST, PORT);

        // Kiểm tra tham số dòng lệnh: Nếu truyền "all" hoặc "--all", tự động chạy cả 4 kịch bản
        if (args.length > 0 && ("all".equalsIgnoreCase(args[0]) || "--all".equalsIgnoreCase(args[0]))) {
            client.runAllDemos();
            try {
                client.shutdown();
            } catch (InterruptedException ignored) {}
            return;
        }

        Scanner scanner = new Scanner(System.in);
        boolean running = true;

        System.out.println("======================================================================");
        System.out.println("     REAL-TIME SENSOR MONITORING CLIENT - DIEU KHIEN VA KIEM THU      ");
        System.out.println("======================================================================");

        while (running) {
            System.out.println("\n--- VUI LONG CHON CHUC NANG KIEM THU ---");
            System.out.println("1. [Unary RPC]                 : Lay nhiet do tuc thoi (1 Req -> 1 Res)");
            System.out.println("2. [Server Streaming RPC]      : Nhan stream nhiet do tu Server (1 Req -> N Res)");
            System.out.println("3. [Client Streaming RPC]      : Day tap hop nhiet do len Server (N Req -> 1 Res)");
            System.out.println("4. [Bidirectional Streaming]   : Giam sat 2 chieu doc lap (N Req <-> N Res)");
            System.out.println("5. [Chay tat ca]               : Tu dong chay toan bo 4 demo lien tiep");
            System.out.println("0. Thoat chuong trinh");
            System.out.print("Nhap lua chon cua ban (0-5): ");

            String choice = scanner.nextLine().trim();

            switch (choice) {
                case "1" -> client.demoUnaryRpc("SENSOR-HVAC-01");
                case "2" -> client.demoServerStreamingRpc("SENSOR-ROOM-102", 6);
                case "3" -> client.demoClientStreamingRpc("SENSOR-FACTORY-99");
                case "4" -> client.demoBidirectionalStreamingRpc("SENSOR-BOILER-07");
                case "5" -> client.runAllDemos();
                case "0" -> {
                    System.out.println("[*] Dang dong ket noi va thoat...");
                    running = false;
                }
                default -> System.out.println("[!] Lua chon khong hop le. Vui long chon tu 0 den 5.");
            }
        }

        try {
            client.shutdown();
        } catch (InterruptedException ignored) {}
        System.out.println("[*] Chuong trinh Client da ket thuc.");
    }
}
