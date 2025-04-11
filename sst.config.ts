/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "apex-exchange-backend-homework-v2",
			removal: input?.stage === "production" ? "retain" : "remove",
			protect: [ "production" ].includes(input?.stage),
			home: "aws",
		};
	},
	async run() {
		const vpc = new sst.aws.Vpc("Homework");
		const cluster = new sst.aws.Cluster("HomeworkCluster", { vpc });

		const redis = new sst.aws.Service("redis", {
			cluster,
			loadBalancer: {
				ports: [{ listen: "6379/tcp", forward: "6379/tcp" }],
			},
			dev: {
				command: "pnpm run worker",
			},
			health: {
				command: ["CMD", "redis-cli", "ping"],
				startPeriod: "60 seconds",
				timeout: "5 seconds",
				interval: "30 seconds",
				retries: 5,
			},
			storage: `${ 15 } GB`
		});

		const worker = new sst.aws.Service("mq-worker", {
			cluster,
			loadBalancer: {
			},
			dev: {
				command: "pnpm run worker",
			},
			scaling: {
				min: 1,
				max: 5,
				cpuUtilization: 60
			},
			link: [redis]
		});

		const web = new sst.aws.Service("nextjs-app", {
			cluster,
			loadBalancer: {
				ports: [
					{ listen: "80/http", forward: "3000/http" },
					{ listen: "443/https", forward: "3000/http" }
				],
			},
			dev: {
				command: "pnpm dev",
			},
			entrypoint: ["pnpm", "start"],
			link: [redis]
		});
	},
});
