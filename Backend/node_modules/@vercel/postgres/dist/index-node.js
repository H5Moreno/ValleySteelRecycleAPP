import {
  VercelClient,
  VercelPool,
  createClient,
  createPool,
  db,
  postgresConnectionString,
  sql,
  types
} from "./chunk-7IR77QAQ.js";

// src/index-node.ts
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
if (neonConfig) {
  neonConfig.webSocketConstructor = ws;
}
export {
  VercelClient,
  VercelPool,
  createClient,
  createPool,
  db,
  postgresConnectionString,
  sql,
  types
};
//# sourceMappingURL=index-node.js.map