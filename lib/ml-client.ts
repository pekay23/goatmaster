import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { MlService } from "../gen/es/goatmaster/ml/v1/ml_service_pb";

const transport = createConnectTransport({
  baseUrl: process.env.ML_SERVICE_URL ?? "http://localhost:8000",
});

export const mlClient = createClient(MlService, transport);
