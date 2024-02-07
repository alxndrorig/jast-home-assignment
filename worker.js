import { launch } from 'puppeteer';
import { workerData, parentPort } from 'node:worker_threads';

async function crawl(link) {
  const links = [];
  try {
    const browser = await launch();

    const page = await browser.newPage();
    const searchQuery = link.url;

    await page.goto(searchQuery);

    if (link.engineName === 'google') {
        try {
            const adsHandles = await page.$$('.uEierd .sVXRqc');
            for(const adsHandle of adsHandles) {
                const ads = await page.evaluate(element => element.getAttribute('href'), adsHandle);
                if (ads !== null) {
                    links.push(ads);
                }
            }
            await browser.close();
            parentPort.postMessage({[link.keyword]: links});
        } catch (err) {
            console.error(`Error while crawling ${link.keyword} on ${link.engineName}. Reason: ${err}`);
        }
        
    }

    if (link.engineName === 'yahoo') {
        try {
            await page.evaluate(() => {
              const button = document.querySelector('button[class="btn secondary accept-all "]');
              if (button) {
                button.click();
              } else {
                console.error("Yahoo: button not found");
              }
            });
            await page.waitForNavigation();
            const adsHandles = await page.$$('.searchCenterTopAds .bcan1cb');
            for(const adsHandle of adsHandles) {
                const ads = await page.evaluate(element => element.getAttribute('href'), adsHandle);
                if (ads !== null) {
                    links.push(ads);
                }
              }
              await browser.close();
      
              parentPort.postMessage({[link.keyword]: links});
          } catch (err) {
            console.error(`Error while crawling ${link.keyword} on ${link.engineName}. Reason: ${err}`);
          }
        await browser.close();
        parentPort.postMessage({[link.keyword]: links});
    }

    if (link.engineName === 'bing') {
        try {
            const adsHandles = await page.$$('.b_adurl');
            const bingLinks = await page.$$eval('[data-codexads] a', (elements) => {
                return elements.map((element) => element.href);
              });
            links.push(...bingLinks.filter(link => link !== 'javascript:void(0)'));
            await browser.close();
            parentPort.postMessage({[link.keyword]: links});
        } catch (err) {
            console.error(`Error while crawling ${link.keyword} on ${link.engineName}. Reason: ${err}`);
        }
    }

    
  } catch (error) {
    console.error(`Error crawling ${link.keyword}: ${error}`);
    
    return parentPort.postMessage({[link]: []});
  }
}

crawl(workerData?.link)
