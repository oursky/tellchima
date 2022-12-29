import * as dotenv from 'dotenv';
import { App } from "@slack/bolt";

dotenv.config();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});


app.command('/tell-doge', async ({ ack, respond }) => {
  await ack();

  await respond("hello");
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

