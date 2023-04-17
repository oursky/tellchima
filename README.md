### :dog: Tell Doge

> Tries to implement similar functionalities to `/tellchima`

#### Setup

```sh
$ make setup-local

# Need to fill in following mandatory secrets
# `SLACK_SIGNING_SECRET`: "Signing Secret" field at https://api.slack.com/apps/A04HKMSH3DE/general
# `SLACK_BOT_TOKEN`: "Bot User OAuth Token" field at https://api.slack.com/apps/A04HKMSH3DE/install-on-team
$ cp .env.example .env
$ make start
```

In another terminal...

```sh
# Enter the https address + "/slack/events" in "Request URL" fields for `/tell-doge` and `/untell-doge at https://api.slack.com/apps/A04HKMSH3DE/slash-commands?
$ make ngrok
```

Now enter `/enter-doge [your message]` in https://oursky.slack.com/archives/C04GPBBHRM4 to test it out!


#### Stack

This project uses following tools:
- Nodejs (Typescript)
- Prisma (SQLite connector)
- Slack SDK (BoltJS)

#### Deployment

```sh
# Build
make docker-image
make push-docker-image

# Deploy
blackbox_postdeploy
make deploy
```
