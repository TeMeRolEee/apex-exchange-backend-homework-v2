import { Worker } from 'bullmq';
import { getRedisClient } from '@server/api/lib/redisClient';
import { handleOrders } from '~/worker/handleOrders';
import { getOrderStatus } from '@server/api/lib/orderRedis/getOrderStatus';
import { setOrderStatus } from '@server/api/lib/orderRedis/setOrderStatus';
import { Status } from '@server/api/const/status';

const ordersWorker = new Worker(
	'orders',
	async (job) => {
		console.log('Processing order:', job.name, job.data);
		await setOrderStatus(job.data.id, Status.IN_PROGRESS, getRedisClient());

		await handleOrders(job.data.id, job.data, getRedisClient());

		console.log(`Order ${job.data.id} processed`);
	},
	{
		connection: getRedisClient(),
	},
);

ordersWorker.on('completed', async (job) => {
	console.log(
		`✅ Job ${job.id} completed with status: ${await getOrderStatus(job.data.id, getRedisClient())}`,
	);
});

ordersWorker.on('failed', (job, err) => {
	console.error(`❌ Job ${job?.id} failed:`, err);
});
