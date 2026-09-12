import IORedis from "ioredis";
import "dotenv/config";

console.log(process.env.REDIS_HOST, process.env.REDIS_PORT, 'redis')

export const redis = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
});