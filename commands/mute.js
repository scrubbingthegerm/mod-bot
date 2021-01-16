const muteModel = require('../models/mute')
const ms = require('ms')

module.exports = {
    name: 'mute',
    description: 'Mute a member from the server',
    usage: '<member> <time> [reason]',
    async execute(message, args) {
        const mentionedMember = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])
        
        const msRegex = RegExp(/(\d+(s|m|h|w))/)
        let muteRole = message.guild.roles.cache.find(r => r.name == 'Muted')

        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You don\'t have permissions to mute members.')
        }
        else if (!message.guild.me.hasPermission(['MANAGE_ROLES', 'MANAGE_CHANNELS'])) {
            return message.channel.send('I don\'t have permission to MANAGE_ROLES and MANAGE_CHANNELS.')
        }
        else if (!mentionedMember) {
            return message.channel.send('You need to mention a member you want to mute.')
        }
        else if (!msRegex.test(args[1])) {
            return message.channel.send('That is not a valid amount of time to mute a member')
        }

        if (!muteRole) {
            muteRole = await message.guild.roles.create({
                data: {
                    name: 'Muted',
                    color: 'RED'
                }
            }).catch(err => console.log(err))
        }

        if (mentionedMember.roles.highest.position >= message.guild.me.roles.highest.position) {
            return message.channel.send('I can\'t mute this member as their roles are higher than or equal to mine.')
        }
        else if (muteRole.position >= message.guild.me.roles.highest.position) {
            return message.channel.send('I can\'t mute this member because the `Muted` role is higher than mine.')
        }
        else if (ms(msRegex.exec(args[1])[1]) > 2592000000) {
            return message.channel.send('You can\'t mute a member for over a month.')
        }
        const isMuted = await muteModel.findOne({
            guildID: message.guild.id,
            memberID: mentionedMember.id
        })

        if (isMuted) {
            return message.channel.send('This member is already muted.')
        }

        for (const channel of message.guild.channels.cache) {
            channel[1].updateOverwrite(muteRole, {
                SEND_MESSGES: false,
                CONNECT: false,
            }).catch(err => console.log(err))
        }

        const noEveryone = mentionedMember.roles.cache.filter(r => r.name !== '@everyone')

        await mentionedMember.roles.add(muteRole.id).catch(err => console.log)

        for (const role of noEveryone) {
            await mentionedMember.roles.remove(role[0]).catch(err => console.log(err))
        }

        const muteDoc = new muteModel({
            guildID: message.guild.id,
            memberID: mentionedMember.id,
            length: Date.now() + ms(msRegex.exec(args[1])[1]),
            memberRoles: noEveryone.map(r => r),
        })

        await muteDoc.save().catch(err => console.log(err))

        const reason = args.slice(2).join(' ')

        message.channel.send(`Muted ${mentionedMember} for **${msRegex.exec(args[1])[1]}** ${reason ? `for **${reason}**` : ''}`)
    }
}