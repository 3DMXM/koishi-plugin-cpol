import { Session, Context, h } from "koishi";
import { ICPoL } from "./Interfaces";
import { GroupMemberInfo } from "@satorijs/adapter-onebot/lib/types";

export class CPolModel {
    /**
     * 获取用户头像
     * @param session 上下文
     * @returns 
     */
    static GetQQAvatarUrl(qq: number) {
        return `http://q.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=640`
    }

    static async GetUserInfo(user: ICPoL, session: Session<never, never, Context>) {
        let avatarUrl = this.GetQQAvatarUrl(user.QQ)

        const me = await session.onebot.getGroupMemberInfo(session.guildId, session.userId, true)

        let Spouse: GroupMemberInfo

        if (user.Married) {
            Spouse = await session.onebot.getGroupMemberInfo(session.guildId, user.Spouse.toString(), false)
        }
        return `${h('at', { id: user.QQ })}
${h('img', { src: avatarUrl })}
群昵称:  ${me.card}
作品名: ${user.Game}
角色名: ${user.Name}
性别: ${user.gender == 1 ? '男' : '女'}
婚姻状态: ${user.Married ? '已婚' : '未婚'}
${user.Married ? '配偶: ' + (Spouse.card ? Spouse.card : Spouse.nickname) : ''}`
    }


    // 设置权限
    static async SetAuthority(ctx: Context, qqnum: string, authority: number) {
        let { aid } = (await ctx.database.get('binding', { pid: qqnum }))[0]
        ctx.database.set('user', aid, { authority: authority })
    }
}