import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import { ISentence, Sentence } from "../../../models/ISentence"
import { IProposedProposal, IUser, User } from "../../../models/IUser"
import rlhubContext from "../../models/rlhubContext"
import greeting from "./greeting"
// const timezone = 'Asia/Shanghai'; // ваш часовой пояс

export default async function my_sentences(ctx: rlhubContext) {
    try {

        let message: string = `<b>Статистика</b> \n\n`
        let extra: ExtraEditMessageText = {
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
        }

        // message += `Здесь будет отображаться ваша статисика по работе с предложениями\n\n`

        const user: IUser | null = await User.findOne({ id: ctx.from?.id })

        let props_obj: {
            accepted: ISentence[],
            declined: ISentence[],
            not_view: ISentence[]
        } = {
            accepted: [],
            declined: [],
            not_view: []
        }

        if (user) {

            let props: IProposedProposal[] | undefined = user.proposed_proposals

            if (props) {
                for (let i = 0; i < props.length; i++) {

                    const sentence: ISentence | null = await Sentence.findOne({ _id: props[i].id })

                    if (sentence) {
                        if (sentence.accepted === 'accepted') {
                            props_obj.accepted.push(sentence)
                        }
                        if (sentence.accepted === 'declined') {
                            props_obj.declined.push(sentence)
                        }
                        if (sentence.accepted === 'not view') {
                            props_obj.not_view.push(sentence)
                        }
                    }
                }
            }

            if (user.proposed_proposals) {
                
                if (user.proposed_proposals.length) {
 
                    message += `🗃 Отправлено предложений: <b>${user.proposed_proposals.length}</b>\n`
 
                    if (props_obj.accepted.length) {

                        message += `✅ <b>Принято предложений: ${props_obj.accepted.length}</b> \n`

                    }

                    if (props_obj.declined.length) {

                        message += `❌ Не принято предложений: <b>${props_obj.declined.length}</b>\n`

                    }

                    if (props_obj.not_view.length) {

                        message += `🧐 <b>Предложений на рассмотрении: ${props_obj.not_view.length}</b>`

                    }

                }
            
            }

        }

        if (ctx.updateType === 'callback_query') {

            ctx.answerCbQuery()
            await ctx.editMessageText(message, extra)

        } else {

            await ctx.reply(message, extra)

        }

        ctx.wizard.selectStep(1)

    } catch (err) {

        console.log(err)

    }
}

async function my_sentences_handler(ctx: rlhubContext) {

    try {

        if (ctx.updateType === 'callback_query') {

            if (ctx.update.callback_query.data) {

                let data: 'back' = ctx.update.callback_query.data

                if (data === "back") {

                    ctx.wizard.selectStep(0)
                    await greeting(ctx)

                }

            }
        } else {

            await my_sentences(ctx)
            
        }

    } catch (err) {

        console.log(err)

    }

}

export { my_sentences_handler }