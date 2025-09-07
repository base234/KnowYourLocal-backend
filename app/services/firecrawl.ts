// @ts-ignore
import Firecrawl from '@mendable/firecrawl-js';
// @ts-ignore
import axios from 'axios';

class FirecrawlService {
  private readonly URL = process.env.FIRECRAWL_URL;
  private readonly API_KEY = process.env.FIRECRAWL_API_KEY;
  private firecrawl;

  constructor() {
    this.firecrawl = new Firecrawl({ apiKey: this.API_KEY });
  }

  public async scrape(url: string, formats: string[] = ['markdown']) {
    // const result = await this.firecrawl.scrape(url, {
    //   formats: formats
    // });
    // return result;

    const response = await axios.post(this.URL + '/v2/scrape', {
      url: url,
      formats: formats
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_KEY}`
      }
    });
    return response.data.data;
  }

  public async crawl(url: string, limit: number = 10, pollInterval: number = 2, formats: string[] = ['markdown']) {
    const result = await this.firecrawl.crawl(url, {
      limit: limit,
      scrapeOptions: { formats: formats },
      pollInterval: pollInterval
    });
    return result;
  }

  public async crawlAsyncStart(url: string, limit: number = 10) {
    const result = await this.firecrawl.startCrawl(url, {
      excludePaths: ['*/login', '*/logout', '*/signup', '*/signin', '*/signout', '*/register', '*/forgot-password', '*/reset-password', '*/verify-email', '*/email-verification', '*/privacy-policy', '*/terms-of-service', '*/feedback', 'blog/*'],
      limit: limit
    });
    return result;
  }

  public async crawlStatus(id: string) {
    const result = await this.firecrawl.crawlStatus(id);
    return result;
  }
}

export default FirecrawlService;
