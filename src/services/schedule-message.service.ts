import crypto from "crypto";
import { PrismaClient, ScheduledMessage } from '@prisma/client';
import { App, Block, KnownBlock } from '@slack/bolt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

import { SCHEDULED_MESSAGE_HASH_SALT, SCHEDULED_MESSAGE_PUBLISH_HOUR } from '../constants';
import { UserNotAuthorizedError } from '../messages';
import { XkcdComicService } from './xkcd-comic.service';

dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Hong_Kong");

export class ScheduledMessageService {
  private prisma: PrismaClient
  private slack: App;

  constructor(prisma: PrismaClient, slack: App) {
    this.prisma = prisma;
    this.slack = slack;
  }

  // FIXME: Insecure hash
  hash(message: ScheduledMessage): string {
    return crypto.createHash("shake256", { outputLength: 6 })
      .update(`${SCHEDULED_MESSAGE_HASH_SALT}-${message.id}`)
      .digest("hex");
  }

  schedule(content: string) {
    const earliestSchedulableDate = (() => {
      let date = dayjs();

      if (date.hour() > SCHEDULED_MESSAGE_PUBLISH_HOUR) {
        date.add(1, "day");
      }
      date = date.startOf("day");
      date.set("h", SCHEDULED_MESSAGE_PUBLISH_HOUR);

      return date;
    })();

    return this.prisma.scheduledMessage.create({
      data: {
        content,
        scheduled_at: earliestSchedulableDate.toDate(),
      }
    })
  }

  async unschedule(messageID: number, deletionHash: string) {
    const message = await this.prisma.scheduledMessage.findFirst({
      where: {
        id: {
          equals: messageID,
        }
      },
    })

    if (!message || deletionHash !== this.hash(message)) {
      throw new UserNotAuthorizedError();
    }

    await this.prisma.scheduledMessage.delete({ where: { id: message.id } });
  }

  async publishAndDiscard() {
    const messagesToBePulished = await this.prisma.scheduledMessage.findMany({
      where: {
        scheduled_at: {
          lte: new Date()
        },
      },
    })

    let summaryText = `Doge Summary (\`${process.env.SHEDULED_MESSAGE_COMMAND_SCHEDULE}\` to add)`;
    for (const message of messagesToBePulished) {
      summaryText += "\n" + `\`#${message.id}\` ${message.content}`;
    }
    if (messagesToBePulished.length === 0) {
      summaryText += "\nNo News.";
    }

    const randomComicURL = await new XkcdComicService().getRandomComic().catch(() => {})

    const messageBlocks: (KnownBlock| Block)[] = [
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": summaryText,
          },
        ]
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "*Random xkcd comic* :doge:",
          },
        ]
      },
      randomComicURL && {
        "type": "image",
        "image_url": randomComicURL,
        "alt_text": "xkcd comic"
      }
    ].filter(Boolean);

    await this.slack.client.chat.postMessage({
      channel: process.env.SHEDULED_MESSAGE_CHANNEL_ID,
      blocks: messageBlocks,
    })
    // FIXME: Silence slack API errors for now?
    .catch(() => {});

    await this.prisma.scheduledMessage.deleteMany({
      where: {
        id: {
          in: messagesToBePulished.map(m => m.id),
        }
      }
    })
  }
}
