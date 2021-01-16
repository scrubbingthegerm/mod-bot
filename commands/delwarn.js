const warnModel = require('../models/warn')

module.exports = {
    name: 'delwarn',
    description: 'Deletes a warnings!',
    usage: '<member> <warning id> [reason]',
    async execute(message, args) {
        const mentionedMember = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])

        if (!message.member.hasPermission('MANAGE_ROLES')) {
            return message.channel.send('You don\'t have permission to delete a warning.')
        }
        else if (!mentionedMember) {
            return message.channel.send('You need to mention a member you want to use this command on.')
        }

        const mentionedPosition = mentionedMember.roles.highest.mentionedPosition
        const memberPosition = message.member.roles.highest.memberPosition

        if (memberPosition <= mentionedPosition) {
            return message.channel.send('You can\'t warn this member as their role is higher than or equal to yours.')
        }

        const reason = args.slice(2).join(' ')

        const warnDoc = await warnModel.findOne({
            guildID: message.guild.id,
            memberID: mentionedMember.id,
        }).catch(err => console.log(err))

        if (!warnDoc || !warnDoc.warnings.length) {
            return message.channel.send('This member doesn\'t have any warnings.')
        }

        const warningID = parseInt(args[1])

        if (warningID <= 0 || warningID > warnDoc.warnings.length) {
            return message.channel.send('This is an invalid warning ID.')
        }

        warnDoc.warnings.splice(warningID - 1, warningID !== 1 ? warningID - 1 : 1)

        await warnDoc.save().catch(err => console.log(err))

        message.channel.send(`Deleted warn for ${mentionedMember} ${reason ? `for **${reason}**` : ''}`)
    }
}