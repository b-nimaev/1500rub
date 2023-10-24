import axios from "axios";
import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import greeting from "./vocabularView/greeting";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../models/IUser";
import { ObjectId } from "mongoose";
import { buryatWordModel } from "../../models/vocabular/IBuryatWord";
import { russianWordModel } from "../../models/vocabular/IRussianWord";
import { translationPairModel } from "../../models/IVocabular";

const handler = new Composer<rlhubContext>();
const vocabular = new Scenes.WizardScene("vocabular", 
    handler, 
    async (ctx: rlhubContext) => await translate_word(ctx),
    async (ctx: rlhubContext) => await add_pair_handler(ctx),
    async (ctx: rlhubContext) => await add_translate_handler(ctx))

async function add_translate_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'message') {

            if (ctx.update.message) {

                if (ctx.update.message.text) {

                    if (ctx.message.text === `/back`) {

                        return await greeting(ctx)

                    } else {

                        const russian_phrase: string = ctx.scene.session.russian_dict_word
                        const buryat_phrase: string = ctx.message.text

                        ctx.scene.session.buryat_dict_word = buryat_phrase

                        const extra: ExtraEditMessageText = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Отправить на проверку', callback_data: 'save' }],
                                    [{ text: 'Заполнить заново', callback_data: 'again' }],
                                    [{ text: 'Назад', callback_data: 'back' }]
                                ]
                            }
                        }

                        return await ctx.reply(`${russian_phrase} - ${buryat_phrase}`, extra)

                    }

                }

            }
        }

        if (ctx.updateType === 'callback_query') {

            let data: 'save' | 'again' | 'back' = ctx.update.callback_query.data
            
            if (data === 'back') {
                
                return await greeting(ctx)

            }

            if (data === 'again') {

                return await add_pair(ctx)

            }

            if (data === 'save') {

                const user: IUser | null = await User.findOne({
                    id: ctx.from?.id
                })

                if (user) {

                    const author: ObjectId | undefined = user._id
                    
                    const create_buryat_word = new buryatWordModel({ value: ctx.scene.session.buryat_dict_word, author }).save()
                    const create_russian_word = new russianWordModel({ value: ctx.scene.session.russian_dict_word, author }).save()

                    await new translationPairModel({
                        russian_word: [(await create_russian_word)._id],
                        buryat_word: [(await create_buryat_word)._id],
                        author: [ author ],
                        status: 0
                    }).save().then(async (response) => {

                        const id1 = (await create_buryat_word)._id
                        const id2 = (await create_russian_word)._id

                        await buryatWordModel.findByIdAndUpdate(id1, {
                            $addToSet: {
                                translations: response._id
                            }
                        })

                        await russianWordModel.findByIdAndUpdate(id2, {
                            $addToSet: {
                                translations: response._id
                            }
                        })
                        
                        await User.findByIdAndUpdate(author, {
                            $addToSet: {
                                'dictionary_section.suggested_words_on_dictionary.suggested': response._id
                            }
                        })

                    })

                }

                ctx.answerCbQuery('Ваша фраза отправлена на проверку')
                return await greeting(ctx)

            }


        }

    } catch (error) {
        
        await greeting(ctx)
        console.error(error)

    }
}

async function add_pair_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: 'back' = ctx.update.callback_query.data
            
            if (data === 'back') {
                ctx.wizard.selectStep(0)
                await greeting(ctx)
            }

            ctx.answerCbQuery()

        } else {

            if (ctx.message.text === '/back') {

                await greeting(ctx)
                ctx.wizard.selectStep(0)

            } else if (ctx.message) {
                
                ctx.scene.session.russian_dict_word = ctx.message.text

                let message: string = `Теперь отправьте перевод на бурятском языке к введеному тексту: <code>${ctx.message.text}</code>`
                message += `\n\n— Буквы отсутствующие в кириллице — <code>һ</code>, <code>ү</code>, <code>өө</code>, копируем из предложенных.\n\n`

                let extra: ExtraEditMessageText = {
                    parse_mode: 'HTML'
                }

                await ctx.reply(message, extra)
                    .then(async () => {
                        ctx.wizard.selectStep(3)
                    })
            }

        }

    } catch (error) {
        console.error(error)
    }
}


async function add_pair (ctx: rlhubContext) {
    try {

        ctx.wizard.selectStep(2)
        
        let message: string = '<b>Дополнить словарь</b>\n\n'
        message += `Отправьте слово или фразу на <b>русском языке</b>, к которому хотите добавить перевод на бурятском\n\n`
        message += `Чтобы вернуться назад отправьте команду /back`
        
        const extra: ExtraEditMessageText = { parse_mode: 'HTML' }

        if (ctx.updateType === 'callback_query') {

            await ctx.editMessageText(message, extra)
        
        } else {
        
            await ctx.reply(message, extra)
        
        }


    } catch (error) {
        
        console.error(error)

    }
}

async function translate_word(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {
            if (ctx.callbackQuery) {

                //@ts-ignore
                if (ctx.callbackQuery.data) {

                    // @ts-ignore
                    let data: 'back' | 'add_pair' = ctx.callbackQuery.data

                    if (data === "back") {

                        ctx.wizard.selectStep(0)
                        await greeting(ctx)

                    }
                    
                    if (data === 'add_pair') {

                        await add_pair(ctx)
                        ctx.answerCbQuery()
                    }

                }
            }
        }

        if (ctx.updateType === 'message') {

            if (ctx.message) {
                if (ctx.message.text) {

                    // @ts-ignore
                    let word: string = ctx.message.text
                    let language: string = ctx.session.language

                    let response = await axios.get(`https://burlang.ru/api/v1/${language}/translate?q=${word}`)
                        .then(function (response) {
                            return response.data
                        })
                        .catch(function (error) {
                            return error
                        });

                    let message: string = ''

                    if (response.translations) {
                        message = response.translations[0].value
                    } else {
                        if (language === 'russian-word') {
                            message = 'Перевод отсутствует'
                        } else {
                            message = 'Оршуулга угы байна..'
                        }
                    }


                    await ctx.reply(message, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Назад',
                                        callback_data: 'back'
                                    }
                                ]
                            ]
                        }
                    })

                } else {
                    await ctx.reply("Нужно отправить в текстовом виде")
                }
            }

        }

    } catch (err) {

        console.log(err)

    }
}

vocabular.enter(async (ctx: rlhubContext) => await greeting(ctx));

handler.action("back", async (ctx) => {
    await ctx.answerCbQuery()
    return ctx.scene.enter("home")
})

vocabular.action("russian", async (ctx) => {
    ctx.answerCbQuery()
    ctx.wizard.selectStep(1)
    ctx.session.language = 'russian-word'
    await render_translate_section(ctx)
})

vocabular.action("buryat", async (ctx) => {
    ctx.answerCbQuery()
    ctx.wizard.selectStep(1)
    ctx.session.language = 'buryat-word'
    await render_translate_section(ctx)
})

vocabular.action('add_pair', async (ctx) => {
    ctx.answerCbQuery()
    ctx.wizard.selectStep(2)
    await add_pair(ctx)
})

async function render_translate_section(ctx: rlhubContext) {

    try {

        let message = 'Отправьте слово которое нужно перевести'
        await ctx.editMessageText(message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'назад',
                            callback_data: 'back'
                        }
                    ]
                ]
            }
        })

    } catch (err) {

        console.log(err)

    }

}

handler.on("message", async (ctx: rlhubContext) => await greeting(ctx))

export default vocabular