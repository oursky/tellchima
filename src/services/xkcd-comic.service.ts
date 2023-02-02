import dayjs from 'dayjs';

export class XkcdComicService {
  async getRandomComic(): Promise<string | null> {
    const now = dayjs();
    if (![1, 3, 5].includes(now.day())) {
      return;
    }

    const resp = await fetch("https://c.xkcd.com/random/comic/");
    const text = await resp.text();

    const comicImageURLMatches = [...text.matchAll(/Image URL \(for hotlinking\/embedding\): <a href= "(.*)">.*<\/a>/g)];
    const comicImageURL = comicImageURLMatches[0]?.[1]

    return comicImageURL;
  }
}
