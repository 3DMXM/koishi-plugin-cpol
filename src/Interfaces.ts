
export interface IConfig {
    BotBaesAdministrator: string[]
    setGroupAdmin: number
    SigninMaxIntegral: number
    SigninMinIntegral: number
    FackIntegral: number
    EnableGroup: string[]
}


// 数据库
export interface ICPoL {
    id: number          // id
    guildId: number     // 群号
    QQ: number          // QQ
    integral: number    // 积分
    Game: string       // 所属游戏
    Name: string       // 名称
    gender: number      // 性别 男1 女2
    Married: boolean    // 是否结婚
    MarriedTime?: Date  // 结婚时间
    Spouse?: number      // 配偶
    authority: number   // 权限
    SigninTime: Date  // 签到时间
}
