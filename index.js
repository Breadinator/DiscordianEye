const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("./config.json");

client.on("ready", () => {
	var channels = client.channels.array();
	for (var i = 0; i < channels.length; i++) {
		if (channels[i].type == "text") {
			channels[i].fetchMessages();
		}
	}

	console.log(`${client.user.username} is ready!`);
});

client.on("message", message => {
	if (message.content == config.prefix + "ping") {
		message.channel.send('Pong!');
	}
})

client.on("messageReactionAdd", (messageReaction, user) => {
	if (messageReaction.emoji.id == config.reportEmoji) {
		messageReaction.remove(user);

		var channels = messageReaction.message.guild.channels.array();
		for (var i = 0; i < channels.length; i++) {
			if (channels[i].id == config.reportChannel) {
				channels[i].send("<@" + user.id + "> reported <@" + messageReaction.message.author.id + ">\nThe original message said:```" + messageReaction.message.content + "```");
			}
		}
	}
});

client.login(config.token);