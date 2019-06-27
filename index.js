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
    if(bans == null){
      return
    }
    var tbans = Object.entries(bans)
    for(var [dude, info] of tbans){
      let time = info.time
      let userid = dude
      let guildid = info.guild
      let guild =  bot.guilds.get(guildid)
      let user = info.user

      if(Date.now() > time){
        db.delete(`tempbans.${userid}`)
        try {
          guild.unban(dude)
        } catch(e) {
          guild.systemChannel.send(`I tried to unban ${user.user.username} but I either do not have permission or he/she is unbanned.`)
          continue;
        }
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('Unbanned user ' + user.user.username + ' because their tempban duration was over.')
          .addField('User ID', user.user.id)
          .addField('Duration', info.realtime)
        let channel = guild.channels.find("name", "unban-logs")
        try {
          channel.send(logEmbed)
        } catch(e) {
          guild.systemChannel.send(`I tried to send the unban log but there is either no channel or I have no permission to view it, so I will send the log here.`)
          guild.systemChannel.send(logEmbed)
        }
      }
    }
  }, 5000)
})

bot.on("message", async message => {
  prefix = db.fetch(`guildInfo_${message.member.guild.id}.prefix`)

  if (!prefix) {
    db.set(`guildInfo_${message.member.guild.id}.prefix`, '-')
    prefix = db.fetch(`guildInfo_${message.guild.id}.prefix`)
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
  if (cmd === 'commands' || cmd === 'cmd') {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      let commandEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Bot Commands')
        .setDescription('**settings:** Sets specific settings for the bot (BOT PERMISSIONS)\n\n**ping:** Checks latency and api latency\n\n**tban:** Temporarily bans a person for the set amount of time (BOT PERMISSIONS ONLY)')
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
      console.log(args)
      console.log(message.mentions.users.size)
      var newargs = await args.shift()
      if (args.length == 0) {
        return message.channel.send("Please specify the time for ban.")
      }
      console.log(args)
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
          realtime: pMs(totalMs)
        }
        db.set(`tempbans.${tbanmemb.user.id}`, tbanobj)
        message.channel.send(`Successfully tempbanned ${tbanmemb.displayName} for ${pMs(totalMs)}`)
        let logEmbed = new Discord.RichEmbed()
          .setColor(embedColor)
          .setDescription('User ' + tbanmemb.displayName + ' has been temp banned by ' + message.member.displayName + '.')
          .addField('User Banned', tbanmemb.displayName)
          .addField('User who Banned', message.member.displayName)
          .addField('Duration', pMs(totalMs))
        let channel = await message.member.guild.channels.find("name", "ban-logs")
        try {
          channel.send(logEmbed)
        } catch (e) {
          message.channel.send('An error occurred, probably because the channel ban-logs does not exist. I will post the log here instead.')
          return message.channel.send(logEmbed)
        }
      })
    }
  }
})

// for (const arg of args) {
//   let types = ['d', 'h', 'm', 's', 'ms']
//   let argarr = []
//   let newarg = arg.trim().replace(/ /g, '')
//   for (i = 0; i < arg.length; i++) {
//     argarr.push(newarg.charAt(i))
//   }
//   console.log(argarr)
//   let last = argarr.pop()
//   console.log(last)
//   let match = false
//   for (const type of types) {
//     if (last.toLowerCase() == type.toLowerCase()) {
//       match = true
//     }
//   }
//   if (match = false) {
//     return message.channel.send("One or more arguments are malformed")
//   }
// }
// }

bot.login(process.env.token)
