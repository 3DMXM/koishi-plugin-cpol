import { Context, h, Schema, Session } from 'koishi'
import { } from 'koishi-plugin-adapter-onebot'

import { AdminCmd } from './admin'
import { CPoLCmd } from './CPoL'

import type { IConfig, ICPoL } from './Interfaces'
import { randomInt } from 'crypto';
import { CPolModel } from './model'



export const name = 'cpol'

export interface Config { }

export const Config: Schema<IConfig> = Schema.object({
    BotBaesAdministrator: Schema.array(Schema.string()).default([]).description("机器人主人QQ"),
    EnableGroup: Schema.array(Schema.string()).default([]).description("启用的群"),
    setGroupAdmin: Schema.number().default(4).description("设置群管理权限"),
    DefaultIntegral: Schema.number().default(50).description("创建角色默认积分"),
    SigninMaxIntegral: Schema.number().default(10).description("签到最大积分"),
    SigninMinIntegral: Schema.number().default(1).description("签到最小积分"),
    RandomChatRewards: Schema.boolean().default(true).description("是否开启随机聊天奖励"),
    RandomChatProbability: Schema.number().default(0.15).description("奖励随机聊天概率"),
    RandomChatRewardsMinIntegral: Schema.number().default(1).description("随机聊天奖励最小值"),
    RandomChatRewardsMaxIntegral: Schema.number().default(10).description("随机聊天奖励最大值"),

    Fack: Schema.boolean().default(false).description("是否开启草群友"),
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
        id: {
            type: 'integer',
            nullable: false,
        },
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
        Fack: {
            type: 'integer',
            initial: 0
        },
        BeFack: {
            type: 'integer',
            initial: 0
        }
    }, {
        primary: 'id',
        autoInc: true,
        unique: ['id'],
    })

    ctx.middleware(async (session, next) => {
        if (config.EnableGroup.includes(session.guildId)) {
            // 是已启用的群聊

            // 判断是否是机器人主人
            if (config.BotBaesAdministrator.includes(session.userId)) {
                CPolModel.SetAuthority(ctx, session.userId, 255)
            }

            let player = await ctx.database.get('cpol_player_list', [session.userId])
            if (player.length > 0) {
                // 如果用户已经绑定了角色 
                let { card } = await session.onebot.getGroupMemberInfo(session.guildId, session.userId, true)
                if (card !== `${player[0].Game}丨${player[0].Name}`) {
                    // 如果用户的群名片和角色名不一致
                    session.onebot.setGroupCard(session.guildId, session.userId, `${player[0].Game}丨${player[0].Name}`)
                }

                // 随机聊天奖励（在平时的聊天中，可以15%的几率为上一个说话的群友随机触发1～10点的积分奖励）
                if (Math.random() < config.RandomChatProbability && config.RandomChatRewards) {
                    let num = randomInt(config.RandomChatRewardsMinIntegral, config.RandomChatRewardsMaxIntegral)
                    let new_integral = player[0].integral + num
                    ctx.database.set('cpol_player_list', [session.userId], { integral: new_integral })
                    session.send(`恭喜 ${h('at', { id: session.userId })} 在聊天时获得了${num}积分`)
                }

            }
            await next()
        }
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
