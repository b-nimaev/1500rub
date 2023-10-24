import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import { ISentence, Sentence } from "../../../models/ISentence"
import { IUser, ProposedProposalModel, User, proposedProposalSchema } from "../../../models/IUser"
import rlhubContext from "../../models/rlhubContext"
import greeting from "./greeting"

export default async function add_sentences(ctx: rlhubContext) {

    try {

        let message = `<b>Добавление перевода — Предложения</b>\n\n`
        message += `Отправьте предложение на русском языке, которое <b>мы все вместе</b> переведем \n\n`
        message += `<code>Можно загружать сразу несколько предложений, с разделением %%</code> \n\n`
        message += `например \n`
        message += `<code>Предложение 1 %% Предложение 2 %% Предложение 3 ...</code>`
        
        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML', reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back'
                        }
                    ]
                ]
            }
        }
        
        
        if (ctx.updateType === 'callback_query') {

            ctx.answerCbQuery()
            await ctx.editMessageText(message, extra)
            ctx.wizard.selectStep(2)

        } else {
            await ctx.reply(message, extra)
            ctx.wizard.selectStep(2)

        }

    } catch (error) {

        console.error(error)
        return await greeting(ctx)
    }

}

async function add_sentences_handler(ctx: rlhubContext) {

    if (ctx.from) {
        try {

            if (ctx.updateType === 'callback_query') {
                if (ctx.updateType === 'callback_query') {

                    if (ctx.update.callback_query.data) {

                        let data: 'send_sentences' | 'back' = ctx.update.callback_query.data

                        // сохранение предложенных предложений
                        if (data === 'send_sentences') {

                            for (let i = 0; i < ctx.session.sentences.length; i++) {

                                const user: IUser | null = await User.findOne({ id: ctx.from.id })

                                if (!user || !user._id) {
                                    ctx.wizard.selectStep(0)
                                    await greeting(ctx)
                                    return false
                                }
                                
                                const sentence: ISentence = {
                                    text: ctx.session.sentences[i],
                                    author: user._id
                                }

                                new Sentence(sentence).save().then(async (createdSentence: ISentence) => {

                                    const objectID = createdSentence._id

                                    new ProposedProposalModel({ id: objectID }).save()

                                    await User.findByIdAndUpdate(user._id, {
                                        $push: {
                                            proposed_proposals: {
                                                id: objectID,
                                            }
                                        }
                                    })

                                })

                            }

                            await ctx.answerCbQuery(`${ctx.session.sentences} отправлены на проверку, спасибо!`)
                            ctx.wizard.selectStep(0)
                            await greeting(ctx)
                        }

                        if (data === 'back') {
                            ctx.wizard.selectStep(0)
                            await ctx.answerCbQuery()
                            return greeting(ctx)
                        }
                    }
                }

            } else if (ctx.updateType === 'message') {

                if (ctx.update.message.text) {

                    const text: string = ctx.update.message.text
                    const user: IUser | null = await User.findOne({ id: ctx.from.id })

                    if (!user || !user._id) {
                        return false
                    }

                    // const sentence: ISentence = {
                        // text: text.toLocaleLowerCase(),
                        // author: user._id,
                    // }

                    let message: string = ``

                    if (text.indexOf('%%') !== -1) {

                        // если массив предложений, делим их
                        let splitted = text.split('%%')
                        let arr: string[] = []
                        
                        for (let i = 0; i < splitted.length; i++) {
                        
                            arr.push(splitted[i].trimEnd().trimStart())
                        
                        }

                        ctx.session.sentences = arr

                        console.log(ctx.session.sentences)

                        for (let i = 0; i < splitted.length; i++) {

                            message += `${i + 1}) ${splitted[i].trimStart().trimEnd()}\n`
                        
                        }

                    } else {
                    
                        ctx.session.sentences = [ text ]
                        message += text
                    
                    }

                    await ctx.reply(message, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Сохранить',
                                        callback_data: 'send_sentences'
                                    }
                                ],
                                [
                                    {
                                        text: 'Отмена',
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

        } catch (err) {
            ctx.wizard.selectStep(0)
            await greeting(ctx)
        }
    }

}

export { add_sentences_handler }