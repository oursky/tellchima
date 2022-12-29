import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { App } from "@slack/bolt";
import { ScheduledMessageService } from './services/schedule-message.service';

dotenv.config();

const prisma =  new PrismaClient();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});


app.command('/tell-doge', async ({ payload, ack, respond }) => {
  await ack();

  await respond("Meow! Processing...");

  const scheduledMessageService = new ScheduledMessageService(prisma);
  const scheduledMessage = await scheduledMessageService.schedule(payload.text);

  await respond(
`Received!
Preview: \`#${scheduledMessage.id}\` ${scheduledMessage.content}`);
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('🐱 Chima is running!');
})();

