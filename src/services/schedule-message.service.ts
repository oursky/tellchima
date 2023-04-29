import crypto from "crypto";
import { PrismaClient, ScheduledMessage } from '@prisma/client';
import { App, Block, KnownBlock, MrkdwnElement, PlainTextElement } from '@slack/bolt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

import { SCHEDULED_MESSAGE_HASH_SALT, SCHEDULED_MESSAGE_PUBLISH_HOUR } from '../constants';
import { UserNotAuthorizedError } from '../messages';
import { XkcdComicService } from './xkcd-comic.service';
import { HackerStory, HackernewsService } from './hackernews.service';

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
    const now = dayjs();
    const mrkdwnDivider = "~----------------~";

    const messagesToBePulished = await this.prisma.scheduledMessage.findMany({
      where: {
        scheduled_at: {
          lte: now.toDate(),
        },
      },
    })

    let summaryBlocks: (PlainTextElement | MrkdwnElement)[] = [];
    for (const message of messagesToBePulished) {
      summaryBlocks.push({
        "type": "mrkdwn",
        "text": `\`#${message.id}\` ${message.content}`
      });
    }
    if (messagesToBePulished.length === 0) {
      summaryBlocks.push({
        "type": "mrkdwn",
        "text": "\n_No News._ :poorcoffee:"
      });
    }

    const messageBlocks: (KnownBlock| Block)[] = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*Chima Summary* :scarychima: (\`${process.env.SCHEDULED_MESSAGE_COMMAND_SCHEDULE}\` to add)`,
        },
      },
      ...summaryBlocks.map(block => (
        {
          "type": "section",
          "text": block
        }
      ))
    ];

    const topStories: HackerStory[] = await new HackernewsService().getTopStories(3).catch(() => []);
    if (topStories.length > 0) {
      messageBlocks.push(
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${mrkdwnDivider}\n*Hacker News Top Story* :rolled_up_newspaper:`,
          },
        },
        ...topStories.map((story, index) => ({
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${index + 1}. <${story.url}|${story.title}>`,
          },
        })),
      );
    }

    if ([1, 3, 5].includes(now.day())) {
      const randomComicURL = await new XkcdComicService().getRandomComic().catch(() => {})
      if (randomComicURL) {
        messageBlocks.push(
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `${mrkdwnDivider}\n*Random Xkcd Comic* :hehechima:`,
            },
          },
          {
            "type": "image",
            "image_url": randomComicURL,
            "alt_text": "Xkcd Comic"
          }
        );
      }
    }

    for (var block of messageBlocks) {
      // NOTE: Post every block as a message for easier reply
      await this.postMessage([block]);
    }

    await this.pruneMessages(messagesToBePulished);
  }

  private async postMessage(messageBlocks: (KnownBlock | Block)[]) {
    await this.slack.client.chat.postMessage({
      channel: process.env.SCHEDULED_MESSAGE_CHANNEL_ID,
      blocks: messageBlocks,
    })
    // FIXME: Silence slack API errors for now?
    .catch(() => {});
  }

  private async pruneMessages(messagesToBePulished: any[]) {
    await this.prisma.scheduledMessage.deleteMany({
      where: {
        id: {
          in: messagesToBePulished.map(m => m.id),
        }
      }
    })
  }
}
