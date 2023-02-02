export class HackernewsService {
  async getTopStory(): Promise<{ title: string, url: string; } | null> {
    const resp = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const json = await resp.json();

    const id = json[0];
    if (!id) {
      return;
    }

    const storyResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    const storyJson =  await storyResp.json();
    const title = storyJson["title"];

    return {
      title,
      url: `https://news.ycombinator.com/item?id=${id}`
    }
  }
}
