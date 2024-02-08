const engines = {
    'google': {
        getLink(keyword, page) {
           return `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${page}`; 
        },
        async scrape(page, keyword, parentPort) {
            const links = [];
            try {
                const adsHandles = await page.$$('.uEierd .sVXRqc');
                for(const adsHandle of adsHandles) {
                    const ads = await page.evaluate(element => element.getAttribute('href'), adsHandle);
                    if (ads !== null) {
                        links.push(ads);
                    }
                }
                parentPort.postMessage({[keyword]: links});
            } catch (err) {
                console.error(`Error while crawling ${keyword} on Google. Reason: ${err}`);
            }
        }
    },
    'yahoo': {
        getLink(keyword, page) {
           return `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}&b=${page * 7 + 1}&pz=7`;
        },
        async scrape(page, keyword, parentPort) {
            const links = [];
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

                parentPort.postMessage({[keyword]: links});
            } catch (err) {
                console.error(`Error while crawling ${keyword} on Yahoo. Reason: ${err}`);
            }
        }
    },
    'bing': {
        getLink(keyword, page) {
           return `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&first=${page * 10 + 1}`;
        },
        async scrape(page, keyword, parentPort) {
            const links = [];
            try {
                await page.$$('.b_adurl');
                const bingLinks = await page.$$eval('[data-codexads] a', (elements) => {
                    return elements.map((element) => element.href);
                });
                links.push(...bingLinks.filter(link => link !== 'javascript:void(0)'));
                parentPort.postMessage({[keyword]: links});
            } catch (err) {
                console.error(`Error while crawling ${keyword} on Bing. Reason: ${err}`);
            }
        }
    },
}

export default engines;
