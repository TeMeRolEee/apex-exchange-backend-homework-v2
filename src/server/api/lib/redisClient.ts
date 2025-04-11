import Redis from "ioredis";
import { env } from "process";

const redisUrl = env.STATUS_REDIS_URL as string;

let client: Redis;

const initializeRedisClient = () => {
	client = new Redis(redisUrl, {
		maxRetriesPerRequest: null,
	});

	client.on("error", (err: Error) => {
		console.error("Redis client error:", err);
	});

	client.on("connect", () => {
		console.info("Connected to Redis successfully");
	});
};

export const getRedisClient = (): Redis => {
	if (!client) {
		initializeRedisClient();
	}
	return client;
};
