import * as dotenv from 'dotenv';
dotenv.config();

import { getPrisma } from './prisma';
import { getSlack } from './slack';
import { ScheduledMessageService } from './services/schedule-message.service';

import "./cron";

const slackApp = getSlack();

slackApp.command('/tell-doge', async ({ payload, ack, respond }) => {
  await ack();

  await respond("Meow! Processing...");

  const scheduledMessageService = new ScheduledMessageService(getPrisma(), slackApp);
  const scheduledMessage = await scheduledMessageService.schedule(payload.text);

  await respond(
`Received!
Preview: \`#${scheduledMessage.id}\` ${scheduledMessage.content}`);
});

(async () => {
  await slackApp.start(process.env.PORT || 3000);

  console.log('🐶 Doge is running!');
})();

