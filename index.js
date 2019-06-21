const config = require('./botconfig.json')
const Discord = require('discord.js')
const ms = require('ms')
const moment = require('moment')
const rbx = require('noblox.js')
const db = require('quick.db')
const bot = new Discord.Client({
  disableEverybody: true
)};

bot.on("ready", async () => {
  console.log(`${bot.user.username} has successfully been started.`)
  bot.user.setActivity("the waiting game", {
    type: "PLAYING"
  })
})

bot.login(process.env.token)
