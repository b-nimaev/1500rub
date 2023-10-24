import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import { IUser, User } from "../../../models/IUser"
import { clear_chats } from "../chat.scene"

export default async function greeting(ctx: rlhubContext) {
    try {

        let message: string = ``
        message += `Chat GPT - это модель искусственного интеллекта, которая может поддерживать разговоры и отвечать на вопросы пользователей. \n\nЧтобы воспользоваться Chat GPT, вам нужно:\n\n`
        message += `1. Поставить вопрос или сформулировать сообщение. Например: "Какая погода сегодня?" или "Расскажи мне о себе".\n\n`
        message += `2. Нажать на кнопку "Отправить" или нажать клавишу Enter, чтобы отправить сообщение.\n\n` 
        message += `3. Chat GPT обработает ваш запрос и предоставит ответ. Он может задавать уточняющие вопросы, если что-то не ясно.\n\n`
        message += `4. Вы можете продолжать диалог, задавая новые вопросы или комментируя ответы.\n\n`        
        message += `Важно помнить, что Chat GPT не всегда может давать точные или полные ответы, и иногда он может быть неправильным или непонятным. Также стоит быть осторожным с предоставлением личной информации, так как модель не обладает конфиденциальностью.`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Начать диалог', callback_data: 'start-chat' }],
                    [{ text: 'Назад', callback_data: 'home' }]
                ]
            }
        }

        const user: IUser | null = await User.findOne({
            id: ctx.from?.id
        })

        if (user) {

            await clear_chats(user)

        }

        if (ctx.updateType === 'callback_query') {

            ctx.answerCbQuery()
            await ctx.editMessageText(message, extra)

        } else {

            await ctx.reply(message, extra)

        }

        ctx.wizard.selectStep(0)


    } catch (error) {

        console.error(error)

    }
}