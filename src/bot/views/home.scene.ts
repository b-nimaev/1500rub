import { Composer, Scenes } from "telegraf";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { ISentence, Sentence } from "../../models/ISentence";
import { IUser, User } from "../../models/IUser";
import rlhubContext from "../models/rlhubContext";
import { sendRequest } from "./chatView/sendRequest";
import { ObjectId } from "mongoose";
import { IChat, ChatModel } from "../../models/IChat";
import { clear_chats } from "./chat.scene";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.apikey,
});

const priceCoin = 15

const openai = new OpenAIApi(configuration);

const handler = new Composer<rlhubContext>();
const home = new Scenes.WizardScene("home", 
    handler,
    async (ctx) => {
        try {

           if (ctx.updateType === 'message') {

            await sendRequest(ctx)

           }
            
        } catch (error) {

            ctx.reply('Упс, Ошибка')
            console.error(error)

        }
    },
    async (ctx: rlhubContext) => {

        if (ctx.updateType === 'message') {

            if (ctx.update.message.text) {

                if (parseFloat(ctx.update.message.text) > 0) {

                    ctx.scene.session.amount = parseFloat(ctx.update.message.text)

                    let message: string = `Счёт на ${ctx.scene.session.amount} коинов сформирован\nК оплате ${ctx.scene.session.amount*priceCoin} Rub`
                    // сформировать счёт на "ctx.scene.session.amount"

                    let extra: ExtraEditMessageText = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Назад', callback_data: 'back' }]
                            ]
                        }
                    }

                    await ctx.reply(message, extra)

                }

            }

        }

        if (ctx.updateType === 'callback_query') {

            let data: string = ctx.update.callback_query.data

            if (data === 'back') {

                ctx.wizard.selectStep(0)
                await greeting(ctx)

            }

        }

    }
);

export async function greeting (ctx: rlhubContext, reply?: boolean) {

    let user: IUser | null = await User.findOne({ id: ctx.from?.id })

    const extra: ExtraEditMessageText = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Начать диалог', callback_data: "start-chat" }],
                [{ text: 'Купить коины', callback_data: "buy-coins" }],
            ]
        }
    }

    let message: string = `Главное меню \n\n`

    message += `Коинов на балансе <code>${user.coins}</code>\nДата регистрации <code>${new Date(user.createdAt).getDate()}.${new Date(user.createdAt).getMonth() + 1}.${new Date(user.createdAt).getFullYear()}</code>`

    try {

        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : ctx.reply(message, extra)

    } catch (err) {
    
        console.log(err)
    
    }
}

home.action("buy-coins", async (ctx: rlhubContext) => {
    try {

        let message: string = `Введите количество коинов, которое хотите приобрести \n\n`

        message += `<i>1 Коин ${priceCoin} ₽</i>`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        }
        
        await ctx.editMessageText(message, extra)
        ctx.wizard.selectStep(2)

    } catch (error) {

        console.error(error)

    }
})

home.action("start-chat", async (ctx) => {

    try {
        
        // уведомление о создании комнаты

        let message: string = `Ждите. Создание комнаты ...`

        await ctx.editMessageText(message, { parse_mode: 'HTML' })

        
        // находим пользователя

        let user: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        if (!user || !user._id) {
            return ctx.answerCbQuery("Пользователь не найден!")
        }

        if (user.coins === 0) {
            
            await greeting(ctx)
            return ctx.answerCbQuery('У вас недостаточно коинов!')
            
        } else {
            
            await ctx.telegram.sendChatAction(ctx.from.id, "typing")
            
        }

        let chat: IChat | undefined = {
            user_id: user._id,
            context: [
                { "role": "system", "content": "Ты телеграмм бот" },
            ]
        }

        await clear_chats(user)

        // await ChatModel.findById()

        await new ChatModel(chat).save().then((async (response) => {

            if (!user) {
                return ctx.answerCbQuery("Пользователь не найден!")
            }

            await User.findByIdAndUpdate(user._id, { $push: { chats: response._id } })

            // сохраняем айди чата в контекст бота 
            ctx.scene.session.current_chat = response._id

        }))

        // console.log(ctx.scene.session.current_chat)

        let current_chat: ObjectId = ctx.scene.session.current_chat
        let old = await ChatModel.findById(current_chat)

        if (chat && chat.context) {
            await ChatModel.findById(current_chat).then(async (document: IChat | null) => {

                await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    temperature: .1,
                    messages: [
                        { "role": "system", "content": "Поприветствуй пользователя" },
                    ],
                }).then(async (response) => {

                    if (response) {

                        if (response.data.choices[0].message?.content) {
                            await ctx.editMessageText(response.data.choices[0].message?.content, { parse_mode: 'HTML' })
                            ctx.wizard.selectStep(1)
                        }

                        console.log(response.data.choices[0].message)

                        // await ChatModel.findByIdAndUpdate(document?._id, {
                            // $push: {
                                // context: { "role": "system", "content": "Если пользователь задает вопрос 'у меня не уходят объемы', он под этим подразумевает объемы фигуры. Поэтому, ты категорически не должен генерировать свой ответ. Ты должен вернуть, следующий текст: Объемы лучше отслеживать по одежде, смотреть стала ли она вам большевата, или попробовать одеть то, что было мало и посмотреть, как вы сейчас себя чувствуете в этой одежде\n\nОчень часто, когда мы ориентируемся на измерительную ленту, мы можем не увидеть итоговый результат. Например, ленту расположили по-разному. На первом измерении выше на 1 см, а второй ниже. Давайте начнем отслеживать ваши объемы по одежде, хорошо?" },
                            // }
                        // })

                        // await ChatModel.findByIdAndUpdate(document?._id, {
                            // $push: {
                                // context: { "role": "system", "content": "Если пользователь задает вопрос 'Я заболеваю, что делать? (простуда, насморк, продуло, клиентка простыла или заболела во время программы)', Ты должен вернуть, следующий текст: Сейчас нам с вами нужно поддержать организм.\n\nВ момент, когда вы почувствовали слабость, кашель, дрожь во всем теле, насморк, головные боли, чувствуете, что заболеваете, важно поддержать себя правильным питанием.В такой период питание должно состоять из продуктов не разрушающих и ослабляющих ваш организм, а дающим силу и быстрое выздоровление.\n\nПравила питания, которые нам нужно соблюдать.\n\n✅ТЕПЛАЯ ВОДА.При боле в горле, температура всей  воды на программе(кроме медовой и чаев)  должны быть 35 - 40 С, чтобы дополнительно не повреждать раздраженную слизистую глотки.Если насморк и озноб, предпочтение отдаем горячему питью.Обильное питье позволяет не только увлажнить слизистые верхних дыхательных путей, но и уменьшить концентрацию токсинов.\n\n✅Не забываем использовать клетчатку так, как прописано на вашей ступени программы.Клетчатка является источником питания для полезных кишечных бактерий, которые будут поддерживать ваш иммунитет в процессы борьбы с простудой.\n\n✅К меню вашей ступени добавляем пустой куриный горячий бульон до 3 раз в день по 250 – 300 мл на время болезни.\n\n✅Лекарственные травы и чаи: зеленый  с мятой или липовым цветом, или душицей – потогонное средство.Выпиваем перед сном в любое время  и скорее в кровать.Также можно принимать ромашку для полоскания горла, если оно болит\n\n✅Приемы пищи от начала заболевания желательно держать в пределах 2, 5 -3 часа это позволит вам уйти от пищевого срыва после болезни, так как в первый день, а часто бывает и в течении нескольких суток начала болезни организм отказывается от пищи, есть совершенно не хочется, это естественная реакция организма: он ожесточенно отражает атаку вирусов, ему «некогда» отвлекаться на переваривание пищи." }
                            // }
                        // })

                        await ChatModel.findByIdAndUpdate(document?._id, {
                            $push: {
                                context: response.data.choices[0].message
                            }
                        })

                    }

                }).catch(async (error) => {
                    console.error(error.response.data)
                })

            })
        }

    } catch (error) {

        console.error(error)
        return await greeting(ctx)

    }

})

home.start(async (ctx: rlhubContext) => {

    try {

        let document: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        if (!document) {

            if (ctx.from) {

                await new User(ctx.from).save().catch(err => {
                    console.log(err)
                })

                await User.findOneAndUpdate({ id: ctx.from.id }, {
                    coins: 0
                })

                await greeting(ctx)

            }

        } else {
            
            await greeting(ctx)

        }

    } catch (err) {
        console.log(err)
    }
});

async function delay (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

home.enter(async (ctx) => { return await greeting(ctx) })

// home.on("message", async (ctx) => await greeting (ctx))
home.action(/\./, async (ctx) => {
    
    console.log(ctx)
    await greeting(ctx)

})
export default home