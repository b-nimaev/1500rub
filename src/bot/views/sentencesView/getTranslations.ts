import { ObjectId } from "mongodb"
import { ISentence, translation, Translation } from "../../../models/ISentence"
import rlhubContext from "../../models/rlhubContext"
import { IUser, User } from "../../../models/IUser"

//
export default async function get_tranlations(ctx: rlhubContext, sentence: ISentence) {
    try {
        
        // разделяем переводы где и чьи
        let author_translation: translation[] = []
        let common_translation: translation[] = []

        if (!sentence.translations || !sentence.translations.length) {
            return false
        }

        // итетируем все переводы предложения
        for (let i = 0; i < sentence.translations.length; i++) {

            // получаем данные перевода
            let translation: translation | null = await Translation.findOne({
                _id: sentence.translations[i]
            })

            const user: IUser | null = await User.findOne({ id: ctx.from?.id })

            if (!user || !user._id) {
                return false
            }

            // если данные получены
            if (translation) {

                if (translation.author === user._id) {
                    
                    // если автор вы, пушим в нужный нам массив
                    author_translation.push(translation)
                    
                } else {
                    
                    // иначе в общий массив
                    common_translation.push(translation)

                }

            }

        }

        // Вернем объект для удобства
        return {
            author_translation,
            common_translation
        }


    } catch (err) {

        return false

    }
}