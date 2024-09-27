import { Context, h, Schema, Session } from 'koishi'
import { } from '@koishijs/plugin-adapter-onebot'

import { AdminCmd } from './admin'
import { CPoLCmd } from './CPoL'

import type { IConfig, ICPoL } from './Interfaces'


export const name = 'cpol'

export interface Config { }

export const Config: Schema<IConfig> = Schema.object({
    BotBaesAdministrator: Schema.array(Schema.string()).default([]).description("机器人主人QQ"),
    EnableGroup: Schema.array(Schema.string()).default([]).description("启用的群"),
    setGroupAdmin: Schema.number().default(4).description("设置群管理权限"),
    SigninMaxIntegral: Schema.number().default(10).description("签到最大积分"),
    SigninMinIntegral: Schema.number().default(1).description("签到最小积分"),
    FackIntegral: Schema.number().default(15).description("草群友消耗"),
})

declare module 'koishi' {
    interface Tables {
        cpol_player_list: ICPoL;
    }
}

export const inject = ['database']

export function apply(ctx: Context, config: IConfig) {
    // write your plugin here

    ctx.model.extend('cpol_player_list', {
        id: 'unsigned',
        guildId: 'unsigned',
        QQ: 'unsigned',
        integral: 'unsigned',
        Game: 'string',
        Name: 'string',
        authority: 'integer',
        Married: 'boolean',
        Spouse: 'unsigned',
        gender: 'integer',
        SigninTime: 'date',
        MarriedTime: 'timestamp',
    })

    ctx.middleware(async (session, next) => {
        if (config.EnableGroup.includes(session.guildId)) await next()
        else return
    }, true)


    ctx.on('guild-member-added', async (session: Session<never, never, Context>) => {
        let { group_name, member_count, max_member_count } = await session.onebot.getGroupInfo(session.guildId)
        //         session.onebot.sendGroupMsg(session.guildId, `[CQ:at,qq=${session.userId}] 欢迎加入${group_name}~
        // 你可以发送 "创建角色" 来创建你的角色~
        // 当前群人数: ${member_count}/${max_member_count}`)
        session.send(`${h('at', { id: session.userId })} 欢迎加入${group_name}~\n当前群人数: ${member_count}/${max_member_count}`)
    })

    ctx.on('guild-member-removed', async (session: Session<never, never, Context>) => {
        // let { group_name, member_count, max_member_count } = await session.onebot.getGroupInfo(session.guildId)
        // session.onebot.sendGroupMsg(session.guildId, `[CQ:at,qq=${session.userId}] 离开了我们~`)
        session.send(`${h('at', { id: session.userId })} 离开了本群~`)
    })

    AdminCmd(ctx, config)

    CPoLCmd(ctx, config)
}
