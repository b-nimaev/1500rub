import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import greeting from "./settingsView/greeting";
import date_birth_handler, { date_birth, date_birth_get_years, date_birth_get_years_handler } from "./settingsView/date_of_birth";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../models/IUser";

const handler = new Composer<rlhubContext>();
const settings = new Scenes.WizardScene("settings", handler,
    async (ctx: rlhubContext) => await date_birth_handler(ctx),
    async (ctx: rlhubContext) => await date_birth_get_years_handler(ctx),
    async (ctx: rlhubContext) => await select_year(ctx),
    async (ctx: rlhubContext) => await select_ln(ctx),
    async (ctx: rlhubContext) => await select_day(ctx),
    async (ctx: rlhubContext) => await choose_gender_handler(ctx)
);

async function select_day(ctx: rlhubContext) {
    try {
        if (ctx.updateType === 'callback_query') {

            if (ctx.update.callback_query.data.indexOf('day') !== -1) {

                const date_of_birth: string = `${parseFloat(ctx.update.callback_query.data.replace('day', ''))}.${ctx.scene.session.mounth}.${ctx.scene.session.year}`
                return await User.findOneAndUpdate({
                    id: ctx.from?.id
                }, {
                    $set: {
                        date_of_birth: {
                            day: parseFloat(ctx.update.callback_query.data.replace('day', '')),
                            mounth: ctx.scene.session.mounth,
                            year: ctx.scene.session.year
                        }
                    }
                }).then(async (res) => {
                    console.log(res)
                    await greeting(ctx)
                }).catch(async (error) => {
                    await greeting(ctx)
                    console.error(error)
                })


            }

            const days = await getDaysInMonth(ctx.scene.session.mounth, ctx.scene.session.year)
            // ctx.editMessageText(`Укажите день рождения 1 - ${days}`)

            let extra: ExtraEditMessageText = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: []
                }
            }

            let row: any = []
            for (let i = 1; i < days + 1; i++) {

                // extra.reply_markup?.inline_keyboard.push()
                row.push({ callback_data: `day ${i}`, text: `${i}` })
                if (i % 5 === 0) {
                    extra.reply_markup?.inline_keyboard.push(row)
                    row = []
                }
                
                if (days === 31 && i === 31) {
                    extra.reply_markup?.inline_keyboard.push(row)
                }

                if (days === 29 && i === 29) {
                    extra.reply_markup?.inline_keyboard.push(row)
                }

                if (days === 28 && i === 28) {
                    extra.reply_markup?.inline_keyboard.push(row)
                }
            
            }

            let message: string = `Укажите день рождения`

            await ctx.editMessageText(message, extra)

        } else {
            if (ctx.updateType === 'message') {
                if (ctx.update.message.text) {

                    const days = await getDaysInMonth(ctx.scene.session.mounth, ctx.scene.session.year)
                    ctx.reply(`Укажите день рождения 1 - ${days}`)

                }
            }
        }
    } catch (error) {
        console.error(error)
    }
}

async function getDaysInMonth(month: number, year: number) {
    return new Date(year, month, 0).getDate();
}

async function select_year(ctx:rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            if (ctx.update.callback_query.data === 'back') {

                await date_birth_get_years(ctx)
                ctx.wizard.selectStep(2)

            } else {

                ctx.scene.session.year = parseFloat(ctx.update.callback_query.data)
                
                console.log(ctx.scene.session.mounth)
                console.log(ctx.scene.session.year)
                
                ctx.wizard.selectStep(5)
                await select_day(ctx)
            }

            ctx.answerCbQuery(ctx.update.callback_query.data)
            // ctx.update.callback_query.data
            // ctx.scene.session.mounth

        }

    } catch (error) {
        console.error(error)
    }
}

async function choose_gender_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: string = ctx.update.callback_query.data

            if (data === 'male' || data === 'female') {

                return await User.findOneAndUpdate({
                    id: ctx.from?.id
                }, {
                    $set: {
                        gender: data
                    }
                }).then(async () => {
                    await ctx.answerCbQuery()
                    await greeting(ctx)
                })

            }

        }

    } catch (error) {

        console.error(error)

    }
}

settings.enter(async (ctx: rlhubContext) => await greeting(ctx));
settings.action("choose_gender", async (ctx: rlhubContext) => {

    try {

        let message: string = `Укажите ваш пол`
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Мужчина', callback_data: 'male' }],
                    [{ text: 'Женщина', callback_data: 'female' }]
                ]
            }
        }

        if (ctx.updateType === 'callback_query') {

            ctx.answerCbQuery()
            await ctx.editMessageText(message, extra)

        } else {

            await ctx.reply(message, extra)

        }

        ctx.wizard.selectStep(6)


    } catch (error) {

        console.error(error)

    }

})
handler.on("message", async (ctx) => await greeting(ctx))

handler.action("back", async (ctx) => {
    await ctx.answerCbQuery()
    return ctx.scene.enter("dashboard")
})

settings.action("choose_ln", async (ctx) => {

    try {

        await render_choose_ln_section (ctx)

    } catch (error) {
        
        console.error(error)

    }

    return ctx.answerCbQuery()
})

async function render_choose_ln_section (ctx: rlhubContext) {
    try {
        let user: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        let message: string = `<b>Выберите язык интерфейса</b> \n\n`
        message += `Выбранный язык: ${user?.interface_language}`
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Русский', callback_data: 'russian' }],
                    [{ text: 'Бурятский', callback_data: 'buryat' }],
                    [{ text: 'Английский', callback_data: 'english' }],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        }
        
        await ctx.editMessageText(message, extra)
        ctx.wizard.selectStep(4)
    } catch (error) {
        console.error(error)
    }
}

async function select_ln (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: 'russian' | 'buryat' | 'english' | 'back' = ctx.update.callback_query.data

            if (data === 'back') {
                ctx.wizard.selectStep(0)
                return ctx.scene.enter("settings")
            }

            await User.findOneAndUpdate({
                id: ctx.from?.id
            }, { $set: {
                interface_language: data
            } })
            
            await render_choose_ln_section(ctx)
            
            ctx.answerCbQuery(data) 

        }

    } catch (error) {

        console.error(error)
        
    }
}

settings.action("choose_gender", async (ctx) => {
    return ctx.answerCbQuery()
})

settings.action("date_birth", async (ctx: rlhubContext) => await date_birth(ctx))

export default settings