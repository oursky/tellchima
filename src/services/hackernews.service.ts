export interface HackerStory { title: string, url: string; }

export class HackernewsService {
  async getTopStories(count: number): Promise<HackerStory[]> {
    const resp = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const json = await resp.json();

    const stories: HackerStory[] = await Promise.all(
      json.slice(0, count).map(async (id: number) => {
        const storyResp = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const storyJson =  await storyResp.json();
        const title = storyJson["title"];

        return {
          title,
          url: `https://news.ycombinator.com/item?id=${id}`
        };
      })
    );

    return stories;
  }
}
