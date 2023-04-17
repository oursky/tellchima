import { getSlack } from './slack';
import { getPrisma } from './prisma';
import { CronJob } from "cron";
import { ScheduledMessageService } from './services/schedule-message.service';

const taskRemindMessageScheduling = new CronJob(
  // Every day 4PM HKT (1 hour before publish i.e. 5PM HKT)
	'0 16 * * *',
	function() {
    const slack = getSlack();

    slack.client.chat.postMessage({
      channel: process.env.SCHEDULED_MESSAGE_CHANNEL_ID,
      text: `If you have something to post, please \`${process.env.SCHEDULED_MESSAGE_COMMAND_SCHEDULE}\`. Publishes daily at 5pm.`,
    })
	},
	null,
	true,
	'Asia/Hong_Kong'
);

taskRemindMessageScheduling.start();


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
