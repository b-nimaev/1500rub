import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import { IUser, User } from "../../../models/IUser"
import rlhubContext from "../../models/rlhubContext"
import format_money from "../../utlis/format_money"
import { ConfirmedTranslations, translation } from "../../../models/ISentence"

export default async function greeting(ctx: rlhubContext) {
    try {

        if (ctx.from) {

            let user: IUser | null = await User.findOne({ id: ctx.from.id })

            if (user) {

                const extra: ExtraEditMessageText = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'О проекте',
                                    callback_data: 'about'
                                }
                            ],
                            [
                                {
                                    text: 'Мои сообщения',
                                    callback_data: 'messages'
                                }
                            ],
                            [
                                {
                                    text: '💸 Поддержка проекта',
                                    callback_data: 'help'
                                }
                            ],
                            [
                                {
                                    text: 'Персональные данные',
                                    callback_data: 'common_settings'
                                }
                            ],
                            [
                                {
                                    text: 'Справочные материалы',
                                    callback_data: 'reference_materials'
                                }
                            ],
                            [
                                {
                                    text: 'Реферальная программа',
                                    callback_data: 'referral'
                                }
                            ],
                            [
                                {
                                    text: 'Назад',
                                    callback_data: 'home'
                                },
                                {
                                    text: 'Обратная связь',
                                    url: 'https://t.me/bur_live'
                                }
                            ],
                        ]
                    }
                }


                const confirmatedTranslations: translation[] | undefined | false = await get_confirmated_translations(ctx.from.id)



                let words = []
                let message: string = `<b>Личный кабинет</b> \n\n`
                message += `Рейтинг: ${user.rating} \n`
                // message += `Добавлено слов: 0 \n`
                // message += `Слов на модерации: ${words.length} \n`
                message += `Предложено предложений для перевода: ${user.proposed_proposals?.length}\n`

                if (confirmatedTranslations) {

                    message += `Количество переведенных предложений: ${confirmatedTranslations.length} \n`
                
                }

                message += `Количество голосов за перевод: ${user.voted_translations?.length}`

                message += `\n\n<b>Внесено в проект ${format_money(user.supported)} ₽</b>`

                ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
                ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : false

            } else {
                console.log('123')
            }
        }

    } catch (err) {
        console.error(err);
    }
}

async function get_confirmated_translations(user_id: number) {
    try {

        const user: IUser | null = await User.findOne({ id: user_id })

        if (!user || !user._id) {
            return false
        }

        const docs: translation[] | null = await ConfirmedTranslations.find({ author: user._id })

        return docs

    } catch (error) {

        console.error(error)

    }
}