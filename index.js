const config = require('./botconfig.json')
const Discord = require('discord.js')
const ms = require('parse-ms')
const moment = require('moment')
const rbx = require('noblox.js')
const db = require('quick.db')
const bot = new Discord.Client({
  disableEverybody: true
});
const embedColor = config.embedColor

bot.on("ready", async () => {
  console.log(`${bot.user.username} has successfully been started.`)
  bot.user.setActivity("the waiting game", {
    type: "PLAYING"
  })
})

bot.on("message", async message => {

  let timeout = 5000

  let time = db.fetch(`timeout_${message.author.id}`)

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (message.content.indexOf(config.prefix) !== 0) return;

  if(cmd === `ping`){
    if(timeout !== null && timeout - (Date.now() - time) > 0){
      let time1 = ms(timeout - Date.now() - time)

      message.channel.send(`You're on cooldown. Wait ${ms.seconds} and try again.`)
    } else {
      db.set(`timeout_${message.author.id}`, 5000)
      let msg = await message.channel.send("Testing...")
      let pingEmbed = new Discord.RichEmbed()
        .setColor('#FC9D03')
        .setDescription(`⏱: ${Math.round(msg.createdAt - message.createdAt)}\n⏳: ${Math.round(bot.ping)}`)
      message.channel.send(pingEmbed)
      msg.delete()
    }
  }
})
bot.login(process.env.token)
