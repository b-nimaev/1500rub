import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import { IUser, User } from "../../../models/IUser"

export default async function greeting(ctx: rlhubContext) {

    try {

        let message: string = `<b>Модерация</b>\n\n`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: []
            }
        }

        const user: IUser | null = await User.findOne({ id: ctx.from?.id })

        if (user?.permissions?.admin) {
        
            extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация предложений', callback_data: 'moderation_sentences' }])
            extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация переводов', callback_data: 'moderation_translates' }])
            extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация словаря', callback_data: 'moderation_vocabular' }])
            
        } else {
            
            if (user?.permissions?.dictionary_moderator) {
                extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация словаря', callback_data: 'moderation_vocabular' }])
            }
            
            if (user?.permissions?.sentences_moderator) {
                extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация предложений', callback_data: 'moderation_sentences' }])
            }
            
            if (user?.permissions?.translation_moderator) {
                extra.reply_markup?.inline_keyboard.push([{ text: 'Модерация переводов', callback_data: 'moderation_translates' }])
            }

        }

        extra.reply_markup?.inline_keyboard.push([{ text: 'Назад', callback_data: 'back' }])

        ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : false

        ctx.wizard.selectStep(0)

    } catch (err) {

        // console.error(err);

    }

}