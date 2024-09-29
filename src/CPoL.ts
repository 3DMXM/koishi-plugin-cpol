import { Context, h, Schema, Session, sleep, Time } from 'koishi'
import { IConfig, ICPoL } from './Interfaces';
import { CPolModel } from './model';
import { randomInt } from 'crypto';
import { CPolDb } from './db'




export function CPoLCmd(ctx: Context, config: IConfig) {

    // 创建角色
    ctx.command('cpol', '语 C 角色管理').subcommand('创建角色 <Character>', '如：创建角色 碧蓝幻想丨娜露梅丨女').action(async ({ session }, ...args) => {
        // const [platform, qqnum] = qq.split(':')
        let character = args.join('|')
        const [game, name, gender] = character.split(/\||\丨/)

        if (!game || !name || !gender) {
            return `指令错误, 缺少参数~`
        }

        // return `character: ${character}, game: ${game}, name:${name}, gender:${gender}`

        // let checked = await ctx.database.get('cpol_player_list', session.userId)
        let checked = await CPolDb.get(ctx, session.guildId, { QQ: parseInt(session.userId) })
        if (checked.length > 0) return `你已绑定角色`

        // checked = await ctx.database.get('cpol_player_list', { Name: name })
        checked = await CPolDb.get(ctx, session.guildId, { Name: name })
        if (checked.length > 0) return `角色已存在`

        // 角色未存在
        let data = await ctx.database.create('cpol_player_list', {
            // id: parseInt(session.userId),
            guildId: parseInt(session.guildId),
            QQ: parseInt(session.userId),
            integral: config.DefaultIntegral,
            Game: game,
            Name: name,
            authority: 1,
            Married: false,
            gender: gender == '男' ? 1 : 2
        })

        session.onebot.setGroupCard(
            session.guildId,
            session.userId,
            `${game}丨${name}`,
        )
        let userinfo = await CPolModel.GetUserInfo(data, session)
        session.send(`${userinfo}\n当前积分: ${data.integral}\n欢迎 加入游戏~`)
    })

    // 签到 
    ctx.command('cpol', '语 C 角色管理').subcommand('签到', '每日签到').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', session.userId)
        let data = await CPolDb.get(ctx, session.guildId, { QQ: parseInt(session.userId) })
        if (data.length == 0) return `未绑定角色`

        let avatarUrl = CPolModel.GetQQAvatarUrl(parseInt(session.userId))

        let now = new Date()
        let last = new Date(data[0].SigninTime)
        if (now.getDate() == last.getDate()) {
            session.send(`${h('at', { id: session.userId })}\n${h('img', { src: avatarUrl })}\n你已经签到过了\n没有积分奖励哦~`)
            return
        }

        // 随机积分 在 config.SigninMinIntegral - config.SigninMaxIntegral 之间
        let random = randomInt(config.SigninMinIntegral, config.SigninMaxIntegral)

        let integral = data[0].integral + random
        // await ctx.database.set('cpol_player_list', session.userId, { integral: integral, SigninTime: now })
        await CPolDb.set(ctx, session.guildId, { QQ: parseInt(session.userId) }, { integral: integral, SigninTime: now })

        let userinfo = await CPolModel.GetUserInfo(data[0], session)

        session.send(`${userinfo}

签到成功！
本次签到获得积分: ${random}
现有积分: ${integral}`)
    })



    // 查看角色
    ctx.command('cpol', '语 C 角色管理').subcommand('查看角色', '如：查看角色').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', session.userId)
        let data = await CPolDb.get(ctx, session.guildId, { QQ: parseInt(session.userId) })

        if (data.length == 0) return `你还未绑定角色`

        let userinfo = await CPolModel.GetUserInfo(data[0], session)

        session.send(`${userinfo}\n当前积分: ${data[0].integral}`)
    })

    // 解绑角色
    ctx.command('cpol', '语 C 角色管理').subcommand('解绑角色', '如：解绑角色').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', session.userId)
        let data = await CPolDb.get(ctx, session.guildId, { QQ: parseInt(session.userId) })

        if (data.length == 0) return `你还未绑定角色`

        // await ctx.database.remove('cpol_player_list', session.userId)
        await ctx.database.remove('cpol_player_list', { QQ: parseInt(session.userId) })
        session.onebot.setGroupCard(
            session.guildId,
            session.userId,
            '',
        )

        session.send(`${h('at', { id: session.userId })} 解绑成功~`)
    })


    // 草群友
    if (config.Fack) {
        ctx.command('cpol', '语 C 角色管理').subcommand('草群友 <qq:user>', '如：草群友 @user(指定群友) 不@则随机').action(async ({ session }, qq) => {

            // let me = await ctx.database.get('cpol_player_list', session.userId)
            let me = await CPolDb.get(ctx, session.guildId, { QQ: parseInt(session.userId) })

            if (me.length == 0) return `你当前未绑定角色`

            if (me[0].integral < config.FackIntegral) {
                return `草群友需要消耗 ${config.FackIntegral}积分, 你当前有 ${me[0].integral}, 积分不足~`
            }

            let integral = me[0].integral - config.FackIntegral
            if (integral < 0) integral = 0




            let you: ICPoL

            if (qq) {
                const [platform, qqnum] = qq?.split(':')
                you = (await CPolDb.get(ctx, session.guildId, { QQ: parseInt(qqnum) }))?.[0]
                if (!you) return `对方未绑定角色`
            } else {
                // let userlist = await ctx.database.get('cpol_player_list', {
                //     id: { $ne: parseInt(session.userId) },
                // })
                let userlist = await CPolDb.get(ctx, session.guildId, { QQ: { $ne: parseInt(session.userId) } })
                // 从 userlist 中随机获取一位
                let random = Math.floor(Math.random() * userlist.length)
                you = userlist[random]
            }




            let msg = ``

            if (me[0].gender == 1) {
                if (you.gender == 1) {
                    msg = `刚刚 ${h('at', { id: me[0].QQ })} 和 ${h('at', { id: you.QQ })} 在床上展开了激烈的剑术运动，双方不相上下`
                }
                if (you.gender == 2) {
                    msg = `刚刚 ${h('at', { id: you.QQ })} 被 ${h('at', { id: me[0].QQ })} 按在床上，进行了深入交流，对方快要被征服了`
                }
            }
            if (me[0].gender == 2) {
                if (you.gender == 1) {
                    msg = `刚刚 ${h('at', { id: you.QQ })} 被 ${h('at', { id: me[0].QQ })} 推倒在床上，榨取了精华，对方都虚脱了`
                }
                if (you.gender == 2) {
                    // 刚刚某某和某某在床上进行了魔学交流。双方都得到了升华
                    msg = `刚刚 ${h('at', { id: me[0].QQ })} 和 ${h('at', { id: you.QQ })} 在床上进行了魔学交流，双方都得到了升华`
                }
            }
            session.send(`${msg}\n本次操作消耗 ${config.FackIntegral} 积分`)

            // await ctx.database.set('cpol_player_list', session.userId, { integral: integral })
            CPolDb.set(ctx, session.guildId, { QQ: parseInt(session.userId) }, { integral: integral, Fack: me[0].Fack + 1 })
            CPolDb.set(ctx, session.guildId, { QQ: you.QQ }, { BeFack: you.BeFack + 1 })

        })
    }

    // 求婚 
    ctx.command('cpol', '语 C 角色管理').subcommand('求婚 <qq:user>', '如：求婚 @user',).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')

        let me = await ctx.database.get('cpol_player_list', session.userId)
        if (me.length == 0) return `你当前未绑定角色`
        let you = await ctx.database.get('cpol_player_list', qqnum)
        if (you.length == 0) return `对方未绑定角色`

        if (session.userId == qqnum) return `不能向自己求婚`

        if (me[0].Married) return `你已经结婚了`
        if (you[0].Married) return `对方已经结婚了`



        let msg1 = ``
        let msg2 = ``
        let msg3 = ``
        if (me[0].gender == 1) {
            if (you[0].gender == 1) {
                msg1 = `${h('at', { id: me[0].QQ })}向${h('at', { id: you[0].QQ })}提出了求婚，我们祝他求婚成功。
${h('at', { id: you[0].QQ })}是否愿意与${h('at', { id: me[0].QQ })}断背山上共剑仙？`
                msg2 = `恭喜${h('at', { id: me[0].QQ })}和${h('at', { id: you[0].QQ })}！断背山下百合花，断背山上击剑法`
                msg3 = `很遗憾，对方并不想亮剑`
            }
            if (you[0].gender == 2) {
                msg1 = `${h('at', { id: me[0].QQ })}向${h('at', { id: you[0].QQ })}提出了求婚，我们祝他求婚成功。
${h('at', { id: you[0].QQ })}是否愿意嫁给${h('at', { id: me[0].QQ })}？`
                msg2 = `恭喜${h('at', { id: me[0].QQ })}和${h('at', { id: you[0].QQ })}喜结良缘，有情人终成眷属。`
                msg3 = `很遗憾，你没能打动对方。`
            }
        }
        if (me[0].gender == 2) {
            if (you[0].gender == 1) {
                msg1 = `${h('at', { id: me[0].QQ })}向${h('at', { id: you[0].QQ })}提出了求婚，我们祝她求婚成功。
${h('at', { id: you[0].QQ })}是否愿意迎娶${h('at', { id: me[0].QQ })}？`
                msg2 = `恭喜${h('at', { id: me[0].QQ })}和${h('at', { id: you[0].QQ })}喜结良缘，有情人终成眷属。`
                msg3 = `很遗憾，对方拒绝了。`
            }
            if (you[0].gender == 2) {
                msg1 = `${h('at', { id: me[0].QQ })}向${h('at', { id: you[0].QQ })}提出了求婚，我们祝她求婚成功。
${h('at', { id: you[0].QQ })}是否愿意与${h('at', { id: me[0].QQ })}百合无限好？`
                msg2 = `恭喜${h('at', { id: me[0].QQ })}和${h('at', { id: you[0].QQ })}！百合花开，富贵荣华。`
                msg3 = `很遗憾，你与对方好感度不足。`
            }
        }

        session.send(`${msg1}.\n请300秒内回复【我愿意】或【不愿意】`)

        let timeoutId: NodeJS.Timeout

        const dispose = ctx.platform(session.platform).user(qqnum).guild(session.guildId).on('message-created', ({ content }) => {
            if (content == '我愿意') {
                dispose()
                clearTimeout(timeoutId)

                // 当前时间戳 
                let time = new Date()
                // console.log(time);

                ctx.database.set('cpol_player_list', me[0].id, { Married: true, Spouse: you[0].id, MarriedTime: time })
                ctx.database.set('cpol_player_list', you[0].id, { Married: true, Spouse: me[0].id, MarriedTime: time })
                session.send(msg2)
            } else if (content == '不愿意') {
                dispose()
                clearTimeout(timeoutId)
                session.send(msg3)
            }
        })
        timeoutId = setTimeout(() => {
            dispose()
        }, 300 * Time.second)
    })

    // 离婚
    ctx.command('cpol', '语 C 角色管理').subcommand('离婚', '如：离婚',).action(async ({ session }) => {
        let me = await ctx.database.get('cpol_player_list', session.userId)
        if (me.length == 0) return `你当前未绑定角色`
        if (!me[0].Married) return `你当前未结婚`

        let you = await ctx.database.get('cpol_player_list', me[0].Spouse)
        if (you.length == 0) return `对方未绑定角色`

        let timeoutId: NodeJS.Timeout

        session.send(`${h('at', { id: me[0].Spouse })} , ${h('at', { id: me[0].QQ })} 想和你离婚, 那么...你愿意离婚吗?\n你可以回复 【我愿意】 或 【我拒绝】`)

        const dispose = ctx.platform(session.platform).user(you[0].id.toString()).guild(session.guildId).on('message-created', ({ content }) => {
            if (content == '我愿意') {
                dispose()
                clearTimeout(timeoutId)
                ctx.database.set('cpol_player_list', me[0].id, { Married: false, Spouse: 0, MarriedTime: null })
                ctx.database.set('cpol_player_list', you[0].id, { Married: false, Spouse: 0, MarriedTime: null })
                session.send(`${h('at', { id: me[0].id })} 和 ${h('at', { id: you[0].id })} 离婚啦~`)
            } else if (content == '我拒绝') {
                dispose()
                clearTimeout(timeoutId)
                session.send(`${h('at', { id: you[0].id })} 拒绝了你的离婚要求~`)
            }
        })

        timeoutId = setTimeout(() => {
            dispose()
        }, 300 * Time.second)

    })

    // 结婚证 
    ctx.command('cpol', '语 C 角色管理').subcommand('结婚证', '如：结婚证',).action(async ({ session }) => {
        let me = await ctx.database.get('cpol_player_list', session.userId)
        if (me.length == 0) return `你当前未绑定角色`
        if (!me[0].Married) return `你当前未结婚`

        let you = await ctx.database.get('cpol_player_list', me[0].Spouse)
        if (you.length == 0) return `对方未绑定角色`

        let meavatar = CPolModel.GetQQAvatarUrl(me[0].QQ)
        let youavatar = CPolModel.GetQQAvatarUrl(you[0].QQ)

        // 已结婚天数
        let now = new Date()
        let MarriedTime = new Date(me[0].MarriedTime)
        let days = Math.floor((now.getTime() - MarriedTime.getTime()) / (24 * 3600 * 1000))

        session.send(`${h('at', { id: me[0].QQ })}和${h('at', { id: you[0].QQ })} 的结婚证书
        ${h('img', { src: meavatar })} ${h('img', { src: youavatar })}
[结婚时间]: ${MarriedTime.getFullYear()}/${MarriedTime.getMonth() + 1}/${MarriedTime.getDate()} ${MarriedTime.getHours()}:${MarriedTime.getMinutes()}
[结婚天数]: ${days}天
        `)
    })

    // 排行榜
    ctx.command('cpol', '语 C 角色管理').subcommand('排行榜', '如：排行榜').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', { guildId: session.guildId })
        let data = await CPolDb.get(ctx, session.guildId, {})
        if (data.length == 0) return `当前群内没有角色`

        let rank = data.sort((a, b) => b.integral - a.integral).slice(0, 10)

        let msg = ``
        rank.forEach((item, index) => {
            msg += `${index + 1}. ${item.Game}丨${item.Name} ${item.integral}积分\n`
        })

        session.send(`当前群内积分排行榜(前十)\n${msg}`)
    })

    // 草人排行榜
    ctx.command('cpol', '语 C 角色管理').subcommand('草人排行榜', '如：草人排行榜').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', { guildId: session.guildId })
        let data = await CPolDb.get(ctx, session.guildId, {})
        if (data.length == 0) return `当前群内没有角色`

        let rank = data.sort((a, b) => b.Fack - a.Fack).slice(0, 10)

        let msg = ``
        rank.forEach((item, index) => {
            msg += `${index + 1}. ${item.Game}丨${item.Name} ${item.Fack}次\n`
        })

        session.send(`当前群内草人排行榜(前十)\n${msg}`)
    })

    // 被草人排行榜
    ctx.command('cpol', '语 C 角色管理').subcommand('被人草排行榜', '如：被草人排行榜').action(async ({ session }) => {
        // let data = await ctx.database.get('cpol_player_list', { guildId: session.guildId })
        let data = await CPolDb.get(ctx, session.guildId, {})
        if (data.length == 0) return `当前群内没有角色`

        let rank = data.sort((a, b) => b.BeFack - a.BeFack).slice(0, 10)

        let msg = ``
        rank.forEach((item, index) => {
            msg += `${index + 1}. ${item.Game}丨${item.Name} ${item.BeFack}次\n`
        })

        session.send(`当前群内被人草排行榜(前十)\n${msg}`)
    })

}


