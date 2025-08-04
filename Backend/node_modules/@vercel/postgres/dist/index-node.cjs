"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }








var _chunkBZ4XJVIWcjs = require('./chunk-BZ4XJVIW.cjs');

// src/index-node.ts
var _serverless = require('@neondatabase/serverless');
var _ws = require('ws'); var _ws2 = _interopRequireDefault(_ws);
if (_serverless.neonConfig) {
  _serverless.neonConfig.webSocketConstructor = _ws2.default;
}









exports.VercelClient = _chunkBZ4XJVIWcjs.VercelClient; exports.VercelPool = _chunkBZ4XJVIWcjs.VercelPool; exports.createClient = _chunkBZ4XJVIWcjs.createClient; exports.createPool = _chunkBZ4XJVIWcjs.createPool; exports.db = _chunkBZ4XJVIWcjs.db; exports.postgresConnectionString = _chunkBZ4XJVIWcjs.postgresConnectionString; exports.sql = _chunkBZ4XJVIWcjs.sql; exports.types = _chunkBZ4XJVIWcjs.types;
//# sourceMappingURL=index-node.cjs.map