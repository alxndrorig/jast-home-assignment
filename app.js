import express, { json } from 'express';
import aggregateResults from './aggregator.js';
import { join, dirname } from 'path';
import { EventEmitter } from 'node:events';
import { isMainThread, Worker } from 'node:worker_threads';
import { fileURLToPath } from 'url';
import engines from './engines.js';

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
    const emitter = new EventEmitter();

    emitter.on('finished', callback);

    const workerResults = [];
    let workerCount = 0;

    const currentModuleUrl = import.meta.url;
    const currentModulePath = fileURLToPath(currentModuleUrl);
    const currentDir = dirname(currentModulePath);

    if (isMainThread) {
        Object.keys(engines).forEach((engine) => {
            for(let page = 0; page < pages; page++) {
                for(let keywordIndex = 0; keywordIndex < keywords.length; keywordIndex++) {
                    debugger;
                    const worker = new Worker(join(currentDir, 'worker.js'), {
                        workerData: {
                            page,
                            engine,
                            keyword: keywords[keywordIndex],
                        }
                    })
                    workerCount++;
                    worker.on('message', (data) => {
                        workerResults.push(data);
                    })
                    worker.on('exit', () => {
                        workerCount--;
                        if (workerCount === 0) {
                            emitter.emit('finished', workerResults);
                        }
                    })
                }

            }
        })
    }
}
