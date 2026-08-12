const { checkMangaRSS, checkAppliRSS } = require('./checkRSS');

// checkMangaRSS(); // Send immediately on startup
// checkAppliRSS(); // Send immediately on startup
const IntervalRSS = setInterval(async () => {
      await checkMangaRSS();
      await checkAppliRSS();
    }, 30 * 60 * 1000); // Check every 30 minutes
module.exports = { IntervalRSS };