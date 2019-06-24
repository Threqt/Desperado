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
let prefix = '-'

bot.on("ready", async () => {
  console.log(`${bot.user.username} has successfully been started.`)
  bot.user.setActivity("the waiting game", {
    type: "PLAYING"
  })
})

bot.on("message", async message => {

  if(message.isMemberMentioned(bot.user)){
    message.channel.send(`Prefix is ${prefix}`)
  }

  let timeout = 5000

  let daily = db.fetch(`timeout_${message.author.id}`)

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (message.content.indexOf(prefix) !== 0) return;

  if(cmd === `ping`){
    if(daily !== null && timeout - (Date.now() - daily) > 0){
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
  if(cmd === 'settings'){
    if(message.content.replace(/ /g, '') === ''){
      let helpEmbed = new Discord.RichEmbed()
        .setColor(embedColor)
        .setTitle('Settings')
        .setDescription(`Description: Sets specific settings for the bot\nUsage: ${prefix}settings (settingname) (value)\nExample: ${prefix}settings prefix -`)
      return message.channel.send(helpEmbed)
    }
  }
})
bot.login(process.env.token)
