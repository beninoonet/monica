require("dotenv").config();

const { WebhookClient } = require("discord.js");
const axios = require("axios");

const MANGA_RSS_URL = "https://www.manga-news.com/index.php/feed/news";
const APPLI_RSS_URL = "https://www.01net.com/actualites/applis-logiciels/feed/";
const LODESTONE_RSS_URL = "https://fr.finalfantasyxiv.com/lodestone/news/topics.xml";
const mangaWebhook = new WebhookClient({ url: process.env.MANGA_WEBHOOK_URL });
const appliWebhook = new WebhookClient({ url: process.env.APPLI_WEBHOOK_URL });
const lodestoneWebhook = new WebhookClient({ url: process.env.LODESTONE_WEBHOOK_URL });

async function fetchFeed(rssUrl) {
        const { data } = await axios.get("https://api.rss2json.com/v1/api.json", {
            params: {
                rss_url: rssUrl,
                api_key: process.env.RSS2JSON_API_KEY,
                count: 5
            }
        });

        if (data.status !== "ok") {
            console.error("Erreur lors de la récupération du flux RSS:", data.message);
            return;
        }

        return data;

}

async function checkMangaRSS() {

    try {
        const feed = await fetchFeed(MANGA_RSS_URL);
        const lastest = feed.items[0];

        await mangaWebhook.send({
            content: `**${lastest.title}**\n${lastest.link}`
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi du message Discord:", error);
    };

}

async function checkAppliRSS() {

    try {
        const feed = await fetchFeed(APPLI_RSS_URL);
        const lastest = feed.items[0];

        await appliWebhook.send({
            content: `**${lastest.title}**\n${lastest.link}`
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi du message Discord:", error);
        
    };

}

async function checkLodestoneRSS() {
     try {
        const feed = await fetchFeed(LODESTONE_RSS_URL);
        const lastest = feed.items[0];

        await lodestoneWebhook.send({
            content: `**${lastest.title}**\n${lastest.link}`
        });
    } catch (error) {
        console.error("Erreur lors de l'envoi du message Discord:", error);
        
    };
    
}

module.exports = {
    checkMangaRSS,
    checkAppliRSS,
    checkLodestoneRSS
}