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
      if (message.content.replace(/ /g, '') === '') {
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
        .setDescription('**settings:** Sets specific settings for the bot (BOT PERMISSIONS)\n\n**ping:** Checks latency and api latency\n\n')
      let dmChannel = await message.author.createDM()
      dmChannel.send(commandEmbed)
    }
  } else
  if (cmd === `tban`) {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, Date.now())
      if (!message.member.roles.has(botrole.id)) return message.channel.send("Insufficient Permissions")
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('tempban')
        .setDescription(`Description: Bans a user for the set amount of time, then unbans.\nUsage: ${prefix}tempban (user) (time)\nExample: ${prefix}tempban Threqt 15d 16h 5m`)
      if (message.content.replace(/ /g, '') === '') {
        return message.channel.send(helpEmbed)
      }
      if (!args) {
        return message.channel.send(helpEmbed)
      }
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
