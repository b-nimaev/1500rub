import dotenv from 'dotenv';
import rlhubContext from './bot/models/rlhubContext';
import { Scenes, Telegraf, session } from 'telegraf';
dotenv.config()

export const bot = new Telegraf<rlhubContext>(process.env.BOT_TOKEN!);

import './app'
import './webhook'
import './database'

import home from './bot/views/home.scene';
import { IUser, User } from './models/IUser';
import { greeting } from './bot/views/home.scene';
const stage: any = new Scenes.Stage<rlhubContext>([ home ], { default: 'home' });

home.command('get_users', async (ctx: rlhubContext) => {

    let user = await User.findOne({
        id: ctx.from?.id
    })

    if (user?.permissions?.admin) {

        let users = await User.find()
        let stats: {
            count: number
        } = {
            count: users.length
        }

        let message: string = ``

        message += `Количество пользователей: ${stats.count}\n`
        message += `/list\n`
        message += `/sendemail\n`

        return ctx.reply(message)

    } else {
        return ctx.reply('Прав нет!')
    }

});

home.command('list', async (ctx: rlhubContext) => {

    const users = await User.find()
    let message: string = ``

    users.forEach(async (element, index) => {
        message += `${index}) `

        if (element.username) {
            message += `@${element.username} `
        }

        if (element.first_name) {
            message += `<i>${element.first_name}</i>`
        }

        message += `\n`
    })

    await ctx.reply(message, { parse_mode: 'HTML' })

})

// права админа
// home.command('add_permissions', async(ctx: rlhubContext) => {

//     return await User.findOneAndUpdate({
//         id: ctx.from?.id
//     }, {
//         $set: {
//             permissions: {
//                 admin: true
//             }
//         }
//     }).then(async () => {
//         await ctx.reply('права переданы')
//     }).catch(async (error) => {
//         await ctx.reply('возникла ошибка')
//         console.error(error)
//     })

// })

bot.use(session())
bot.use(stage.middleware())
bot.start(async (ctx) => {
    await ctx.scene.enter('home')
    // ctx.deleteMessage(874)
})
bot.action(/./, async function (ctx: rlhubContext) {
    // await ctx.scene.enter('home')
    ctx.answerCbQuery()
    await greeting(ctx, true)
})
