import rlhubContext from "../../models/rlhubContext"
  
export default async function create_new_chat_handler(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

        } else if (ctx.updateType === 'message' && ctx.update.message.text) {

            

        }

    } catch (error) {
        console.error(error)
    }
}