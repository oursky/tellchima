import { getSlack } from './slack';
import { getPrisma } from './prisma';
import { CronJob } from "cron";
import { ScheduledMessageService } from './services/schedule-message.service';

const taskPublishScheduledMessages = new CronJob(
  // Every day 5PM HKT
	'0 17 * * *',
	function() {
		const prisma = getPrisma();
    const slack = getSlack();

    const scheduledMesageService = new ScheduledMessageService(prisma, slack);
    scheduledMesageService.publishAndDiscard();
	},
	null,
	true,
	'Asia/Hong_Kong'
);

taskPublishScheduledMessages.start();
