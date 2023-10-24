import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import { IUser, User } from "../../../models/IUser"

export default async function greeting(ctx: rlhubContext) {

    try {

        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: 'Указать пол',
                        callback_data: 'choose_gender'
                    }
                ],
                [
                    {
                        text: 'Указать дату рождения',
                        callback_data: 'date_birth'
                    }
                ],
                [{
                    text: 'Выбрать язык интерфейса',
                    callback_data: 'choose_ln'
                }
                ],
                [{
                    text: 'Назад',
                    callback_data: 'back'
                }],
                ]
            }
        }

        let message: string = ''

        if (ctx.from) {
            if (ctx.from?.first_name) {
                message = `<b>Личный кабинет / Настройки</b> \n\nИмя пользователя: <b>${ctx.from?.first_name}</b>`
            } else {
                message = `<b>Настройки</b> \n\nИмя пользователя: <b>${ctx.from?.id}</b>`
            }
        }

        const user: IUser | null = await User.findOne({ id: ctx.from?.id }) 
        console.log(user)

        if (user?.date_of_birth) {

            let day: number | undefined | string = user.date_of_birth.day
            if (day) {
                if (day < 10) {
                    day = `0${day}`
                }
            }

            let mounth: number | undefined | string = user.date_of_birth.mounth
            if (mounth) {
                if (mounth < 10) {
                    mounth = `0${mounth}`
                }
            }

            message += `\nДата рождения: <b>${day}.${mounth}.${user.date_of_birth.year}</b>`
        }

        // message += `\nДата рождения: 07.08.2000`
        // message += `\nЯзык интерфейса: Русский`
        
        if (user?.interface_language) {
            
            let interface_lang = `Русский язык`

            if (user.interface_language) {
                if (user.interface_language === 'english') {
                    interface_lang = 'English language'
                } else if (user.interface_language === 'buryat') {
                    interface_lang = 'Буряд хэлэн'
                } else {
                    interface_lang = 'Русский язык'
                }
            }

            message += `\nЯзык интерфейса: <b>${interface_lang}</b>`
        }
        
        
        if (user?.gender) {

            if (user.gender === 'male') {
                message += `\nВаш пол: <b>Мужской</b>`
            } else {
                message += `\nВаш пол: <b>Женский</b>`
            }

        }

        message += `\n\nДата регистрации: <b>${await get_date(user?.createdAt)}</b>`

        ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
        ctx.updateType === 'callback_query' ? await ctx.editMessageText(message, extra) : false

    } catch (err) {

        console.error(err);

    }

}

async function get_date (createdat: any) {

    const year = new Date(createdat).getFullYear()
    const month = String(new Date(createdat).getMonth() + 1).padStart(2, "0");
    const day = String(new Date(createdat).getDate()).padStart(2, "0");

    return `${day}.${month}.${year}`

}