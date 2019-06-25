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
  if(!db.get('activityInfo.activity')){
    db.set('activityInfo.activity', 'the waiting game')
  }
  if(!db.get('activityInfo.activityType')){
    db.set('activityInfo.activityType', 'PLAYING')
  }
  console.log(db.get('activityInfo.activityType'))
  console.log(db.get('activityInfo.activity'))
  bot.user.setActivity(db.get('activityInfo.activity'), {
    type: db.get('activityInfo.activityType')
  })
})

bot.on("message", async message => {
  prefix = db.fetch(`guildInfo_${message.guild.id}.prefix`)

  if(!prefix){
    db.set(`guildInfo_${message.guild.id}.prefix`, '-')
    prefix = db.fetch(`guildInfo_${message.guild.id}.prefix`)
  }

  if (message.isMemberMentioned(bot.user)) {
    return message.channel.send(`Prefix is ${db.fetch(`guildInfo_${message.guild.id}.prefix`)}`)
  }

  let botrole = message.guild.roles.find("name", "Bot Permissions")
  if (!botrole) {
    let role1 = message.guild.createRole({
      name: 'Bot Permissions'
    })
    botrole = role1
    message.guild.owner.addRole(message.guild.roles.find("name", "Bot Permissions").id)
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
        db.set(`guildInfo_${message.guild.id}.prefix`, args[0])
        return message.channel.send(`The new prefix is ${db.fetch(`guildInfo_${message.guild.id}.prefix`)}`)
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
  }
})

bot.login(process.env.token)
