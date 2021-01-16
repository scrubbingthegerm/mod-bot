const userReg = RegExp(/<@!?(\d+)>/)

module.exports = {
    name: 'unban',
    description: 'Unban a member from the server!',
    usage: '<member> [reason]',
    async execute(message, args) {
        const userID = userReg.test(args[0]) ?userReg.exec(args[0])[1] : args[0]
        const mentionedUser = await message.client.users.fetch(userID).catch(() => null)

        if (!message.member.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('You don\'t have permission to unban members.')
        }
        else if (!message.guild.me.hasPermission('BAN_MEMBERS')) {
            return message.channel.send('I don\'t have permissions to unban members.')
        }
        else if (!mentionedUser) {
            return message.channel.send('You need to mention a user to unban.')
        }

        const allBans = await message.guild.fetchBans()
        const bannedUser = allBans.get(mentionedUser.id)

        if (!bannedUser) {
            return message.channel.send('This member is not banned.')
        }

        const reason = args.slice(1).join(' ')

        message.guild.members.unban(mentionedUser.id, [reason]).catch(err => console.log(err))

        message.channel.send(`Unbanned ${mentionedUser} ${reason ? `for **${reason}**` : ''}`)
    }
}