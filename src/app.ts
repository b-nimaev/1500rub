import express from 'express';
import bodyParser from 'body-parser';
import { IUser, User } from './models/IUser';
import { IPayment, Payment } from './models/IPayment';
import { ObjectId } from 'mongodb';
import { bot } from './index';
import cors from 'cors';
const morgan = require("morgan")
const PORT = process.env.PORT;
import https from 'https';
import fs from 'fs';

const app = express();
export const secretPath = `/telegraf/secret_path`;
app.use(bodyParser.json());

console.log('123')

const privateKey = fs.readFileSync('./ssl/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./ssl/fullchain.pem', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
};
// Настройка CORS
const corsOptions = {
    origin: '*', // Замените на адрес вашего клиентского приложения
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.post(`/telegraf/secret_path`, (req, res) => {
    bot.handleUpdate(req.body, res);
});

app.get("/", (req, res) => res.send("Бот запущен!"))

app.use(morgan("dev"));
app.use(express.json())
app.use(cors(corsOptions));
let server;
app.listen(5000, () => { console.log(`Server running on port ${PORT}`) });

const fetchData = async () => {
    const { default: fetch } = await import('node-fetch');

    const res = await fetch('http://127.0.0.1:4040/api/tunnels')
    //@ts-ignore
    // console.log(await res.json().tu)
    const json = await res.json();
    // console.log(json)
    //@ts-ignore
    const secureTunnel = json.tunnels[0].public_url
    console.log(secureTunnel)
    await bot.telegram.setWebhook(`${secureTunnel}${secretPath}`)
        .then(res => {
            console.log(res)
        })
};

async function set_webhook() {
    console.log(`${process.env.mode?.replace(/"/g, '')}`)
    if (`${process.env.mode?.replace(/"/g, '')}` === "production") {
        console.log(`${process.env.mode?.replace(/"/g, '')}`)
        console.log(`prod secret path: ${secretPath}`)
        await bot.telegram.setWebhook(`https://nanoscript.ru/telegraf/secret_path`)
            .then((status) => {
                console.log(secretPath);
                console.log(status);
            }).catch(err => {
                console.log(err)
            })
    } else {
        await fetchData().catch((error: any) => {
            console.error('Error setting webhook:', error);
        });
    }
};

set_webhook()
