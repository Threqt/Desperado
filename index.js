const config = require('./botconfig')
const Discord = require('discord.js')
const ms = require('parse-ms')
const moment = require('moment')
const rbx = require('noblox.js')
const db = require('quick.db')
const bot = new Discord.Client({
  disableEverybody: true
});
const embedColor = config.embedColor
const toMs = require('@sindresorhus/to-milliseconds')
let prefix;
const pMs = require('pretty-ms')
const Enmap = require('enmap')
const Long = require('long')

bot.settings = new Enmap({
  name: "settings",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: 'deep'
});

async function suggestion(bot, message) {
  message.channel.send("Check DMs.")
  let dmChannel = await message.author.createDM()
  dmChannel.send("Please type your suggestion here, you have 20 minutes. Use cancel to cancel.")
  const filter = m => m.author.id === message.author.id;
  let collected = await dmChannel.awaitMessages(filter, {
    max: 1,
    time: 1200000,
    errors: ['time']
  }).catch(err => {
    if (err.reason = 'time') {
      return dmChannel.send("Timed out.")
    }
  })
  let message1 = collected.first().content
  if (message1.toLowerCase() == 'cancel') {
    return dmChannel.send("Cancelled")
  }
  dmChannel.send("Your suggestion has been recorded")
  let embed = new Discord.RichEmbed()
    .setColor("GREEN")
    .setTitle(`Suggestion by ${message.author.username}#${message.author.discriminator}`)
    .setDescription(message1)
  let found = await message.guild.channels.find(function(element) {
    return element.name === 'suggestions-voting-channel'
  })
  if (found == 'undefined') {
    message.channel.send("Cannot send the suggestion as the guild lacks a suggestion voting channel.")
    throw `The guild ${message.guild.name} does not have a suggestions voting channel.`;
  }
  found.send(embed).then(async msg => {
    await msg.react('👍')
    await msg.react('👎')

    let agree = '👍'
    let disagree = '👎'

    const filter = reaction => reaction.emoji.name === agree || reaction.emoji.name === disagree
    let collector = msg.createReactionCollector(filter, {
      time: 86400000
    })
    collector.on('collect', async reaction => {
      let found3 = msg.reactions.find(function(element) {
        return element.emoji.name == agree
      })
      if (found3 == null) {
        throw 'Something went wrong or there are 0 reactions for agree!'
      }
      let found9 = msg.reactions.find(function(element) {
        return element.emoji.name == disagree
      })
      if (found9 == null) {
        throw 'Something went wrong or there are 0 reactions for agree!'
      }
      let emojicount = found3.count
      let emojicount2 = found9.count
      let successEmbed = new Discord.RichEmbed()
        .setColor("GREEN")
        .setDescription(`${message.author.username}#${message.author.discriminator}'s suggestion has automatically passed due to 5 reactions!`)
      let antiSuccessEmbed = new Discord.RichEmbed()
        .setColor("RED")
        .setDescription(`${message.author.username}#${message.author.discriminator}'s suggestion has automatically been rejected due to 5 reactions!`)
      if (emojicount == 5) {
        msg.channel.send(successEmbed)
        return suggestion2(bot, message, embed, message1)
      }
      if (emojicount2 == 5) {
        return msg.channel.send(antiSuccessEmbed)
      }
    })
    collector.on('end', async collected => {
      let found1 = msg.reactions.find(function(element) {
        return element.emoji.name == agree
      })
      let found2 = msg.reactions.find(function(element) {
        return element.emoji.name == disagree
      })
      if (found1.count > found2.count) {
        let successEmbed2 = new Discord.RichEmbed()
          .setColor("GREEN")
          .setDescription(`${message.author.username}#${message.author.discriminator}'s suggestion has passed because it got ${found1.count} upvotes and ${found2.count} downvotes!`)
        msg.channel.send(successEmbed1)
        return suggestion2(bot, message, embed, message1)
      } else
      if (found1.count <= found2.count) {
        let rejectEmbed = new Discord.RichEmbed()
          .setColor("RED")
          .setDescription((`Suggestion by ${message.author.username}#${message.author.discriminator} has been rejected due to lack of positive reactions.`))
        return msg.channel.send(rejectEmbed)
      }
    })
  })
}

async function suggestion2(bot, message, embed, suggestion) {
  let found4 = await message.guild.channels.find(function(element) {
    return element.name === 'suggestions-voting-public'
  })
  if (found4 == 'undefined') {
    message.channel.send("Cannot send the suggestion as the guild lacks a suggestion public voting channel.")
    throw `The guild ${message.guild.name} does not have a suggestions public voting channel.`;
  }
  await found4.send(embed).then(async msg => {
    await msg.react('👍')
    await msg.react('👎')

    let agree = '👍'
    let disagree = '👎'

    const filter = reaction => reaction.emoji.name === agree || reaction.emoji.name === disagree
    let collected = await msg.awaitReactions(filter, {
      time: 86400000
    })
    let found5 = msg.reactions.find(function(element) {
      return element.emoji.name == agree
    })
    let found6 = msg.reactions.find(function(element) {
      return element.emoji.name == disagree
    })
    let collectedEmbed = new Discord.RichEmbed()
      .setColor("GREEN")
      .setTitle(`RESULTS FOR THE SUGGESTION BY ${message.author.username}#${message.author.discriminator}`)
      .setDescription(`Suggestion: ${suggestion}`)
      .addField('👍', found5.count - 1)
      .addField('👎', found6.count - 1)
    let found7 = await message.guild.channels.find(function(element) {
      return element.name === 'approved-poll-votes'
    })
    if (found7 == 'undefined') {
      message.channel.send("Cannot send the suggestion as the guild lacks a suggestion public voting results channel.")
      throw `The guild ${message.guild.name} does not have a suggestions public voting results channel.`;
    }
    found7.send(collectedEmbed)
  })
}

const getDefaultChannel = (guild) => {

  if (guild.channels.has(guild.id))
    return guild.channels.get(guild.id)

  const generalChannel = guild.channels.find(channel => channel.name === "general");
  if (generalChannel)
    return generalChannel;

  return guild.channels
    .filter(c => c.type === "text" &&
      c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
    .sort((a, b) => a.position - b.position ||
      Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
    .first();
}

bot.on("ready", async () => {
  console.log(`${bot.user.username} has successfully been started.`)
  if (!db.get('activityInfo.activity')) {
    db.set('activityInfo.activity', 'the waiting game')
  }
  if (!db.get('activityInfo.activityType')) {
    db.set('activityInfo.activityType', 'PLAYING')
  }
  console.log(db.get('activityInfo.activityType'))
  console.log(db.get('activityInfo.activity'))
  bot.user.setActivity(db.get('activityInfo.activity'), {
    type: db.get('activityInfo.activityType')
  })
  bot.setInterval(() => {
    let bans = db.fetch('tempbans')
    if (bans == null) {
      return
    }
    var tbans = Object.entries(bans)
    for (var [dude, info] of tbans) {
      let time = info.time
      let userid = dude
      let guildid = info.guild
      let guild = bot.guilds.get(guildid)
      let user = info.user
      let channel = getDefaultChannel(guild)
      if (Date.now() > time) {
        db.delete(`tempbans.${userid}`)
        try {
          guild.unban(dude)
        } catch (e) {
          channel.send(`I tried to unban ${user.user.username} but I either do not have permission or he/she is unbanned.`)
          continue;
        }
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('Unbanned user ' + user.user.username + ' because their tempban duration was over.')
          .addField('User ID', user.user.id)
          .addField('Duration', info.realtime)
        let channela = guild.channels.find("name", "unban-logs")
        try {
          channela.send(logEmbed)
        } catch (e) {
          channel.send(`I tried to send the unban log but there is either no channel or I have no permission to view it, so I will send the log here.`)
          channel.send(logEmbed)
        }
      }
    }
  }, 5000)
  bot.setInterval(() => {
    let mutes = db.fetch('mutes')
    if (mutes == null) {
      return
    }
    var tmutes = Object.entries(mutes)
    for (var [dude, info] of tmutes) {
      let time = info.time
      let userid = dude
      let guildid = info.guild
      let guild = bot.guilds.get(guildid)
      let user = guild.members.get(info.user.id)
      let channel = getDefaultChannel(guild)
      let muterole = info.role
      let guildmember = guild.member(user)

      if (Date.now() > time) {
        db.delete(`mutes.${userid}`)
        guildmember.removeRole(muterole)
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('Unmuted user ' + user.user.username + ' because their mute duration was over.')
          .addField('User ID', user.user.id)
          .addField('Duration', info.realtime)
        let channela = guild.channels.find("name", "mute-logs")
        try {
          channela.send(logEmbed)
        } catch (e) {
          channel.send(`I tried to send the unmute log but there is either no channel or I have no permission to view it, so I will send the log here.`)
          channel.send(logEmbed)
        }
      }
    }
    // } catch (e) {
    //   channel.send(`Could not unmute ${user.user.username} due to an error.`)
    //   continue;
    // }
  }, 5000)
})

bot.on("message", async message => {
  prefix = db.fetch(`guildInfo_${message.member.guild.id}.prefix`)

  if (!prefix) {
    db.set(`guildInfo_${message.guild.id}.prefix`, '-')
    prefix = db.fetch(`guildInfo_${message.member.guild.id}.prefix`)
  }

  if (message.isMemberMentioned(bot.user)) {
    return message.channel.send(`Prefix is ${db.fetch(`guildInfo_${message.member.guild.id}.prefix`)}`)
  }

  let botrole = message.guild.roles.find("name", "Bot Permissions")
  if (!botrole) {
    let role1 = await message.guild.createRole({
      name: 'Bot Permissions'
    })
    return message.channel.send("Your server lacks a Bot Permissions role, so I created one for you.")
  }

  let timeout = 5000

  let daily = db.fetch(`timeout_${message.author.id}`)

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (message.content.indexOf(prefix) !== 0) return;

  if (cmd === `ping`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      let msg = await message.channel.send("Testing...")
      let pingEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setDescription(`⏱: ${Math.round(msg.createdAt - message.createdAt)}\n⏳: ${Math.round(bot.ping)}`)
      message.channel.send(pingEmbed)
      msg.delete()
    }
  } else
  if (cmd === 'settings') {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Settings')
        .setDescription(`Description: Sets specific settings for the bot. Settings: prefix, activity, activityType\nUsage: ${prefix}settings (settingname) (value)\nExample: ${prefix}settings prefix -`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (!args[0]) {
        return message.channel.send(helpEmbed)
      }
      if (args[0] === 'prefix') {
        if (!args[1]) {
          return message.channel.send("You didn't specify a value.")
        }
        db.set(`guildInfo_${message.member.guild.id}.prefix`, args[0])
        return message.channel.send(`The new prefix is ${db.fetch(`guildInfo_${message.member.guild.id}.prefix`)}`)
      }
      if (args[0] === 'activityType') {
        if (!args[1]) {
          return message.channel.send("You didn't specify a value.")
        }
        let types = ['LISTENING', 'PLAYING', 'WATCHING']
        let yes = false
        for (const type of types) {
          if (args[1].toUpperCase() == type) {
            yes = true
          }
        }
        if (yes === false) {
          return message.channel.send("Invalid activity type, try one of the following:\nLISTENING, PLAYING, WATCHING")
        } else
        if (yes === true) {
          let at = args[1].toUpperCase()
          db.set('activityInfo.activityType', at)
          bot.user.setActivity(db.get('activityInfo.activity'), {
            type: db.get('activityInfo.activityType')
          })
          return message.channel.send(`Set activity type to ${db.get('activityInfo.activityType')}`)
        }
      }
      if (args[0] === 'activity') {
        if (message.content.slice(18).trim().replace(/ /g, '') === '') {
          return message.channel.send("You didn't specify a value.")
        }
        let activity1 = message.content.slice(18).trim()
        db.set('activityInfo.activity', activity1)
        bot.user.setActivity(db.get('activityInfo.activity'), {
          type: db.get('activityInfo.activityType')
        })
        return message.channel.send(`Set activity to ${db.get('activityInfo.activity')}`)
      }
    }
  } else
  if (cmd === 'commands' || cmd === 'cmds') {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      let commandEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Bot Commands')
        .setDescription('**settings:** Sets specific settings for the bot (BOT PERMISSIONS)\n\n**ping:** Checks latency and api latency\n\n**tban:** Temporarily bans a person for the set amount of time (BOT PERMISSIONS ONLY)\n\n**suggest:** Creates a suggestion which can be viewed by the community after being voted on by the administration\n\n**mute:** Mutes a user for a certain period of time (BOT PERMISSIONS ONLY)\n\n**viewmutes:** Views all mutes in the server.\n\n**viewtbans** Views all tempbans in the server.\n\n**ban:** Bans the user from the guild (BOT PERMISSIONS)\n\n**kick:** Kicks a user from the guild (BOT PERMISSIONS)\n\n**purge:** Purges the specified amount of messages from the channel (BOT PERMISSIONS)')
      let dmChannel = await message.author.createDM()
      dmChannel.send(commandEmbed)
    }
  } else
  if (cmd === 'tban') {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('tempban')
        .setDescription(`Description: Bans a user for the set amount of time, then unbans.\nUsage: ${config.prefix}tempban (user) (time)\nExample: ${config.prefix}tempban Threqt 15d 16h 5m`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (message.mentions.users.size === 0) {
        return message.channel.send("Please mention a user.")
      }
      let tbanmemb = message.guild.member(message.mentions.users.first())
      if (!tbanmemb) {
        return message.channel.send("Please mention a valid user.")
      }
      if (tbanmemb.highestRole.position >= message.member.highestRole.position) {
        return message.channel.send("Person is of a higher rank than you.")
      }
      var newargs = await args.shift()
      if (args.length == 0) {
        return message.channel.send("Please specify the time for ban.")
      }
      for (const arg of args) {
        let types = ['d', 'h', 'm', 's', 'ms']
        let argarr = []
        let newarg = arg.trim().replace(/ /g, '')
        for (i = 0; i < arg.length; i++) {
          argarr.push(newarg.charAt(i))
        }
        let last = argarr.pop()
        let match = false
        for (const type of types) {
          if (last.toLowerCase() == type.toLowerCase()) {
            match = true
          }
        }
        if (match == false) {
          return message.channel.send('Malformed Argument: ' + arg)
        }
        globaltrue = []
        for (const char of argarr) {
          let valid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
          let match2 = false
          for (const val of valid) {
            if (char == val) {
              match2 = true
            }
          }
          if (match2 == false) {
            return message.channel.send('Malformed Argument: ' + arg)
          }
        }
      }
      let msarr = []
      for (const arg of args) {
        let desc = ''
        let argarr1 = []
        let newarg1 = arg.trim().replace(/ /g, '')
        for (i = 0; i < arg.length; i++) {
          argarr1.push(newarg1.charAt(i))
        }
        let indentifier = argarr1.pop()
        let numbval = parseInt(argarr1.join(''))
        let types1 = ['d', 'h', 'm', 's', 'ms']
        switch (indentifier) {
          case 'd':
            msarr.push(toMs({
              days: numbval
            }))
            break;
          case 'h':
            msarr.push(toMs({
              hours: numbval
            }))
            break;
          case 'm':
            msarr.push(toMs({
              minutes: numbval
            }))
            break;
          case 's':
            msarr.push(toMs({
              seconds: numbval
            }))
            break;
          case 'h':
            msarr.push(numbval)
            break;
        }
      }
      const arrSum = arr => arr.reduce((a, b) => a + b, 0)
      let totalMs = arrSum(msarr)
      message.channel.send("Please specify the reason you're banning this user.")
      const filter = m => message.author.id === m.author.id;
      let collected = await message.channel.awaitMessages(filter, {
        max: 1,
        time: toMs({
          minutes: 20
        }),
        errors: ['time']
      }).catch(error => {
        if (error.reason === 'time') {
          return message.channel.send('Timed out.')
        }
      })
      let reason = collected.first().content
      await tbanmemb.ban().then(async member => {
        let tbanobj = {
          user: tbanmemb,
          guild: message.member.guild.id,
          time: Date.now() + totalMs,
          realtime: pMs(totalMs),
          reason: reason
        }
        db.set(`tempbans.${tbanmemb.user.id}`, tbanobj)
        message.channel.send(`Successfully tempbanned ${tbanmemb.displayName} for ${pMs(totalMs)}`)
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('User ' + tbanmemb.displayName + ' has been temp banned by ' + message.member.displayName + '.')
          .addField('User Banned', tbanmemb.displayName, true)
          .addField('User who Banned', message.member.displayName, true)
          .addField('Duration', pMs(totalMs), true)
          .addField('Reason', reason, true)
        let channel = await message.member.guild.channels.find("name", "ban-logs")
        try {
          channel.send(logEmbed)
        } catch (e) {
          message.channel.send('An error occurred, probably because the channel ban-logs does not exist. I will post the log here instead.')
          return message.channel.send(logEmbed)
        }
      })
    }
  } else
  if (cmd === `suggest`) {
    suggestion(bot, message)
  } else
  if (cmd === `mute`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('mute')
        .setDescription(`Description: Mutes the specified user for a certain period of time\nUsage: ${prefix}mute (user) (time)\nExample: ${prefix}mute Threqt 15h`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (message.mentions.users.size === 0) {
        return message.channel.send("Please mention a user.")
      }
      let mutememb = message.guild.member(message.mentions.users.first())
      if (!mutememb) {
        return message.channel.send("Please mention a valid user.")
      }
      if (mutememb.highestRole.position >= message.member.highestRole.position) {
        return message.channel.send("Person is of a higher rank than you.")
      }
      var newargs = await args.shift()
      if (args.length == 0) {
        return message.channel.send("Please specify the time for the mute.")
      }
      for (const arg of args) {
        let types = ['d', 'h', 'm', 's', 'ms']
        let argarr = []
        let newarg = arg.trim().replace(/ /g, '')
        for (i = 0; i < arg.length; i++) {
          argarr.push(newarg.charAt(i))
        }
        let last = argarr.pop()
        let match = false
        for (const type of types) {
          if (last.toLowerCase() == type.toLowerCase()) {
            match = true
          }
        }
        if (match == false) {
          return message.channel.send('Malformed Argument: ' + arg)
        }
        globaltrue = []
        for (const char of argarr) {
          let valid = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
          let match2 = false
          for (const val of valid) {
            if (char == val) {
              match2 = true
            }
          }
          if (match2 == false) {
            return message.channel.send('Malformed Argument: ' + arg)
          }
        }
      }
      let msarr = []
      for (const arg of args) {
        let desc = ''
        let argarr1 = []
        let newarg1 = arg.trim().replace(/ /g, '')
        for (i = 0; i < arg.length; i++) {
          argarr1.push(newarg1.charAt(i))
        }
        let indentifier = argarr1.pop()
        let numbval = parseInt(argarr1.join(''))
        let types1 = ['d', 'h', 'm', 's', 'ms']
        switch (indentifier) {
          case 'd':
            msarr.push(toMs({
              days: numbval
            }))
            break;
          case 'h':
            msarr.push(toMs({
              hours: numbval
            }))
            break;
          case 'm':
            msarr.push(toMs({
              minutes: numbval
            }))
            break;
          case 's':
            msarr.push(toMs({
              seconds: numbval
            }))
            break;
          case 'h':
            msarr.push(numbval)
            break;
        }
      }
      const arrSum = arr => arr.reduce((a, b) => a + b, 0)
      let totalMs = arrSum(msarr)
      message.channel.send("Please specify the reason you're muting this user.")
      const filter = m => message.author.id === m.author.id;
      let collected = await message.channel.awaitMessages(filter, {
        max: 1,
        time: toMs({
          minutes: 20
        }),
        errors: ['time']
      }).catch(error => {
        if (error.reason === 'time') {
          return message.channel.send('Timed out.')
        }
      })
      let reason = collected.first().content
      let muteRole = message.guild.roles.find("name", "Muted")
      if (!muteRole) {
        try {
          muteRole = await message.member.guild.createRole({
            name: "Muted",
            permissions: []
          });

          let channels = message.member.guild.channels
          message.guild.channels.forEach(channel => {
            channel.overwritePermissions(role, {
              SEND_MESSAGES: false,
              ADD_REACTIONS: false
            })
          })
        } catch (e) {
          console.log(e.stack)
          message.channel.send("Failed to find muted role, I tried to create one. This role will be assigned to the muted person.")
        }
      }
      await mutememb.addRole(muteRole).then(async member => {
        let muteobj = {
          user: mutememb.user,
          guild: message.member.guild.id,
          time: Date.now() + totalMs,
          realtime: pMs(totalMs),
          role: muteRole.id,
          reason: reason
        }
        db.set(`mutes.${mutememb.user.id}`, muteobj)
        message.channel.send(`Successfully muted ${mutememb.displayName} for ${pMs(totalMs)}`)
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('User ' + mutememb.displayName + ' has been muted by ' + message.member.displayName + '.')
          .addField('User Muted', mutememb.displayName, true)
          .addField('User who Muted', message.member.displayName, true)
          .addField('Duration', pMs(totalMs), true)
          .addField('Reason', reason, true)
        let channel = await message.member.guild.channels.find("name", "mute-logs")
        try {
          channel.send(logEmbed)
        } catch (e) {
          message.channel.send('An error occurred, probably because the channel mute-logs does not exist. I will post the log here instead.')
          return message.channel.send(logEmbed)
        }
      })
    }
  } else
  if (cmd === `viewmutes`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      let mutes = db.fetch('mutes')
      if (mutes == null) {
        return message.channel.send('No mutes in the guild')
      }
      var tmutes = Object.entries(mutes)
      var relevantresults = []
      for (var [dude, info] of tmutes) {
        if (info.guild == message.guild.id) {
          relevantresults.push(info)
        }
      }
      if (relevantresults.size == 0) {
        return message.channel.send('No mutes in the guild')
      }
      let desc = ''
      for (var obj of relevantresults) {
        desc = desc + `Name: ${obj.user.username} | Duration: ${obj.realtime} Time Left: ${pMs(Math.round(obj.time - Date.now()))} Reason: ${obj.reason}\n\n`
      }
      let mutesEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Mutes in the guild ' + message.guild.name + ':')
        .setDescription(desc)
      message.channel.send(mutesEmbed)
    }
  } else
  if (cmd === `viewtbans`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      let mutes = db.fetch('tempbans')
      if (mutes == null) {
        return message.channel.send('No tempbans in the guild')
      }
      var tmutes = Object.entries(mutes)
      var relevantresults = []
      for (var [dude, info] of tmutes) {
        if (info.guild == message.guild.id) {
          relevantresults.push(info)
        }
      }
      if (relevantresults.size == 0) {
        return message.channel.send('No tempbans in the guild')
      }
      let desc = ''
      for (var obj of relevantresults) {
        desc = desc + `Name: ${obj.user.username} | Duration: ${obj.realtime} Time Left: ${pMs(Math.round(obj.time - Date.now()))} Reason: ${obj.reason}\n\n`
      }
      let mutesEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Tempbans in the guild ' + message.guild.name + ':')
        .setDescription(desc)
      message.channel.send(mutesEmbed)
    }
  } else
  if (cmd === `ban`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('ban')
        .setDescription(`Description: Bans a user from the guild\n\nUsage: ${prefix}ban (player) (reason)\n\nExample: ${prefix}ban Threqt For the test`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (message.mentions.users.size === 0) {
        return message.channel.send("Please mention a user.")
      }
      let tbanmemb = message.guild.member(message.mentions.users.first())
      if (!tbanmemb) {
        return message.channel.send("Please mention a valid user.")
      }
      if (tbanmemb.highestRole.position >= message.member.highestRole.position) {
        return message.channel.send("Person is of a higher rank than you.")
      }
      var newargs = await args.shift()
      let reason = newargs.join(' ')
      try {
        tbanmemb.ban().then(async member => {
          let channel = message.guild.channels.find('name', 'ban-logs')
          let banEmbed = new Discord.RichEmbed()
            .setColor(embedColor)
            .setDescription(`${tbanmemb.user.username} has been banned by ${message.author.username}`)
            .addField('Banned Person', tbanmemb.user.username)
            .addField('Person who Banned', message.author.username)
            .addField('Reason', reason)
          try {
            channel.send(banEmbed)
          } catch (e) {
            console.log(e.stack)
            message.channel.send('Could not send the ban embed in the ban logs probably because the channel does not exist, sending the log here...')
            message.channel.send(banEmbed)
          }
        })
      } catch (e) {
        return message.channel.send(`Could not ban ${tbanmemb.user.username} because something failed.\n${e.stack}`)
      }
    }
  } else
  if (cmd === `kick`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('kick')
        .setDescription(`Description: Kicks a user from the guild\n\nUsage: ${prefix}kick (player) (reason)\n\nExample: ${prefix}kick Threqt For the test`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (message.mentions.users.size === 0) {
        return message.channel.send("Please mention a user.")
      }
      let tbanmemb = message.guild.member(message.mentions.users.first())
      if (!tbanmemb) {
        return message.channel.send("Please mention a valid user.")
      }
      if (tbanmemb.highestRole.position >= message.member.highestRole.position) {
        return message.channel.send("Person is of a higher rank than you.")
      }
      var newargs = await args.shift()
      let reason = newargs.join(' ')
      try {
        tbanmemb.kick().then(async member => {
          let channel = message.guild.channels.find('name', 'kick-logs')
          let banEmbed = new Discord.RichEmbed()
            .setColor(embedColor)
            .setDescription(`${tbanmemb.user.username} has been kicked by ${message.author.username}`)
            .addField('Kicked Person', tbanmemb.user.username)
            .addField('Person who Kicked', message.author.username)
            .addField('Reason', reason)
          try {
            channel.send(banEmbed)
          } catch (e) {
            console.log(e.stack)
            message.channel.send('Could not send the kick embed in the ban logs probably because the channel does not exist, sending the log here...')
            message.channel.send(banEmbed)
          }
        })
      } catch (e) {
        return message.channel.send(`Could not kick ${tbanmemb.user.username} because something failed.\n${e.stack}`)
      }
    }
  } else
  if (cmd === `purge`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('purge')
        .setDescription(`Description: Purges a certain amount of messages from the channel\nUsage: ${prefix}purge (amount of messages)\nExample: ${prefix}purge 100`)
      if (message.content.trim().slice(cmd.length + 1).replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (!args[0]) {
        return message.channel.send("Please specify an amount of messages to purge.")
      }
      async function purgeMsg() {
        message.delete()

        if (isNaN(args[0])){
          return message.channel.send(`Malformed Argument: ${args[0]}`)
        }

        const fetched = message.channel.fetchMessages({limit: args[0]})
        message.channel.bulkDelete(fetched)
          .catch(error => message.channel.send(`Error: ${error}`))
      }

      purgeMsg()
    }
  }
})

bot.login(process.env.token)
