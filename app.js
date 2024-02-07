import express, { json } from 'express';
import aggregateResults from './aggregator.js';
import path, { join, dirname } from 'path';
import { EventEmitter } from 'node:events';
import { isMainThread, Worker } from 'node:worker_threads';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());

app.get('/api/v1/sponsored-links', async (req, res) => {
    const { pages, keywords } = req.query;
    const keywordList = keywords.split(',');
    const pagesToCrawl = parseInt(pages);

    const finishedFunction = (workerResults) => {
        const results = aggregateResults(workerResults);
        res.status(200).send(results)
    }

    await initCrawler(finishedFunction, keywordList, pagesToCrawl);
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function initCrawler(callback, keywords, pages) {
    const test = new EventEmitter();

    test.on('finished', callback);

    const workerResults = [];
    let workerCount = 0;

    const currentModuleUrl = import.meta.url;
    const currentModulePath = fileURLToPath(currentModuleUrl);
    const currentDir = dirname(currentModulePath);

    if (isMainThread) {
        Object.values(engines).forEach((func) => {
            for(let page = 0; page < pages; page++) {
                for(let keywordIndex = 0; keywordIndex < keywords.length; keywordIndex++) {
                    const worker = new Worker(join(currentDir, 'worker.js'), {
                        workerData: {
                            link: func(keywords[keywordIndex], page)
                        }
                    })
                    workerCount++;
                    worker.on('message', (data) => {
                        workerResults.push(data);
                    })
                    worker.on('exit', () => {
                        workerCount--;
                        if (workerCount === 0) {
                            test.emit('finished', workerResults);
                        }
                    })
                }

            }
        })
    }
}

const engines = {
    'google': function(keyword, page) {
        return {
            url: `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${page}`,
            keyword,
            engineName: 'google'
        };
    },
    'yahoo': function(keyword, page) {
        return {
            url: `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}&b=${page * 7 + 1}&pz=7`,
            keyword,
            engineName: 'yahoo'
        }
    },
    'bing': function(keyword, page) {
        return {
            url: `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&first=${page * 10 + 1}`,
            keyword,
            engineName: 'bing',
        }
    }
}