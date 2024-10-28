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

    static create(ctx: Context, groupID: string, data: any) {
        return ctx.database.create('cpol_player_list', {
            ...data,
            guildId: groupID
        })
    }

    static remove(ctx: Context, groupID: string, filter: any) {
        return ctx.database.remove('cpol_player_list', {
            ...filter,
            guildId: groupID
        })
    }
}