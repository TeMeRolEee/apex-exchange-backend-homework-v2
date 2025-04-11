import { Status } from '@server/api/const/status';
import type { Order, OrderInput } from '@server/api/types/order';
import type { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { getRedisClient } from '@server/api/lib/redisClient';
import { setOrderStatus } from '@server/api/lib/orderRedis/setOrderStatus';

const myQueue = new Queue('orders', {
	connection: getRedisClient(),
});

export const createOrders = async (input: OrderInput, redis: Redis) => {
	const id = crypto.randomUUID();
	const order: Order = { ...input, id, type: 'market' };
	const status = Status.PENDING;
	await setOrderStatus(id, status, redis);

	await myQueue.add('orders', order);

	return { order, status };
};
