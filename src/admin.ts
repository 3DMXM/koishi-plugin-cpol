import { Context, h, Schema, sleep } from 'koishi'
import { IConfig } from './Interfaces';
import { randomInt } from 'crypto'
import { CPolModel } from './model';
import { CPolDb } from './db'

const managerAhority = {
    '机器人主人': 255,
    '超管': 4,
    '副管理': 3,
    '群员': 1,
}


export function AdminCmd(ctx: Context, config: IConfig) {

    //#region 管理员权限

    // 设置机器人管理
    ctx.command('admin', '群管理工具').subcommand('添加超管 <qq:user>', '如：添加超管 @user(前需要空格)', { authority: managerAhority.机器人主人, checkArgCount: true }).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')

        // let { aid } = (await ctx.database.get('binding', { pid: qqnum }))[0]
        // ctx.database.set('user', aid, { authority: config.setGroupAdmin })
        CPolModel.SetAuthority(ctx, qqnum, config.setGroupAdmin)

        session.send(`${h('at', { id: qqnum })}被设置为机器人管理员`)
    })

    // 取消机器人管理
    ctx.command('admin', '群管理工具').subcommand('取消超管 <qq:user>', '如：取消超管 @user(前需要空格)', { authority: managerAhority.机器人主人, checkArgCount: true }).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')

        let { aid } = (await ctx.database.get('binding', { pid: qqnum }))[0]

        ctx.database.set('user', aid, { authority: 1 })

        session.send(`${h('at', { id: qqnum })}被取消机器人管理员`)
    })


    // 升为管理
    ctx.command('admin', '群管理工具').subcommand('升为管理 <qq:user>', '如：取消管理 @user(前需要空格)', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')
        session.onebot.setGroupAdmin(
            session.guildId,
            qqnum,
            true,
        )
        session.send(`${h('at', { id: qqnum })} 升为了管理员~`)

    })

    // 取消管理
    ctx.command('admin', '群管理工具').subcommand('取消管理 <qq:user>', '如：取消管理 @user(前需要空格)', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')
        session.onebot.setGroupAdmin(
            session.guildId,
            qqnum,
            false,
        )
        session.send(`${h('at', { id: qqnum })} 取消了管理~`)
    })

    // 设置禁言
    ctx.command('admin', '群管理工具').subcommand('禁言 <qq:user>  <duration:number> <type>', '如：禁言 @user(前需要空格) 1 分钟', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq, duration, type) => {
        const [platform, qqnum] = qq.split(':')

        switch (type) {
            case '秒':
            case '秒钟':
                break;
            case '分':
            case '分钟':
                duration = duration * 60
                break;
            case '时':
            case '小时':
                duration = duration * 3600
                break;
            default: return '请输入秒/秒钟/分/分钟/时/小时'
        }
        if (duration > 2591999) {
            duration = 2591999 // qq禁言最大时长为一个月
        }

        session.onebot.setGroupBan(
            session.guildId,
            qqnum,
            duration,
        )

        session.send(`${h('at', { id: qqnum })} 被禁用了~`)

    })

    // 解除禁言
    ctx.command('admin', '群管理工具').subcommand('解除禁言 <qq:user>', '如：解除禁言 @user(前需要空格)', { authority: managerAhority.超管, checkArgCount: true }).action(({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')
        session.onebot.setGroupBan(
            session.guildId,
            qqnum,
            0, // 要禁言的时间（秒）
        )
        session.send(`${h('at', { id: qqnum })} 已从小黑屋释放成功~`)
    })

    // 设置群组名片
    ctx.command('admin', '群管理工具').subcommand('设置名片 <qq:user> <card>', '如：设置名片 @user 新人', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq, card) => {
        const [platform, qqnum] = qq.split(':')
        session.onebot.setGroupCard(
            session.guildId,
            qqnum,
            card,
        )
        session.send(`${h('at', { id: qqnum })} 设置了名片为 ${card}`)
    })

    // 踢出
    ctx.command('admin', '群管理工具').subcommand('踢出 <qq:user>', '如：踢出 @user(前需要空格)', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq) => {
        const [platform, qqnum] = qq.split(':')
        session.onebot.setGroupKick(
            session.guildId,
            qqnum,
            false,
        )

        // return `${nickname} 被踢出群了~`;
        session.send(`${h('at', { id: qqnum })} 被踢出群了~`)
    })

    // 设置精华消息
    ctx.command('admin', '群管理工具').subcommand('设为精华', '回复一条消息 设为精华', { captureQuote: true, authority: managerAhority.超管 }).action(async ({ session }) => {

        // console.log(session);

        if (session.quote) {
            session.onebot.setEssenceMsg(
                session.quote.id,
            )
            session.send('设置成功~')
        } else {
            session.send('请回复一条消息~')
        }
    })

    // 撤回
    ctx.command('admin', '群管理工具').subcommand('撤回', '回复一条消息 撤回', { authority: managerAhority.超管 })
        .action(async ({ session }) => {
            if (session.quote) {
                await session.onebot.deleteMsg(
                    session.quote.id,
                )
                await sleep(randomInt(500, 1000))
                await session.onebot.deleteMsg(
                    session.messageId,
                )
                session.send('已经撤回啦~')
            } else {
                session.send('请回复一条消息~')
            }

        })


    // 扣积分
    ctx.command('admin', '群管理工具').subcommand('扣积分 <qq:user> <integral:number>', '如：扣积分 @user 5', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq, integral) => {
        const [platform, qqnum] = qq.split(':')
        // let data = await ctx.database.get('cpol_player_list', qqnum)
        let data = await CPolDb.get(ctx, session.guildId, { QQ: qqnum })
        if (data.length == 0) return `未找到用户`
        let nowIntegral = data[0].integral - integral
        // await ctx.database.set('cpol_player_list', qqnum, { integral: nowIntegral })
        CPolDb.set(ctx, session.guildId, { QQ: qqnum }, { integral: nowIntegral })

        session.send(`${h('at', { id: qqnum })} 被扣除了 ${integral} 积分，现有积分 ${nowIntegral}`)
    })

    // 加积分
    ctx.command('admin', '群管理工具').subcommand('加积分 <qq:user> <integral:number>', '如：加积分 @user 5', { authority: managerAhority.超管, checkArgCount: true }).action(async ({ session }, qq, integral) => {
        const [platform, qqnum] = qq.split(':')
        // let data = await ctx.database.get('cpol_player_list', qqnum)
        let data = await CPolDb.get(ctx, session.guildId, { QQ: qqnum })
        if (data.length == 0) return `未找到用户`
        let nowIntegral = data[0].integral + integral
        // await ctx.database.set('cpol_player_list', qqnum, { integral: nowIntegral })
        CPolDb.set(ctx, session.guildId, { QQ: qqnum }, { integral: nowIntegral })

        session.send(`${h('at', { id: qqnum })} 被奖励了 ${integral} 积分，现有积分 ${nowIntegral}`)
    })

    // 获取玩家列表
    ctx.command('admin', '群管理工具').subcommand('玩家列表', '获取玩家列表', { authority: managerAhority.超管 }).action(async ({ session }) => {
        // let playerList = await ctx.database.get('cpol_player_list', {})
        let playerList = await CPolDb.get(ctx, session.guildId, {})
        if (playerList.length == 0) return '暂无玩家'

        let str = ''
        playerList.forEach((item) => {
            str += `名称:${item.Name} | 积分: ${item.integral}\n`
        })
        session.send(str)
    })

    //#endregion

}