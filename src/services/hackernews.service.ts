export interface HackerStory { title: string, url: string; }

export class HackernewsService {
  async getTopStories(count: number): Promise<HackerStory[]> {
    const resp = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const json = await resp.json();

    const stories: HackerStory[] = [];

    for (const id of json.slice(0, count)) {
      const storyResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const storyJson =  await storyResp.json();
      const title = storyJson["title"];

      stories.push({
        title,
        url: `https://news.ycombinator.com/item?id=${id}`
      });
    }

    return stories;
  }
}
