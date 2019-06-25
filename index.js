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
let prefix = db.fetch('prefixthing')
let a2 = db.fetch('activitything')
let at2 = db.fetch('typeactivity')

bot.on("ready", async () => {
  console.log(`${bot.user.username} has successfully been started.`)
  console.log(db.fetch('activitything'))
  console.log(db.fetch('typeactivity'))
  bot.user.setActivity(a2, {
    type: at2
  })
})

bot.on("message", async message => {

  if (message.isMemberMentioned(bot.user)) {
    return message.channel.send(`Prefix is ${db.fetch('prefixthing')}`)
  }

  let botrole = message.guild.roles.find("name", "Bot Permissions")
  if (!role) {
    let role1 = message.guild.createRole({
      name: 'Bot Permissions'
    })
    botrole = role1
    message.guild.owner.addRole(role1)
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
      let msg = await message.channel.send("Testing...")
      let pingEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setDescription(`⏱: ${Math.round(msg.createdAt - message.createdAt)}\n⏳: ${Math.round(bot.ping)}`)
      message.channel.send(pingEmbed)
      msg.delete()
      db.set(`timeout_${message.author.id}`, Date.now())
    }
  } else
  if (cmd === 'settings') {
    if (daily !== null && timeout - (Date.now() - daily) > 0) {
      let time = ms(timeout - (Date.now() - daily))

      return message.channel.send(`You're on cooldown. Wait ${time.seconds}s and try again.`)
    } else {
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
        db.set('prefixthing', args[0])
        return message.channel.send(`The new prefix is ${db.fetch('prefixthing')}`)
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
          db.set('typeactivity', args[1].toUpperCase())
          bot.user.setActivity(db.fetch('activitything'), {
            type: db.fetch('typeactivity')
          })
          return message.channel.send(`Set activity type to ${db.fetch('typeactivity')}`)
        }
      }
      if (args[0] === 'activity') {
        if (message.content.slice(18).trim().replace(/ /g, '') === '') {
          return message.channel.send("You didn't specify a value.")
        }
        let activity1 = message.content.slice(18).trim()
        db.set('activitything', activity1)
        bot.user.setActivity(db.fetch('activitything'), {
          type: db.fetch('typeactivity')
        })
        return message.channel.send(`Set activity to ${db.fetch('activitything')}`)
      }
    }
  }
})

bot.login(process.env.token)
