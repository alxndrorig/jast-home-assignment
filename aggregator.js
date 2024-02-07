export default function aggregateResults(workerResults) {
  const aggregatedResults = {};

  for (const workerResult of workerResults) {
    for (const [keyword, sponsoredLinks] of Object.entries(workerResult)) {
        if (!aggregatedResults[keyword]) {
            aggregatedResults[keyword] = new Set();
        }
        sponsoredLinks.forEach(link => {
            aggregatedResults[keyword].add(link);
        });
    }
}

for (const keyword in aggregatedResults) {
    aggregatedResults[keyword] = Array.from(aggregatedResults[keyword]);
}

return aggregatedResults;
}
