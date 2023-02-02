export class XkcdComicService {
  async getRandomComic(): Promise<string | null> {
    const resp = await fetch("https://c.xkcd.com/random/comic/");
    const text = await resp.text();

    const comicImageURLMatches = [...text.matchAll(/Image URL \(for hotlinking\/embedding\): <a href= "(.*)">.*<\/a>/g)];
    const comicImageURL = comicImageURLMatches[0]?.[1]

    return comicImageURL;
  }
}
