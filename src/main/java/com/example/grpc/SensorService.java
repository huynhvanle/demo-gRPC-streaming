package com.example.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * SensorService: Lớp triển khai các phương thức RPC được định nghĩa trong sensor.proto.
 * Kế thừa lớp SensorServiceImplBase do gRPC plugin tự động sinh ra.
 */
public class SensorService extends SensorServiceGrpc.SensorServiceImplBase {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final Random random = new Random();

    // Ngưỡng cảnh báo nhiệt độ cho Bidirectional Streaming RPC
    private static final double WARNING_THRESHOLD = 32.0; // °C
    private static final double CRITICAL_THRESHOLD = 38.0; // °C

    // =========================================================================
    // 1. UNARY RPC: 1 Request -> 1 Response
    // Client gửi yêu cầu lấy nhiệt độ hiện tại của một cảm biến.
    // Server trả về đúng một phản hồi chứa thông tin nhiệt độ và thời điểm đo.
    // =========================================================================
    @Override
    public void getCurrentTemperature(SensorRequest request, StreamObserver<SensorData> responseObserver) {
        String sensorId = request.getSensorId();
        System.out.println("\n[SERVER - UNARY RPC] Nhan yeu cau lay nhiet do cho Sensor: " + sensorId);

        // Kiểm tra dữ liệu đầu vào (Validation)
        if (sensorId == null || sensorId.trim().isEmpty()) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                    .withDescription("Ma cam bien (sensor_id) khong duoc de trong!")
                    .asRuntimeException());
            return;
        }

        // Giả lập đọc nhiệt độ thực tế (từ 24.0°C đến 30.0°C)
        double currentTemp = 24.0 + (random.nextDouble() * 6.0);
        currentTemp = Math.round(currentTemp * 10.0) / 10.0;

        // Xây dựng message SensorData bằng Protobuf Builder
        SensorData response = SensorData.newBuilder()
                .setSensorId(sensorId)
                .setTemperature(currentTemp)
                .setTimestamp(LocalDateTime.now().format(TIME_FORMATTER))
                .setStatus("NORMAL")
                .build();

        // 1. Gửi kết quả duy nhất cho client qua onNext()
        responseObserver.onNext(response);

        // 2. Báo hiệu hoàn tất lời gọi RPC qua onCompleted()
        responseObserver.onCompleted();

        System.out.println("[SERVER - UNARY RPC] Da tra ve ket qua: " + currentTemp + "°C cho " + sensorId);
    }

    // =========================================================================
    // 2. SERVER STREAMING RPC: 1 Request -> Stream of Responses
    // Client gửi yêu cầu theo dõi kèm thời lượng (số bản ghi).
    // Server gửi liên tiếp 5-10 bản ghi nhiệt độ, cách nhau 1 giây trên cùng 1 RPC call.
    // =========================================================================
    @Override
    public void monitorTemperature(SubscribeRequest request, StreamObserver<SensorData> responseObserver) {
        String sensorId = request.getSensorId();
        int duration = request.getDurationSeconds();
        if (duration <= 0) {
            duration = 5; // Mặc định 5 bản ghi nếu client không truyền hợp lệ
        }

        System.out.println("\n[SERVER - SERVER STREAMING] Bat dau stream giam sat cho Sensor: " 
                + sensorId + " trong " + duration + " ban ghi (1s/ban ghi)");

        try {
            double baseTemp = 28.0;
            for (int i = 1; i <= duration; i++) {
                // Giả lập nhiệt độ dao động ngẫu nhiên xung quanh baseTemp
                double tempFluctuation = (random.nextDouble() * 4.0) - 2.0; // Dao động -2°C đến +2°C
                double temp = Math.round((baseTemp + tempFluctuation) * 10.0) / 10.0;
                String status = (temp >= 30.0) ? "WARM" : "NORMAL";

                SensorData data = SensorData.newBuilder()
                        .setSensorId(sensorId)
                        .setTemperature(temp)
                        .setTimestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .setStatus(status)
                        .build();

                // Gửi từng bản ghi về client ngay khi sinh xong
                responseObserver.onNext(data);
                System.out.printf("[SERVER - SERVER STREAMING] -> Da gui ban ghi #%d/%d: %.1f°C | Status: %s%n",
                        i, duration, temp, status);

                // Giả lập chu kỳ đọc cảm biến mỗi 1 giây
                Thread.sleep(1000);
            }

            // Sau khi đã gửi đủ số bản ghi, đóng luồng response
            responseObserver.onCompleted();
            System.out.println("[SERVER - SERVER STREAMING] Hoan tat stream giam sat cho Sensor: " + sensorId);

        } catch (InterruptedException e) {
            System.err.println("[SERVER - SERVER STREAMING] Luong bi gian doan: " + e.getMessage());
            responseObserver.onError(Status.INTERNAL
                    .withDescription("Loi he thong trong qua trinh stream du lieu")
                    .asRuntimeException());
            Thread.currentThread().interrupt();
        }
    }

    // =========================================================================
    // 3. CLIENT STREAMING RPC: Stream of Requests -> 1 Response
    // Client gửi liên tiếp nhiều bản ghi nhiệt độ lên Server.
    // Server tính toán tổng hợp (số lượng, trung bình, max, min) và trả về 1 bản tóm tắt duy nhất.
    // =========================================================================
    @Override
    public StreamObserver<SensorData> uploadSensorData(StreamObserver<SensorSummary> responseObserver) {
        System.out.println("\n[SERVER - CLIENT STREAMING] Khoi tao luong nhan du lieu tu Client...");

        // Trả về một StreamObserver để đón nhận từng message do Client gửi lên
        return new StreamObserver<SensorData>() {
            private int count = 0;
            private double sum = 0.0;
            private double max = Double.MIN_VALUE;
            private double min = Double.MAX_VALUE;
            private String sensorId = "UNKNOWN";

            // Được gọi mỗi khi Client gửi lên một message SensorData
            @Override
            public void onNext(SensorData data) {
                count++;
                sum += data.getTemperature();
                max = Math.max(max, data.getTemperature());
                min = Math.min(min, data.getTemperature());
                sensorId = data.getSensorId();

                System.out.printf("[SERVER - CLIENT STREAMING] <- Nhan ban ghi #%d: [%s] %.1f°C luc %s%n",
                        count, data.getSensorId(), data.getTemperature(), data.getTimestamp());
            }

            // Được gọi khi luồng truyền tải gặp lỗi
            @Override
            public void onError(Throwable t) {
                System.err.println("[SERVER - CLIENT STREAMING] Loi tu phia Client: " + t.getMessage());
            }

            // Được gọi khi Client thong bao da gui het du lieu (client goi onCompleted)
            @Override
            public void onCompleted() {
                System.out.println("[SERVER - CLIENT STREAMING] Client da hoan tat gui. Tien hanh tong ket...");

                double avg = (count > 0) ? (sum / count) : 0.0;
                avg = Math.round(avg * 10.0) / 10.0;
                if (count == 0) {
                    max = 0.0;
                    min = 0.0;
                }

                String summaryMsg = String.format("Tong hop thanh cong %d ban ghi. Nhiet do dao dong tu %.1f°C den %.1f°C.",
                        count, min, max);

                SensorSummary summary = SensorSummary.newBuilder()
                        .setSensorId(sensorId)
                        .setTotalRecords(count)
                        .setAverageTemperature(avg)
                        .setMaxTemperature(max)
                        .setMinTemperature(min)
                        .setSummaryMessage(summaryMsg)
                        .build();

                // Server gửi đúng 1 phản hồi tóm tắt duy nhất cho Client
                responseObserver.onNext(summary);
                // Đóng luồng phản hồi phía Server
                responseObserver.onCompleted();

                System.out.println("[SERVER - CLIENT STREAMING] Da gui SensorSummary ve cho Client.");
            }
        };
    }

    // =========================================================================
    // 4. BIDIRECTIONAL STREAMING RPC: Stream of Requests <-> Stream of Responses
    // Client liên tục gửi dữ liệu nhiệt độ. Server phân tích từng bản ghi theo thời gian thực
    // và lập tức gửi phản hồi cảnh báo (NORMAL, WARNING, CRITICAL). Hai chiều gửi độc lập.
    // =========================================================================
    @Override
    public StreamObserver<SensorData> liveTemperatureControl(StreamObserver<SensorAlert> responseObserver) {
        System.out.println("\n[SERVER - BIDI STREAMING] Mo kenh giao tiep song cong (Bidirectional) 2 chieu doc lap...");

        return new StreamObserver<SensorData>() {
            private int receivedIndex = 0;

            @Override
            public void onNext(SensorData data) {
                receivedIndex++;
                double temp = data.getTemperature();
                String level;
                String message;

                // Logic đánh giá ngưỡng nhiệt độ tức thời
                if (temp >= CRITICAL_THRESHOLD) {
                    level = "CRITICAL";
                    message = String.format("NGUY HIEM: Nhiet do %.1f°C vuot nguong toi han (>= %.1f°C)!", temp, CRITICAL_THRESHOLD);
                } else if (temp >= WARNING_THRESHOLD) {
                    level = "WARNING";
                    message = String.format("CANH BAO: Nhiet do %.1f°C vuot nguong an toan (>= %.1f°C).", temp, WARNING_THRESHOLD);
                } else {
                    level = "NORMAL";
                    message = String.format("ON DINH: Nhiet do %.1f°C nam trong khoang cho phep.", temp);
                }

                SensorAlert alert = SensorAlert.newBuilder()
                        .setSensorId(data.getSensorId())
                        .setTemperature(temp)
                        .setAlertLevel(level)
                        .setAlertMessage(message)
                        .setTimestamp(LocalDateTime.now().format(TIME_FORMATTER))
                        .build();

                System.out.printf("[SERVER - BIDI STREAMING] <- Nhan [%s: %.1f°C] -> Ban ve Alert [%s]: %s%n",
                        data.getSensorId(), temp, level, message);

                // Gửi ngay phản hồi cảnh báo về cho Client trên luồng phản hồi
                responseObserver.onNext(alert);
            }

            @Override
            public void onError(Throwable t) {
                System.err.println("[SERVER - BIDI STREAMING] Kenh truyen bi loi: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                System.out.println("[SERVER - BIDI STREAMING] Client da dong kenh gui. Server tien hanh dong kenh phan hoi.");
                // Khi Client ngừng gửi, Server cũng hoàn tất luồng phản hồi của mình
                responseObserver.onCompleted();
            }
        };
    }
}
