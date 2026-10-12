# REAL-TIME SENSOR MONITORING SYSTEM (gRPC STREAMING)
> **Đồ án môn học: Lập trình mạng (Network Programming)**  
> **Chủ đề: Nghiên cứu và Xây dựng Hệ thống Giám sát Cảm biến Thời gian thực với gRPC Streaming (Java - HTTP/2 - React)**

---

## 1. GIỚI THIỆU TỔNG QUAN

### 1.1. Bối cảnh và Mục tiêu đề tài
Trong các hệ thống mạng hiện đại (IoT, hệ thống phân tán, vi dịch vụ - Microservices), nhu cầu truyền tải dữ liệu thời gian thực với độ trễ thấp và băng thông tối ưu là cực kỳ cấp thiết. Các phương thức truyền thống dựa trên **REST API (HTTP/1.1 + JSON)** bộc lộ nhiều điểm nghẽn:
- Giao thức văn bản (text-based) JSON cồng kềnh, tốn chi phí tuần tự hóa (serialization/deserialization).
- HTTP/1.1 bị giới hạn bởi hiện tượng *Head-of-Line Blocking*, mỗi chu kỳ Request - Response bắt buộc phải mở hoặc chờ kết nối tuần tự.
- Khó khăn trong việc truyền luồng dữ liệu 2 chiều liên tục (Full-Duplex Streaming).

**Mục tiêu của đề tài:**
Xây dựng một hệ thống hoàn chỉnh có tên **Real-time Sensor Monitoring System** nhằm:
1. Nghiên cứu sâu cơ chế hoạt động của **gRPC** trên nền giao thức truyền tải **HTTP/2**.
2. Sử dụng **Protocol Buffers (Protobuf v3)** làm ngôn ngữ định nghĩa giao diện (IDL) và định dạng mã hóa nhị phân hiệu năng cao.
3. Hiện thực hóa đầy đủ **4 mô hình giao tiếp gRPC**:
   - **Unary RPC** (1 Request $\rightarrow$ 1 Response)
   - **Server Streaming RPC** (1 Request $\rightarrow$ Stream Responses)
   - **Client Streaming RPC** (Stream Requests $\rightarrow$ 1 Response)
   - **Bidirectional Streaming RPC** (Stream Requests $\leftrightarrow$ Stream Responses)
4. Xây dựng **Web Dashboard điều khiển trực quan** (React + TypeScript + Tailwind CSS), kết nối trực tiếp với Backend qua tầng Gateway chuyển tiếp, hiển thị biểu đồ nhiệt độ thời gian thực và nhật ký giao thức, cam kết **100% dữ liệu thực tế, không dùng dữ liệu giả lập (No Mock)**.

---

## 2. KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ

### 2.1. Công nghệ sử dụng
- **Ngôn ngữ Backend:** Java 17 (LTS).
- **Quản lý dự án & Build Tool:** Apache Maven 3.9+ (tích hợp Maven Wrapper `mvnw`).
- **Framework RPC:** gRPC Java `v1.62.2` (Netty Shaded Transport).
- **Định dạng dữ liệu:** Protocol Buffers `v3.25.3` (Protobuf Compiler `protoc`).
- **Giao thức mạng:** HTTP/2 (Multiplexing, Binary Framing, HPACK Header Compression).
- **Tầng kết nối Gateway:** Java Javalin `v5.6.3` / Jetty (REST API + WebSocket Server).
- **Frontend Dashboard:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.

### 2.2. Sơ đồ kiến trúc phân tầng (Architecture Diagram)

```
+---------------------------------------------------------------------------------------+
|                                    TRÌNH DUYỆT (BROWSER)                              |
|                         React + TypeScript Dashboard (Port 5173 / 8080)               |
+---------------------------------------------------------------------------------------+
        |                                                           |
   HTTP REST (JSON)                                            WebSocket (JSON)
        |                                                           |
        v                                                           v
+---------------------------------------------------------------------------------------+
|                                 JAVA GATEWAY BRIDGE                                   |
|                             SensorGateway.java (Port 8080)                            |
|     - Phục vụ Static SPA Web (frontend/dist)                                          |
|     - REST Handler: Chuyển đổi HTTP REST sang gRPC Unary Calls                         |
|     - WebSocket Handler: Ánh xạ 2 chiều JSON <==> Protobuf gRPC Streaming             |
+---------------------------------------------------------------------------------------+
                                            |
                                gRPC Channels (HTTP/2)
                                Protocol Buffers (Binary)
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                                 CORE gRPC SERVER                                      |
|                             SensorServer.java (Port 50051)                            |
|                         Kế thừa SensorServiceImplBase (HTTP/2 Netty)                  |
|                                                                                       |
|   [1. Unary]         [2. Server Stream]     [3. Client Stream]    [4. Bidi Stream]    |
|   GetCurrentTemp     MonitorTemperature     UploadSensorData      LiveTempControl     |
+---------------------------------------------------------------------------------------+
```

### 2.3. Tại sao cần lớp Gateway (Giải thích câu hỏi bảo vệ đồ án)?
- **Hạn chế của Browser:** Trình duyệt web hiện đại không hỗ trợ các API để điều khiển trực tiếp các HTTP/2 Frame nhị phân cấp thấp (như gRPC 5-byte length-prefixed framing hay HTTP/2 Trailers chứa `grpc-status`).
- **Giải pháp Gateway:** `SensorGateway` đóng vai trò là một **gRPC Client hoàn chỉnh** kết nối đến `localhost:50051`. Nó lắng nghe các kết nối WebSocket từ trình duyệt, sau đó dịch các yêu cầu này thành lời gọi hàm `StreamObserver` tương ứng sang gRPC Server và đẩy ngược kết quả về trình duyệt theo thời gian thực.

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```
demo gRPC/
├── pom.xml                               # Cấu hình dependency gRPC, Protobuf & Javalin
├── mvnw & mvnw.cmd                       # Maven Wrapper (chạy dự án không cần cấu hình PATH)
├── start.sh                              # Script khởi chạy 1 chạm toàn bộ hệ thống
├── src/
│   └── main/
│       ├── proto/
│       │   └── sensor.proto              # Bản đặc tả giao thức Protobuf (Contract)
│       └── java/
│           └── com/example/grpc/
│               ├── SensorService.java    # Cài đặt nghiệp vụ 4 phương thức gRPC
│               ├── SensorServer.java     # Khởi chạy Netty gRPC Server (Port 50051)
│               ├── SensorGateway.java    # REST/WebSocket Bridge & Web Server (Port 8080)
│               └── SensorClient.java     # Console Client kiểm thử dòng lệnh độc lập
└── frontend/                             # Giao diện Web Dashboard
    ├── package.json
    ├── vite.config.ts                    # Cấu hình Vite & Proxy mạng
    ├── src/
    │   ├── types/sensor.ts               # Định nghĩa kiểu dữ liệu TypeScript
    │   ├── services/grpcService.ts       # Service quản lý WebSocket & vòng đời gRPC
    │   ├── components/
    │   │   ├── Header.tsx                # Thanh điều hướng, trạng thái kết nối & đồng hồ
    │   │   ├── SensorOverview.tsx        # 4 thẻ chỉ số giám sát cảm biến
    │   │   ├── TemperatureChart.tsx      # Biểu đồ biến thiên nhiệt độ thời gian thực
    │   │   ├── RpcDemoPanel.tsx          # Khung chuyển đổi 4 tab tương tác gRPC
    │   │   ├── UnaryTab.tsx              # Điều khiển & quan sát Unary RPC
    │   │   ├── ServerStreamTab.tsx       # Điều khiển & quan sát Server Streaming
    │   │   ├── ClientStreamTab.tsx       # Điều khiển & quan sát Client Streaming
    │   │   ├── BidiStreamTab.tsx         # Điều khiển & quan sát Bidirectional Streaming
    │   │   └── ActivityLog.tsx           # Nhật ký hoạt động giao thức chi tiết
    │   ├── App.tsx                       # Component chính tích hợp toàn bộ màn hình
    │   └── index.css                     # Cấu hình giao diện Tailwind CSS
    └── dist/                             # Bản build tĩnh production sẵn sàng phục vụ
```

---

## 4. CHI TIẾT 4 MÔ HÌNH GIAO TIẾP gRPC

Toàn bộ dịch vụ được đặc tả trong file [`sensor.proto`](file:///Users/levanhuynh/Documents/KÌ%20I%20NĂM%204/Lập%20trình%20mạng/demo%20gRPC/src/main/proto/sensor.proto):

```protobuf
service SensorService {
    // 1. Unary RPC
    rpc GetCurrentTemperature (SensorRequest) returns (SensorData);

    // 2. Server Streaming RPC
    rpc MonitorTemperature (SubscribeRequest) returns (stream SensorData);

    // 3. Client Streaming RPC
    rpc UploadSensorData (stream SensorData) returns (SensorSummary);

    // 4. Bidirectional Streaming RPC
    rpc LiveTemperatureControl (stream SensorData) returns (stream SensorAlert);
}
```

### 4.1. Unary RPC (1 Request $\rightarrow$ 1 Response)
- **Đặc điểm:** Tương tự mô hình Client-Server truyền thống. Client gửi 1 thông điệp yêu cầu và Server trả về đúng 1 thông điệp phản hồi rồi kết thúc RPC.
- **Phương thức Java:** `blockingStub.getCurrentTemperature(request)`
- **Luồng dữ liệu:**
  ```
  Client                                           Server
    |  --- 1. SensorRequest (sensor_id) --------->   |
    |  <-- 2. SensorData (temp, timestamp, status) - | (onNext)
    |  <-- 3. HTTP/2 Trailers (grpc-status: OK) ---- | (onCompleted)
  ```
- **Ứng dụng thực tế:** Lấy thông tin tức thời, tra cứu dữ liệu (GET), xác thực tài khoản.

---

### 4.2. Server Streaming RPC (1 Request $\rightarrow$ Stream Responses)
- **Đặc điểm:** Client gửi 1 yêu cầu đăng ký theo dõi. Server giữ kết nối và liên tục gửi về một chuỗi các bản ghi (`stream SensorData`) theo thời gian thực (1 giây/bản ghi). Client nhận và xử lý từng gói tin ngay lập tức qua callback `onNext()` mà không cần chờ Server gửi xong tất cả.
- **Phương thức Java:** `asyncStub.monitorTemperature(request, responseObserver)`
- **Hỗ trợ hủy luồng:** Client có thể chủ động hủy kết nối bất kỳ lúc nào qua `ClientCallStreamObserver.cancel()`.
- **Luồng dữ liệu:**
  ```
  Client                                           Server
    |  --- 1. SubscribeRequest (duration: 6s) ---->  |
    |  <-- 2. SensorData (#1: 28.0°C) ------------   | (sau 1s)
    |  <-- 3. SensorData (#2: 28.5°C) ------------   | (sau 1s)
    |  <-- 4. SensorData (#3: 29.3°C) ------------   | (sau 1s)
    |  <-- 5. SensorData (#4: 28.8°C) ------------   | (sau 1s)
    |  <-- 6. HTTP/2 Trailers (grpc-status: OK) ---- | (onCompleted)
  ```
- **Ứng dụng thực tế:** Bảng giá chứng khoán trực tiếp, thông báo Notification, livestream vị trí tài xế (GPS tracking).

---

### 4.3. Client Streaming RPC (Stream Requests $\rightarrow$ 1 Response)
- **Đặc điểm:** Client liên tục đẩy nhiều bản ghi (`stream SensorData`) lên Server. Server nhận từng phần tử và tích lũy dữ liệu. Khi Client gửi xong và gọi `onCompleted()`, Server mới tính toán thống kê (Tổng số mẫu, Trung bình, Cao nhất, Thấp nhất) và trả về duy nhất 1 bản tóm tắt `SensorSummary`.
- **Phương thức Java:** `requestObserver = asyncStub.uploadSensorData(responseObserver)`
- **Luồng dữ liệu:**
  ```
  Client                                           Server
    |  --- 1. SensorData (#1: 26.2°C) ----------->   | (Server tích lũy)
    |  --- 2. SensorData (#2: 27.5°C) ----------->   |
    |  --- 3. SensorData (#3: 29.8°C) ----------->   |
    |  --- 4. SensorData (#4: 35.4°C) ----------->   |
    |  --- 5. onCompleted() --------------------->   | (Tính toán kết quả)
    |  <-- 6. SensorSummary (Avg, Max, Min) ------   | (onNext)
    |  <-- 7. HTTP/2 Trailers (grpc-status: OK) ---- | (onCompleted)
  ```
- **Ứng dụng thực tế:** Tải lên tập tin kích thước lớn theo từng khối (chunked file upload), IoT thiết bị thu thập gửi batch log lên đám mây định kỳ.

---

### 4.4. Bidirectional Streaming RPC (Stream Requests $\leftrightarrow$ Stream Responses)
- **Đặc điểm:** Giao tiếp **song công toàn phần (Full-Duplex)**. Cả Client và Server đều đọc và ghi trên hai luồng dữ liệu hoàn toàn độc lập. Client liên tục gửi các phép đo nhiệt độ, trong khi Server phân tích từng bản ghi tức thời và bắn về cảnh báo tương ứng (`NORMAL`, `WARNING`, `CRITICAL`). Hai chiều không bị ràng buộc tuần tự.
- **Phương thức Java:** `requestObserver = asyncStub.liveTemperatureControl(responseObserver)`
- **Ngưỡng cảnh báo nghiệp vụ:**
  - `t < 32.0°C`: Trạng thái **NORMAL** (Bình thường).
  - `32.0°C <= t < 38.0°C`: Cảnh báo **WARNING** (Vượt ngưỡng an toàn).
  - `t >= 38.0°C`: Báo động **CRITICAL** (Nguy hiểm tới hạn).
- **Luồng dữ liệu:**
  ```
  Client (Gửi dữ liệu đo)                        Server (Bắn cảnh báo)
    |  --- 1. SensorData (27.0°C) --------------->   |
    |  <-- 2. SensorAlert (NORMAL: An toàn) ------   |
    |  --- 3. SensorData (33.5°C) --------------->   |
    |  <-- 4. SensorAlert (WARNING: >= 32°C) -----   |
    |  --- 5. SensorData (41.0°C) --------------->   |
    |  <-- 6. SensorAlert (CRITICAL: >= 38°C) ----   |
    |  --- 7. onCompleted() --------------------->   |
    |  <-- 8. onCompleted() ----------------------   |
  ```
- **Ứng dụng thực tế:** Ứng dụng trò chuyện thời gian thực (Chat), Game nhiều người chơi trực tuyến, điều khiển xe tự hành/robot từ xa.

---

## 5. HƯỚNG DẪN KHỞI CHẠY VÀ KIỂM THỬ

### 5.1. Yêu cầu môi trường
- **Java:** OpenJDK 17 trở lên.
- **Maven:** 3.9+ (hoặc dùng trực tiếp `./mvnw` đi kèm dự án).
- **Node.js:** v20+ (Chỉ cần nếu muốn chạy Vite hot-reload, không bắt buộc nếu dùng cổng 8080).

### 5.2. Cách 1: Khởi chạy 1 chạm bằng Script (Khuyên dùng)
Mở Terminal tại thư mục gốc của dự án:
```bash
cd "/Users/levanhuynh/Documents/KÌ I NĂM 4/Lập trình mạng/demo gRPC"
./start.sh
```
Script sẽ tự động:
1. Biên dịch và khởi chạy gRPC Server (Port `50051`).
2. Khởi chạy Gateway Bridge & Web Server (Port `8080`).
3. Khởi chạy Vite Dev Server (Port `5173`).

---

### 5.3. Cách 2: Khởi chạy thủ công từng thành phần

#### Terminal 1: Khởi chạy gRPC Backend Server
```bash
cd "/Users/levanhuynh/Documents/KÌ I NĂM 4/Lập trình mạng/demo gRPC"
export JAVA_HOME="/Users/levanhuynh/Library/Java/JavaVirtualMachines/temurin-17.0.18/Contents/Home"
./mvnw exec:java -Dexec.mainClass="com.example.grpc.SensorServer"
```
*Server hiển thị cổng lắng nghe `50051`.*

#### Terminal 2: Khởi chạy Java Gateway Bridge
```bash
cd "/Users/levanhuynh/Documents/KÌ I NĂM 4/Lập trình mạng/demo gRPC"
export JAVA_HOME="/Users/levanhuynh/Library/Java/JavaVirtualMachines/temurin-17.0.18/Contents/Home"
./mvnw exec:java -Dexec.mainClass="com.example.grpc.SensorGateway"
```
*Gateway lắng nghe tại `http://localhost:8080/`.*

#### Terminal 3: Kiểm thử độc lập bằng Console Client (Kiểm tra gRPC thuần không qua Web)
```bash
./mvnw exec:java -Dexec.mainClass="com.example.grpc.SensorClient" -Dexec.args="all"
```

---

### 5.4. Truy cập giao diện Web Dashboard
Sau khi khởi động, mở trình duyệt tại một trong hai địa chỉ:
1. **`http://localhost:8080` (Bản tích hợp Production):** Chạy trực tiếp từ Java Gateway, không cần Node.js.
2. **`http://localhost:5173` (Bản Vite Dev Server):** Dành cho môi trường phát triển với tính năng Hot-Reload.

---

## 6. KỊCH BẢN THUYẾT TRÌNH BÁO CÁO VỚI GIẢNG VIÊN (10–15 PHÚT)

| Thời lượng | Nội dung thuyết trình | Thao tác thực tế trên màn hình | Lời thoại gợi ý & Điểm cần nhấn mạnh |
|---|---|---|---|
| **00:00 - 02:30** | **Giới thiệu đề tài & Kiến trúc** | Mở slide / file `sensor.proto` và màn hình Dashboard `http://localhost:8080`. | *"Thưa thầy/cô, hệ thống mô phỏng bài toán giám sát cảm biến IoT thời gian thực. Em sử dụng gRPC trên nền HTTP/2 để khắc phục nhược điểm của REST truyền thống. Hệ thống có 3 tầng: gRPC Server (port 50051), Gateway Bridge (port 8080) và Dashboard React."* |
| **02:30 - 04:30** | **Demo Chức năng 1: Unary RPC** | Chọn Tab 1, bấm **Get Current Temperature**. | *"Ở mô hình Unary (1-1), Client gửi 1 SensorRequest và nhận về đúng 1 SensorData. Màn hình hiển thị thời gian phản hồi thực tế (khoảng 15-30ms) và dữ liệu được tuần tự hóa bằng Protobuf nhị phân nên nhẹ hơn JSON rất nhiều."* |
| **04:30 - 07:00** | **Demo Chức năng 2: Server Streaming** | Chọn Tab 2, chọn 6 giây, bấm **Bắt đầu Server Stream**. Thử bấm nút **Dừng (Cancel)** ở lần chạy sau. | *"Ở mô hình Server Streaming (1-N), Client chỉ gửi 1 yêu cầu theo dõi duy nhất. Server liên tục bắn các gói tin về mỗi giây. Dữ liệu trên biểu đồ và danh sách nhảy ngay lập tức qua callback `onNext()` mà không cần đợi Server gửi hết. Em cũng có cài đặt nút Hủy luồng bằng `ClientCallStreamObserver.cancel()`."* |
| **07:00 - 09:30** | **Demo Chức năng 3: Client Streaming** | Chọn Tab 3, bấm **Sinh mẫu mới**, bấm **Bắt đầu Upload Stream**. | *"Ở mô hình Client Streaming (N-1), Client liên tục đẩy mảng các số đo lên Server. Server chỉ nhận và lưu lại. Khi Client gọi `onCompleted()`, Server mới tính toán và phản hồi đúng 1 thông điệp `SensorSummary` chứa Nhiệt độ TB, Max, Min và nhận xét tổng quan."* |
| **09:30 - 12:30** | **Demo Chức năng 4: Bidirectional Stream** | Chọn Tab 4, bấm **Mở phiên 2 chiều**, lần lượt bấm các nút `27.0°C`, `33.5°C`, `41.0°C` hoặc bật `Tự động đẩy mẫu`. | *"Đây là điểm mạnh nhất của gRPC: Song công độc lập 2 chiều. Hai bên gửi nhận song song trên cùng một kết nối HTTP/2. Khi Client bắn nhiệt độ cao, Server lập tức phản hồi thẻ Cảnh báo `WARNING` màu vàng hoặc `CRITICAL` màu đỏ ngay trên cột đối diện."* |
| **12:30 - 15:00** | **Tổng kết & Trả lời câu hỏi (Q&A)** | Mở phần **Nhật ký hoạt động (Activity Log)** bên dưới cùng màn hình. | *"Toàn bộ sự kiện mạng `RPC_STARTED`, `MESSAGE_RECEIVED`, `STREAM_COMPLETED` đều được ghi nhận trực tiếp từ các luồng mạng thật, chứng minh hệ thống hoạt động hoàn toàn tự động và ổn định."* |

---

## 7. BỘ CÂU HỎI VẤN ĐÁP THƯỜNG GẶP (Q&A KHI BẢO VỆ ĐỒ ÁN)

### Câu 1: gRPC vượt trội hơn REST API truyền thống ở những điểm nào?
- **Hiệu năng:** gRPC dùng Protocol Buffers (dữ liệu nhị phân mã hóa theo dạng Tag-Length-Value) giúp gói tin nhỏ hơn 3–10 lần so với JSON dạng chuỗi.
- **Tầng truyền tải:** gRPC chạy trên HTTP/2 mặc định, hỗ trợ **Multiplexing** (đa ghép kênh nhiều yêu cầu trên cùng 1 kết nối TCP), loại bỏ Head-of-Line Blocking ở tầng ứng dụng.
- **Hỗ trợ Streaming mạnh mẽ:** REST API qua HTTP/1.1 chỉ hỗ trợ Request-Response đơn lẻ; nếu muốn stream phải dùng kỹ thuật chắp vá như SSE hoặc WebSocket. gRPC hỗ trợ native cả 4 kiểu stream trong cùng một chuẩn giao thức.
- **Ràng buộc kiểu dữ liệu chặt chẽ (Strict Contract):** Bản đặc tả `.proto` ngăn ngừa hoàn toàn lỗi sai tên trường hay sai kiểu dữ liệu giữa Client và Server.

---

### Câu 2: Tại sao trình duyệt không gọi trực tiếp được gRPC Server mà cần Gateway?
- Các trình duyệt web không mở quyền cho JavaScript can thiệp vào các frame nhị phân cấp thấp của HTTP/2 (như `DATA frame` với cờ `END_STREAM`, kiểm tra cờ nén 5-byte header, hay đọc `HTTP/2 Trailers` để lấy mã lỗi `grpc-status`).
- Trình duyệt cũng không hỗ trợ Streaming Upload qua chuẩn HTTP thông thường.
- Do đó, cần một lớp Gateway (ở đây là `SensorGateway`) đóng vai trò thông dịch: Client giao tiếp với Gateway qua WebSocket, Gateway giữ kết nối HTTP/2 gRPC thuần tới Backend Server.

---

### Câu 3: HTTP/2 Multiplexing hoạt động như thế nào trong gRPC?
- Trong HTTP/1.1, mỗi kết nối TCP chỉ xử lý được một Request tại một thời điểm (phải đợi Response về mới gửi tiếp Request sau, hoặc phải mở nhiều kết nối TCP tốn tài nguyên).
- Trong HTTP/2, dữ liệu được chia nhỏ thành các **Frame nhị phân**. Mỗi Frame mang một **Stream ID** (ví dụ: Stream 1, Stream 3, Stream 5...). Các Frame từ nhiều luồng RPC khác nhau có thể xen kẽ nhau truyền qua **duy nhất một kết nối TCP**. Phía nhận dựa vào Stream ID để tái ráp lại thành các thông điệp hoàn chỉnh, giúp tối ưu băng thông và giảm độ trễ tối đa.

---

### Câu 4: Giải thích vai trò của `StreamObserver` và vòng đời của nó?
`StreamObserver<T>` là interface trung tâm của gRPC Java xây dựng theo mô hình Observer Pattern / Reactive Streams, bao gồm 3 phương thức:
1. `onNext(T value)`: Được gọi mỗi khi có một thông điệp mới được truyền qua luồng (có thể gọi 0, 1 hoặc nhiều lần).
2. `onError(Throwable t)`: Được gọi khi xảy ra sự cố mạng hoặc lỗi xử lý logic. Cuộc gọi này lập tức hủy luồng và giải phóng tài nguyên.
3. `onCompleted()`: Được gọi để thông báo bên gửi đã truyền xong toàn bộ dữ liệu. Sau khi gọi `onCompleted()`, không được gọi thêm `onNext()`.

---

### Câu 5: Sự khác nhau giữa HTTP/2 Frame và gRPC Message Framing?
- **gRPC Message Framing (Tầng ứng dụng):** Mỗi thông điệp Protobuf khi truyền đi được gRPC gắn thêm một Header 5-byte:
  - 1 byte đầu: Cờ nén dữ liệu (0: không nén, 1: nén Gzip/Snappy).
  - 4 byte tiếp theo: Độ dài (Length) của payload Protobuf nhị phân.
- **HTTP/2 Frame (Tầng truyền tải):** Là đơn vị đóng gói dữ liệu của HTTP/2 (`HEADERS frame`, `DATA frame`, `SETTINGS frame`...).
- **Mối quan hệ:** Một gRPC Message lớn có thể bị chia thành nhiều HTTP/2 `DATA frames`. Ngược lại, nhiều gRPC Message nhỏ có thể được tầng Netty gom lại vào trong một HTTP/2 `DATA frame` duy nhất để tối ưu hiệu năng đường truyền.

---

## 8. TỔNG KẾT VÀ TÀI LIỆU THAM KHẢO

Hệ thống **Real-time Sensor Monitoring System** đã hiện thực hóa thành công trọn vẹn kiến trúc gRPC Streaming hiện đại, kết hợp hài hòa giữa hiệu năng backend của Java gRPC / HTTP/2 và trải nghiệm trực quan của Web Dashboard React.

**Tài liệu tham khảo chính:**
- [Official gRPC Documentation](https://grpc.io/docs/languages/java/)
- [Protocol Buffers Language Guide (proto3)](https://protobuf.dev/programming-guides/proto3/)
- [RFC 9113: HTTP/2 Specification](https://datatracker.ietf.org/doc/html/rfc9113)
- [Javalin Lightweight Web Framework](https://javalin.io/)
