package com.example.grpc;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * Định nghĩa Service giám sát nhiệt độ cảm biến
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.62.2)",
    comments = "Source: sensor.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class SensorServiceGrpc {

  private SensorServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "sensor.SensorService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.example.grpc.SensorRequest,
      com.example.grpc.SensorData> getGetCurrentTemperatureMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetCurrentTemperature",
      requestType = com.example.grpc.SensorRequest.class,
      responseType = com.example.grpc.SensorData.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.example.grpc.SensorRequest,
      com.example.grpc.SensorData> getGetCurrentTemperatureMethod() {
    io.grpc.MethodDescriptor<com.example.grpc.SensorRequest, com.example.grpc.SensorData> getGetCurrentTemperatureMethod;
    if ((getGetCurrentTemperatureMethod = SensorServiceGrpc.getGetCurrentTemperatureMethod) == null) {
      synchronized (SensorServiceGrpc.class) {
        if ((getGetCurrentTemperatureMethod = SensorServiceGrpc.getGetCurrentTemperatureMethod) == null) {
          SensorServiceGrpc.getGetCurrentTemperatureMethod = getGetCurrentTemperatureMethod =
              io.grpc.MethodDescriptor.<com.example.grpc.SensorRequest, com.example.grpc.SensorData>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetCurrentTemperature"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorData.getDefaultInstance()))
              .setSchemaDescriptor(new SensorServiceMethodDescriptorSupplier("GetCurrentTemperature"))
              .build();
        }
      }
    }
    return getGetCurrentTemperatureMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.example.grpc.SubscribeRequest,
      com.example.grpc.SensorData> getMonitorTemperatureMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "MonitorTemperature",
      requestType = com.example.grpc.SubscribeRequest.class,
      responseType = com.example.grpc.SensorData.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<com.example.grpc.SubscribeRequest,
      com.example.grpc.SensorData> getMonitorTemperatureMethod() {
    io.grpc.MethodDescriptor<com.example.grpc.SubscribeRequest, com.example.grpc.SensorData> getMonitorTemperatureMethod;
    if ((getMonitorTemperatureMethod = SensorServiceGrpc.getMonitorTemperatureMethod) == null) {
      synchronized (SensorServiceGrpc.class) {
        if ((getMonitorTemperatureMethod = SensorServiceGrpc.getMonitorTemperatureMethod) == null) {
          SensorServiceGrpc.getMonitorTemperatureMethod = getMonitorTemperatureMethod =
              io.grpc.MethodDescriptor.<com.example.grpc.SubscribeRequest, com.example.grpc.SensorData>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "MonitorTemperature"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SubscribeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorData.getDefaultInstance()))
              .setSchemaDescriptor(new SensorServiceMethodDescriptorSupplier("MonitorTemperature"))
              .build();
        }
      }
    }
    return getMonitorTemperatureMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.example.grpc.SensorData,
      com.example.grpc.SensorSummary> getUploadSensorDataMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UploadSensorData",
      requestType = com.example.grpc.SensorData.class,
      responseType = com.example.grpc.SensorSummary.class,
      methodType = io.grpc.MethodDescriptor.MethodType.CLIENT_STREAMING)
  public static io.grpc.MethodDescriptor<com.example.grpc.SensorData,
      com.example.grpc.SensorSummary> getUploadSensorDataMethod() {
    io.grpc.MethodDescriptor<com.example.grpc.SensorData, com.example.grpc.SensorSummary> getUploadSensorDataMethod;
    if ((getUploadSensorDataMethod = SensorServiceGrpc.getUploadSensorDataMethod) == null) {
      synchronized (SensorServiceGrpc.class) {
        if ((getUploadSensorDataMethod = SensorServiceGrpc.getUploadSensorDataMethod) == null) {
          SensorServiceGrpc.getUploadSensorDataMethod = getUploadSensorDataMethod =
              io.grpc.MethodDescriptor.<com.example.grpc.SensorData, com.example.grpc.SensorSummary>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.CLIENT_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UploadSensorData"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorData.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorSummary.getDefaultInstance()))
              .setSchemaDescriptor(new SensorServiceMethodDescriptorSupplier("UploadSensorData"))
              .build();
        }
      }
    }
    return getUploadSensorDataMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.example.grpc.SensorData,
      com.example.grpc.SensorAlert> getLiveTemperatureControlMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "LiveTemperatureControl",
      requestType = com.example.grpc.SensorData.class,
      responseType = com.example.grpc.SensorAlert.class,
      methodType = io.grpc.MethodDescriptor.MethodType.BIDI_STREAMING)
  public static io.grpc.MethodDescriptor<com.example.grpc.SensorData,
      com.example.grpc.SensorAlert> getLiveTemperatureControlMethod() {
    io.grpc.MethodDescriptor<com.example.grpc.SensorData, com.example.grpc.SensorAlert> getLiveTemperatureControlMethod;
    if ((getLiveTemperatureControlMethod = SensorServiceGrpc.getLiveTemperatureControlMethod) == null) {
      synchronized (SensorServiceGrpc.class) {
        if ((getLiveTemperatureControlMethod = SensorServiceGrpc.getLiveTemperatureControlMethod) == null) {
          SensorServiceGrpc.getLiveTemperatureControlMethod = getLiveTemperatureControlMethod =
              io.grpc.MethodDescriptor.<com.example.grpc.SensorData, com.example.grpc.SensorAlert>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.BIDI_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "LiveTemperatureControl"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorData.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.ProtoUtils.marshaller(
                  com.example.grpc.SensorAlert.getDefaultInstance()))
              .setSchemaDescriptor(new SensorServiceMethodDescriptorSupplier("LiveTemperatureControl"))
              .build();
        }
      }
    }
    return getLiveTemperatureControlMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static SensorServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SensorServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SensorServiceStub>() {
        @java.lang.Override
        public SensorServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SensorServiceStub(channel, callOptions);
        }
      };
    return SensorServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static SensorServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SensorServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SensorServiceBlockingStub>() {
        @java.lang.Override
        public SensorServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SensorServiceBlockingStub(channel, callOptions);
        }
      };
    return SensorServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static SensorServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<SensorServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<SensorServiceFutureStub>() {
        @java.lang.Override
        public SensorServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new SensorServiceFutureStub(channel, callOptions);
        }
      };
    return SensorServiceFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * Định nghĩa Service giám sát nhiệt độ cảm biến
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * 1. Unary RPC: Client gửi 1 yêu cầu lấy nhiệt độ -&gt; Server trả về đúng 1 kết quả
     * </pre>
     */
    default void getCurrentTemperature(com.example.grpc.SensorRequest request,
        io.grpc.stub.StreamObserver<com.example.grpc.SensorData> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetCurrentTemperatureMethod(), responseObserver);
    }

    /**
     * <pre>
     * 2. Server Streaming RPC: Client gửi yêu cầu theo dõi -&gt; Server stream liên tiếp 5-10 bản ghi
     * </pre>
     */
    default void monitorTemperature(com.example.grpc.SubscribeRequest request,
        io.grpc.stub.StreamObserver<com.example.grpc.SensorData> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getMonitorTemperatureMethod(), responseObserver);
    }

    /**
     * <pre>
     * 3. Client Streaming RPC: Client stream nhiều bản ghi nhiệt độ -&gt; Server tính toán và trả về 1 bản tóm tắt
     * </pre>
     */
    default io.grpc.stub.StreamObserver<com.example.grpc.SensorData> uploadSensorData(
        io.grpc.stub.StreamObserver<com.example.grpc.SensorSummary> responseObserver) {
      return io.grpc.stub.ServerCalls.asyncUnimplementedStreamingCall(getUploadSensorDataMethod(), responseObserver);
    }

    /**
     * <pre>
     * 4. Bidirectional Streaming RPC: Client stream dữ liệu liên tục &lt;-&gt; Server stream phản hồi/cảnh báo song song
     * </pre>
     */
    default io.grpc.stub.StreamObserver<com.example.grpc.SensorData> liveTemperatureControl(
        io.grpc.stub.StreamObserver<com.example.grpc.SensorAlert> responseObserver) {
      return io.grpc.stub.ServerCalls.asyncUnimplementedStreamingCall(getLiveTemperatureControlMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service SensorService.
   * <pre>
   * Định nghĩa Service giám sát nhiệt độ cảm biến
   * </pre>
   */
  public static abstract class SensorServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return SensorServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service SensorService.
   * <pre>
   * Định nghĩa Service giám sát nhiệt độ cảm biến
   * </pre>
   */
  public static final class SensorServiceStub
      extends io.grpc.stub.AbstractAsyncStub<SensorServiceStub> {
    private SensorServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SensorServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SensorServiceStub(channel, callOptions);
    }

    /**
     * <pre>
     * 1. Unary RPC: Client gửi 1 yêu cầu lấy nhiệt độ -&gt; Server trả về đúng 1 kết quả
     * </pre>
     */
    public void getCurrentTemperature(com.example.grpc.SensorRequest request,
        io.grpc.stub.StreamObserver<com.example.grpc.SensorData> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetCurrentTemperatureMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * 2. Server Streaming RPC: Client gửi yêu cầu theo dõi -&gt; Server stream liên tiếp 5-10 bản ghi
     * </pre>
     */
    public void monitorTemperature(com.example.grpc.SubscribeRequest request,
        io.grpc.stub.StreamObserver<com.example.grpc.SensorData> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getMonitorTemperatureMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * 3. Client Streaming RPC: Client stream nhiều bản ghi nhiệt độ -&gt; Server tính toán và trả về 1 bản tóm tắt
     * </pre>
     */
    public io.grpc.stub.StreamObserver<com.example.grpc.SensorData> uploadSensorData(
        io.grpc.stub.StreamObserver<com.example.grpc.SensorSummary> responseObserver) {
      return io.grpc.stub.ClientCalls.asyncClientStreamingCall(
          getChannel().newCall(getUploadSensorDataMethod(), getCallOptions()), responseObserver);
    }

    /**
     * <pre>
     * 4. Bidirectional Streaming RPC: Client stream dữ liệu liên tục &lt;-&gt; Server stream phản hồi/cảnh báo song song
     * </pre>
     */
    public io.grpc.stub.StreamObserver<com.example.grpc.SensorData> liveTemperatureControl(
        io.grpc.stub.StreamObserver<com.example.grpc.SensorAlert> responseObserver) {
      return io.grpc.stub.ClientCalls.asyncBidiStreamingCall(
          getChannel().newCall(getLiveTemperatureControlMethod(), getCallOptions()), responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service SensorService.
   * <pre>
   * Định nghĩa Service giám sát nhiệt độ cảm biến
   * </pre>
   */
  public static final class SensorServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<SensorServiceBlockingStub> {
    private SensorServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SensorServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SensorServiceBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * 1. Unary RPC: Client gửi 1 yêu cầu lấy nhiệt độ -&gt; Server trả về đúng 1 kết quả
     * </pre>
     */
    public com.example.grpc.SensorData getCurrentTemperature(com.example.grpc.SensorRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetCurrentTemperatureMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * 2. Server Streaming RPC: Client gửi yêu cầu theo dõi -&gt; Server stream liên tiếp 5-10 bản ghi
     * </pre>
     */
    public java.util.Iterator<com.example.grpc.SensorData> monitorTemperature(
        com.example.grpc.SubscribeRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getMonitorTemperatureMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service SensorService.
   * <pre>
   * Định nghĩa Service giám sát nhiệt độ cảm biến
   * </pre>
   */
  public static final class SensorServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<SensorServiceFutureStub> {
    private SensorServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected SensorServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new SensorServiceFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * 1. Unary RPC: Client gửi 1 yêu cầu lấy nhiệt độ -&gt; Server trả về đúng 1 kết quả
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.example.grpc.SensorData> getCurrentTemperature(
        com.example.grpc.SensorRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetCurrentTemperatureMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_GET_CURRENT_TEMPERATURE = 0;
  private static final int METHODID_MONITOR_TEMPERATURE = 1;
  private static final int METHODID_UPLOAD_SENSOR_DATA = 2;
  private static final int METHODID_LIVE_TEMPERATURE_CONTROL = 3;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_GET_CURRENT_TEMPERATURE:
          serviceImpl.getCurrentTemperature((com.example.grpc.SensorRequest) request,
              (io.grpc.stub.StreamObserver<com.example.grpc.SensorData>) responseObserver);
          break;
        case METHODID_MONITOR_TEMPERATURE:
          serviceImpl.monitorTemperature((com.example.grpc.SubscribeRequest) request,
              (io.grpc.stub.StreamObserver<com.example.grpc.SensorData>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_UPLOAD_SENSOR_DATA:
          return (io.grpc.stub.StreamObserver<Req>) serviceImpl.uploadSensorData(
              (io.grpc.stub.StreamObserver<com.example.grpc.SensorSummary>) responseObserver);
        case METHODID_LIVE_TEMPERATURE_CONTROL:
          return (io.grpc.stub.StreamObserver<Req>) serviceImpl.liveTemperatureControl(
              (io.grpc.stub.StreamObserver<com.example.grpc.SensorAlert>) responseObserver);
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getGetCurrentTemperatureMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.example.grpc.SensorRequest,
              com.example.grpc.SensorData>(
                service, METHODID_GET_CURRENT_TEMPERATURE)))
        .addMethod(
          getMonitorTemperatureMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              com.example.grpc.SubscribeRequest,
              com.example.grpc.SensorData>(
                service, METHODID_MONITOR_TEMPERATURE)))
        .addMethod(
          getUploadSensorDataMethod(),
          io.grpc.stub.ServerCalls.asyncClientStreamingCall(
            new MethodHandlers<
              com.example.grpc.SensorData,
              com.example.grpc.SensorSummary>(
                service, METHODID_UPLOAD_SENSOR_DATA)))
        .addMethod(
          getLiveTemperatureControlMethod(),
          io.grpc.stub.ServerCalls.asyncBidiStreamingCall(
            new MethodHandlers<
              com.example.grpc.SensorData,
              com.example.grpc.SensorAlert>(
                service, METHODID_LIVE_TEMPERATURE_CONTROL)))
        .build();
  }

  private static abstract class SensorServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoFileDescriptorSupplier, io.grpc.protobuf.ProtoServiceDescriptorSupplier {
    SensorServiceBaseDescriptorSupplier() {}

    @java.lang.Override
    public com.google.protobuf.Descriptors.FileDescriptor getFileDescriptor() {
      return com.example.grpc.SensorProto.getDescriptor();
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.ServiceDescriptor getServiceDescriptor() {
      return getFileDescriptor().findServiceByName("SensorService");
    }
  }

  private static final class SensorServiceFileDescriptorSupplier
      extends SensorServiceBaseDescriptorSupplier {
    SensorServiceFileDescriptorSupplier() {}
  }

  private static final class SensorServiceMethodDescriptorSupplier
      extends SensorServiceBaseDescriptorSupplier
      implements io.grpc.protobuf.ProtoMethodDescriptorSupplier {
    private final java.lang.String methodName;

    SensorServiceMethodDescriptorSupplier(java.lang.String methodName) {
      this.methodName = methodName;
    }

    @java.lang.Override
    public com.google.protobuf.Descriptors.MethodDescriptor getMethodDescriptor() {
      return getServiceDescriptor().findMethodByName(methodName);
    }
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (SensorServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .setSchemaDescriptor(new SensorServiceFileDescriptorSupplier())
              .addMethod(getGetCurrentTemperatureMethod())
              .addMethod(getMonitorTemperatureMethod())
              .addMethod(getUploadSensorDataMethod())
              .addMethod(getLiveTemperatureControlMethod())
              .build();
        }
      }
    }
    return result;
  }
}
