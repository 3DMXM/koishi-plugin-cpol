import { Context } from "koishi";


export class CPolDb {
    static get(ctx: Context, groupID: string, filter: any) {
        return ctx.database.get('cpol_player_list', {
            ...filter,
            guildId: groupID
        })
    }

    static set(ctx: Context, groupID: string, filter: any, data: any) {
        return ctx.database.set('cpol_player_list', {
            ...filter,
            guildId: groupID
        }, data)
    }

    static remove(ctx: Context, groupID: string, filter: any) {
        return ctx.database.remove('cpol_player_list', {
            ...filter,
            guildId: groupID
        })
    }
}