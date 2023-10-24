import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"

export default async function greeting(ctx: rlhubContext) {

    try {

        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Русский',
                            callback_data: 'russian'
                        },
                        {
                            text: 'Бурятский',
                            callback_data: 'buryat'
                        }
                    ],
                    [
                        {
                            text: 'Дополнить словарь',
                            callback_data: 'add_pair'
                        }
                    ],
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back'
                        }
                    ],
                ]
            }
        }

        let message = `<b>Словарь</b> \n\nВыберите язык с которого нужно перевести`

        ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : false

        ctx.wizard.selectStep(0)

    } catch (err) {

        console.log(err)

    }
}