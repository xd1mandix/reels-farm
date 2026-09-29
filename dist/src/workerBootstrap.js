"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("./services/worker");
require("dotenv/config");
// import { config } from "dotenv"
// config()
(0, worker_1.startVideoWorker)();
