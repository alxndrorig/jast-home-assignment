import { launch } from 'puppeteer';
import { workerData, parentPort } from 'node:worker_threads';
import engines from './engines.js';

async function crawl({keyword, engine}) {
  const browser = await launch();
  try {

    const page = await browser.newPage();
    const engineInfo = engines[engine];
    const searchQuery = engineInfo.getLink(keyword, page);

    await page.goto(searchQuery);

    await engineInfo.scrape(page, keyword, parentPort);
  } catch (error) {
    console.error(`Error crawling ${link.keyword}: ${error}`);
    
    return parentPort.postMessage({[link]: []});
  } finally {
    await browser.close();
  }
}

crawl(workerData)
