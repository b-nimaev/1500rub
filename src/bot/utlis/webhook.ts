import { bot } from "../../index.js";

const fetchData = async () => {
    const { default: fetch } = await import('node-fetch');

    const res = await fetch('http://localhost:4040/api/tunnels');
    const json = await res.json();
    //@ts-ignore
    const secureTunnel = json.tunnels.find((tunnel: { proto: string }) => tunnel.proto === 'https');
    await bot.telegram.setWebhook(`${secureTunnel.public_url}/bot`);
    console.log(`webhook set: ${status}`);
};

export async function set_webhook() {
    if (process.env.MODE === 'production') {
        bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/bot${process.env.secret_path}`).then(() => {
            console.log('webhook setted');
        });
    } else {
        await fetchData().catch((error: any) => {
            console.error('Error setting webhook:', error);
        });
    }
}

module.exports = set_webhook;
