import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import { Translation, Sentence, ISentence } from "../../../models/ISentence"
import rlhubContext from "../../models/rlhubContext"
import { translation } from "../../../models/ISentence"

export default async function report_section_render(ctx: rlhubContext) {
    try {

        let message: string = '<b>Модерация / Голосование / Жалоба</b>\n\n'

        const translation: translation | null = await Translation.findById(ctx.scene.session.current_translation_for_vote)

        if (translation) {

            await Sentence.findById(translation.sentence_russian).then(async (sentence: ISentence | null) => {

                if (sentence) {

                    message += `Предложение\n\n`
                    message += `<code>${sentence.text}</code>\n\n`

                    message += `Перевод\n\n`
                    message += `<code>${translation.translate_text}</code>`

                    message += `\n\n<b>Отправьте следующим сообщением, причину жалобы</b>`
                }

            })



            const extra: ExtraEditMessageText = { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'Назад', callback_data: 'back' }]] } }

            if (ctx.updateType === 'callback_query') {

                await ctx.editMessageText(message, extra)
                return ctx.wizard.selectStep(3)

            } else {

                await ctx.reply(message, extra)
                return ctx.wizard.selectStep(3)

            }

        }

    } catch (err) {
        console.error(err)
    }
}