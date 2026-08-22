const { checkMangaRSS, checkAppliRSS, checkLodestoneRSS } = require('./checkRSS');

// checkMangaRSS(); // Send immediately on startup
// checkAppliRSS(); // Send immediately on startup
const IntervalRSS = setInterval(async () => {
      await checkMangaRSS();
      await checkAppliRSS();
      await checkLodestoneRSS();
    }, 12 * 60 * 60 * 1000); // 12 hours
module.exports = { IntervalRSS };