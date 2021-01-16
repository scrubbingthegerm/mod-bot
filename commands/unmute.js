const muteModel = require('../models/mute')

module.exports = {
    name: 'unmute',
    description: 'Unmuted a member from the server!',
    usage: '<member> [reason]',
    async execute(message, args) {
        const mentionedMember = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])

        const muteRole = message.guild.roles.cache.find(r => r.name == 'Muted')

        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You don\'t have permissions to unmute members.')
        }
        else if (!mentionedMember) {
            return message.channel.send('You need to mention a member you want to mute.')
        }
        else if (!muteRole) {
            return message.channel.send('This server doesn\'t have a muted role, once you mute a member one will be created.')
        }

        const muteDoc = await muteModel.findOne({
            guildID: message.guild.id,
            memberID: mentionedMember.id,
        })

        if (!muteDoc) {
            return message.channel.send('This member is not muted.')
        }
        else if (mentionedMember.roles.highest.position >= message.guild.me.roles.highest.position) {
            return message.channel.send('I can\'t unmute this member because their roles are higher than or equal to mine.')
        }
        else if (muteRole.position >= message.guild.me.roles.highest.position) {
            return message.channel.send('I can\'t unmute members because the Muted role is higher than or equal to mine.')
        }

        mentionedMember.roles.remove(muteRole.id).catch(err => console.log(err))

        for (const role of muteDoc.memberRoles) {
            mentionedMember.roles.add(role).catch(err => console.log(err))
        }

        await muteDoc.deleteOne()

        const reason = args.slice(1).join(' ')

        message.channel.send(`Unmuted ${mentionedMember} ${reason ? `for **${reason}**` : ''}`)
    }
}