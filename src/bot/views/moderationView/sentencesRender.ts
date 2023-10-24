import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import { Sentence, ISentence } from "../../../models/ISentence"
import rlhubContext from "../../models/rlhubContext"
import greeting from "./greeting"

export default async function moderation_sentences_render(ctx: rlhubContext) {
    try {

        return await Sentence.findOne({ accepted: "not view" }).then(async (document: ISentence | null) => {

            // Если предлождений для модерации нет

            if (!document) {

                await ctx.answerCbQuery('Предложений не найдено')
                ctx.wizard.selectStep(0)
                return await greeting(ctx).catch(() => { ctx.answerCbQuery('Предложений не найдено') })

            } else {

                // Если есть предложения для модерации сохраняем его в контекст

                if (document._id) {

                    ctx.session.__scenes.moderation_sentence = document._id

                }


                // Инициализируем переменные

                let message: string = `<b>Модерация</b> \n\n`
                let extra: ExtraEditMessageText = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '👍',
                                    callback_data: 'good'
                                },
                                {
                                    text: '👎',
                                    callback_data: 'bad'
                                }
                            ],
                            [
                                {
                                    text: 'Назад',
                                    callback_data: 'back'
                                }
                            ]
                        ]
                    }
                }

                const options = {
                    weekday: 'short', // короткое название дня недели, например 'Пн'
                    year: 'numeric', // год, например '2023'
                    month: 'short', // короткое название месяца, например 'апр'
                    day: 'numeric', // число месяца, например '21'
                    hour: 'numeric', // часы, например '17'
                    minute: 'numeric', // минуты, например '14'
                    second: 'numeric', // секунды, например '33'
                };

                const formattedDate = document.createdAt.toLocaleDateString('ru-RU', options); // 'Пн, 21 апр. 2023'

                message += `${document.text} \n\n`
                message += `<pre>${formattedDate}</pre>`

                if (ctx.updateType === 'callback_query') {

                    await ctx.editMessageText(message, extra)
                    ctx.wizard.selectStep(1)
                    ctx.answerCbQuery()

                } else {

                    await ctx.reply(message, extra)

                }

            }
        })


    } catch (err) {

        console.log(err)

    }
}