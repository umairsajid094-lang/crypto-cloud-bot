import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { Telegraf } from 'telegraf';

// Initialize the clients directly in the code using your explicit keys
const ai = new GoogleGenAI({ apiKey: 'AIzaSyDnvip_IFP0BUGmZtTj5TWZC1NXxb5VRhk' });
const bot = new Telegraf('8964106151:AAGiXxW1aI_OjeHap4MxMEFTf1EkEpbpmFA');

async function getCryptoMarketRanks() {
    const url = "https://api.binance.com/api/v3/ticker/24hr";
    try {
        const response = await axios.get(url, { timeout: 10000 });
        const allTickers = response.data;
        
        // Filter out trading pairs that settle in USDT
        const usdtPairs = allTickers.filter(t => t.symbol.endsWith('USDT'));
        
        // Sort pairs by highest price change percentage
        const sortedByGain = usdtPairs.sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));
        
        // Extract Top 5 gainers
        const topGainers = sortedByGain.slice(0, 5);
        
        let marketSummary = "Live Binance Top Gainers Data:\n";
        topGainers.forEach(coin => {
            const symbol = coin.symbol.replace('USDT', '');
            const price = parseFloat(coin.lastPrice);
            const change = parseFloat(coin.priceChangePercent);
            marketSummary += `- $${symbol}: Current Price: $${price.toFixed(4)} | 24h Change: +${change.toFixed(2)}%\n`;
        });
            
        return marketSummary;
    } catch (error) {
        throw new Error(`Binance Extraction Failed: ${error.message}`);
    }
}

// 🤖 Telegram Command: Triggered when you click "Start"
bot.start((ctx) => {
    ctx.reply("Welcome Mohammed Samiullah! I am your custom AI Crypto Assistant. Send /update to pull live Binance market data and draft a ready-to-publish Binance Square post.");
});

// 🤖 Telegram Command: Triggered by typing /update
bot.command('update', async (ctx) => {
    try {
        await ctx.reply("⏳ 1. Fetching live tickers from Binance...");
        const rawMarketData = await getCryptoMarketRanks();
        
        await ctx.reply("🤖 2. Analyzing data with Gemini 2.5 Flash...");
        const prompt = `
            You are an expert crypto market analyst writing high-engagement update posts for a creator feed.
            Analyze this raw live data:
            ${rawMarketData}

            Write a sharp, high-value market update post based on this data.
            Requirements:
            - Keep the total length under 100 words.
            - Explicitly call out the top performing tickers using uppercase cashtags (e.g., $BTC, $BNB) at the top and bottom so trading widgets activate.
            - Tone: Informative, professional, and punchy. Avoid emoji spam.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Send the beautiful generated post back to you on Telegram
        await ctx.reply(`✨ **GENERATED POST FOR BINANCE SQUARE** ✨\n\n${response.text}`);

    } catch (error) {
        await ctx.reply(`❌ Workflow Error: ${error.message}`);
    }
});

// Launch the bot polling loop
bot.launch().then(() => {
    console.log("🚀 Telegram Bot is live and listening for commands! Press Ctrl+C to stop.");
});

// Enable graceful stop handlers
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));