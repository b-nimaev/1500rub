import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import { IUser, User } from "../../models/IUser";
import { ChatModel, IChat } from "../../models/IChat";
import greeting from "./chatView/chat.greeting";
import create_new_chat_handler from "./chatView/createNewChat";
import { ObjectId } from "mongoose";
import { sendRequest } from "./chatView/sendRequest";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: process.env.apikey,
});

const openai = new OpenAIApi(configuration);
const handler = new Composer<rlhubContext>();
const chat = new Scenes.WizardScene("chatgpt", handler,
    async (ctx: rlhubContext) => await create_new_chat_handler(ctx), // не работает
    async (ctx: rlhubContext) => await new_chat_handler(ctx),
    async (ctx: rlhubContext) => await select_chat_handler(ctx),
    async (ctx: rlhubContext) => await saving_dialog(ctx)
)

chat.enter(async (ctx: rlhubContext) => await greeting(ctx))

chat.command('main', async (ctx) => {
    return ctx.scene.enter('home')
})

// Генерация случайного целого числа от min до max
function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

chat.action("list", async (ctx: rlhubContext) => {

    try {

        const user: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        let chats: IChat[] | null = []

        if (user?.chats) {
            for (let i = 0; i < user.chats.length; i++) {

                let dialog: IChat | null = await ChatModel.findById(user.chats[i])
                if (dialog) {

                    // console.log(dialog)
                    chats.push(dialog)

                }

            }
        }


        console.log(chats)

        let message: string = `<b>Мои диалоги</b>\n\n`

        message += `Количество созданных диалогов: <b>${chats.length}</b>`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: []
            }
        }

        for (let i = 0; i < chats.length; i++) {

            // message += `${i + 1}. ${chats[i].name} \n`

            let dialog_name: string | undefined = chats[i].name

            if (dialog_name) {
                let shortedString = dialog_name?.length > 20 ? dialog_name?.substring(0, 20) + "..." : dialog_name
                extra.reply_markup?.inline_keyboard.push([{ text: `${shortedString}`, callback_data: '${i} chat' }])

            }

        }

        extra.reply_markup?.inline_keyboard.push([{ text: 'Назад', callback_data: 'back' }])

        await ctx.editMessageText(message, extra).then(() => ctx.wizard.selectStep(3))

    } catch (error) {

        ctx.answerCbQuery("Возникла ошибка")
        console.error(error)

    }

})

handler.action("home", async (ctx: rlhubContext) => {
    try {

        ctx.answerCbQuery()
        return await ctx.scene.enter('home')

    } catch (error) {

        console.error(error)

    }
})

handler.action("new_chat", async (ctx) => {

    try {

        // уведомление о создании комнаты

        let message: string = `Создание комнаты ...`
        await ctx.editMessageText(message, { parse_mode: 'HTML' })

        await ctx.telegram.sendChatAction(ctx.from.id, "typing")

        // находим пользователя

        let user: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        if (!user || !user._id) {
            return ctx.answerCbQuery("Пользователь не найден!")
        }

        let chat: IChat | undefined = {
            user_id: user._id,
            context: []
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
                    model: "gpt-4-0613",
                    temperature: .1,
                    messages: [
                        { "role": "system", "content": "Поприветствуй пользователя, тебя зовут Адам. Ты в телеграмме, бот помощник диетолога. Ты будешь отвечать пользователям по моим заготовкам. Только по моим заготовкам. Ты не должен генерировать от себя текст." },
                    ],
                }).then(async (response) => {

                    if (response) {

                        if (response.data.choices[0].message?.content) {
                            await ctx.editMessageText(response.data.choices[0].message?.content, { parse_mode: 'HTML' })
                            ctx.wizard.selectStep(2)
                        }

                        console.log(response.data.choices[0].message)

                        await ChatModel.findByIdAndUpdate(document?._id, {
                            $push: {
                                context: { "role": "system", "content": "Если пользователь задает вопрос 'у меня не уходят объемы', он под этим подразумевает объемы фигуры. Поэтому, ты категорически не должен генерировать свой ответ. Ты должен вернуть, следующий текст: Объемы лучше отслеживать по одежде, смотреть стала ли она вам большевата, или попробовать одеть то, что было мало и посмотреть, как вы сейчас себя чувствуете в этой одежде\n\nОчень часто, когда мы ориентируемся на измерительную ленту, мы можем не увидеть итоговый результат. Например, ленту расположили по-разному. На первом измерении выше на 1 см, а второй ниже. Давайте начнем отслеживать ваши объемы по одежде, хорошо?" },
                            }
                        })
                        
                        await ChatModel.findByIdAndUpdate(document?._id, {
                            $push: {
                                context: { "role": "system", "content": "Если пользователь задает вопрос 'Я заболеваю, что делать? (простуда, насморк, продуло, клиентка простыла или заболела во время программы)', Ты должен вернуть, следующий текст: Сейчас нам с вами нужно поддержать организм.\n\nВ момент, когда вы почувствовали слабость, кашель, дрожь во всем теле, насморк, головные боли, чувствуете, что заболеваете, важно поддержать себя правильным питанием.В такой период питание должно состоять из продуктов не разрушающих и ослабляющих ваш организм, а дающим силу и быстрое выздоровление.\n\nПравила питания, которые нам нужно соблюдать.\n\n✅ТЕПЛАЯ ВОДА.При боле в горле, температура всей  воды на программе(кроме медовой и чаев)  должны быть 35 - 40 С, чтобы дополнительно не повреждать раздраженную слизистую глотки.Если насморк и озноб, предпочтение отдаем горячему питью.Обильное питье позволяет не только увлажнить слизистые верхних дыхательных путей, но и уменьшить концентрацию токсинов.\n\n✅Не забываем использовать клетчатку так, как прописано на вашей ступени программы.Клетчатка является источником питания для полезных кишечных бактерий, которые будут поддерживать ваш иммунитет в процессы борьбы с простудой.\n\n✅К меню вашей ступени добавляем пустой куриный горячий бульон до 3 раз в день по 250 – 300 мл на время болезни.\n\n✅Лекарственные травы и чаи: зеленый  с мятой или липовым цветом, или душицей – потогонное средство.Выпиваем перед сном в любое время  и скорее в кровать.Также можно принимать ромашку для полоскания горла, если оно болит\n\n✅Приемы пищи от начала заболевания желательно держать в пределах 2, 5 -3 часа это позволит вам уйти от пищевого срыва после болезни, так как в первый день, а часто бывает и в течении нескольких суток начала болезни организм отказывается от пищи, есть совершенно не хочется, это естественная реакция организма: он ожесточенно отражает атаку вирусов, ему «некогда» отвлекаться на переваривание пищи." }
                            }
                        })

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

export async function clear_chats(user: IUser) {
    try {

        if (!user.chats) {
            return false
        }

        user.chats.forEach(async (element: ObjectId, index: number) => {
            if (element) {

                const dialog: IChat | null = await ChatModel.findById(element)

                if (dialog) {
                    if (!dialog.name) {

                        await ChatModel.findByIdAndDelete(dialog._id).then(async () => {
                            console.log(`${dialog._id} удалён`)
                            await User.findByIdAndUpdate(user._id, {
                                $pull: {
                                    chats: dialog._id
                                }
                            }).then(async () => {
                                console.log(`${dialog._id} удалён из записей пользователя`)
                            })
                        })

                    }
                }

            }
        });

    } catch (error) {

        console.error(error)

    }
}

handler.action("chats", async (ctx) => {

    ctx.wizard.selectStep(3)
    ctx.answerCbQuery()

    let user = await User.findOne({
        id: ctx.from?.id
    })

    let chats = await ChatModel.find({
        user_id: user?._id
    })

    const itemsOnPerPage = 5

    if (chats.length) {
        if (chats.length > itemsOnPerPage) {

            const pages = Math.ceil(chats.length / itemsOnPerPage)
            const sliced = chats.slice(0, itemsOnPerPage)

            sliced.forEach(async (element) => {
                console.log(element.name)
            })

        } else {

            let message: string = 'Выберите чат, с которым хотите продолжить работу'
            let extra: ExtraEditMessageText = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: []
                }
            }

            chats.forEach(async (chat) => {

            })

            extra.reply_markup?.inline_keyboard.push([{ text: 'Назад', callback_data: 'back' }])
            await ctx.editMessageText(message, extra)
            ctx.wizard.selectStep(3)

        }
    }

})

handler.on("message", async (ctx) => await greeting(ctx))

async function select_chat_handler(ctx: rlhubContext) {
    try {
        if (ctx.updateType === 'callback_query') {

            let data: string = ctx.update.callback_query.data

            if (data === 'back') {

                ctx.wizard.selectStep(0)
                await greeting(ctx)

            }

            ctx.answerCbQuery()

        }
    } catch (error) {
        console.error(error)
    }
}

async function new_chat_handler(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'message') {

            if (ctx.update.message.text) {

                ctx.replyWithChatAction('typing');

                const message: string = ctx.update.message.text

                if (message === '/save') {
                    ctx.wizard.selectStep(4)
                    await ctx.reply('Отправьте название, которое хотите присвоить диалогу')
                    return console.log('Saving')
                }

            }

            return await sendRequest(ctx)
        }

    } catch (error) {

        console.log(error)

    }
}

async function saving_dialog(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'message') {

            if (ctx.update.message.text) {

                const ChatID: ObjectId = ctx.scene.session.current_chat
                await ChatModel.findByIdAndUpdate(ChatID, {
                    $set: {
                        name: ctx.update.message.text
                    }
                }).then(async () => {

                    await ctx.reply(`Ваш диалог сохранен под названием <b>${ctx.update.message.text}</b>`, { parse_mode: 'HTML' })
                    return await greeting(ctx)

                }).catch(async (error) => {

                    await ctx.reply('Возникла ошибка с базой данных')
                    console.error(error)

                })

            } else {

                await ctx.reply('Отправьте в виде текста')

            }

        }

    } catch (error) {

        console.error(error)

    }
}

export default chat