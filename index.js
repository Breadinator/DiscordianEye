const config = require("./config.json");

const events = require("events");
var e = new events.EventEmitter();

const Discord = require("discord.js");
const client = new Discord.Client();

const sqlite3 = require('sqlite3');
var db = new sqlite3.Database(config.db.location, sqlite3.OPEN_READWRITE, (error) => {
	if (error) {console.error(error.message);}
});

function getReportConfig(server) { //BROKEN, returns undefined every time
	if (typeof server == "object") {
		server = server.id;
	}

	var reportChannel = 0; 
	var reportEmoticon = 0;
	
	db.all(`SELECT * FROM report`, (err, row) => {
		if (err) {console.error(err.message);}
		if (row.serverID == server) {
			reportChannel = row.reportChannel;
			reportEmoticon = row.reportEmoticon;
		}
	});
	return [reportChannel, reportEmoticon];
}

client.on("ready", () => {
	var channels = client.channels.array();
	for (var i = 0; i < channels.length; i++) {
		if (channels[i].type == "text") {
			channels[i].fetchMessages();
		}
	}

	console.log(`${client.user.username} is ready!`);
});

function getReportLength() {
	var records = 0;
	db.all("SELECT Count(*) FROM report", [], (err, rows) => {
		if (err) {console.error(err.message);}
		records = rows[0]['Count(*)'];
		e.emit("foundReportLength", records);
	});
}

client.on("message", message => {
	if (message.content == config.prefix + "ping") {
		message.channel.send('Pong!');
	} else if (message.content == config.prefix + "admin set reportChannel") {
		db.serialize(() => {
			getReportLength();
			e.once("foundReportLength", records => {
				var found = false;
				db.each("SELECT * FROM report", (err, row) => {
					var serverID;
					if (Number(row.serverID) == Number(message.guild.id)) {
						found = true;
						serverID = Number(row.serverID);
					}
					e.emit("finishedFindingServer", found, serverID);
				});
				e.once("finishedFindingServer", (found, serverID) => {
					if (serverID == message.guild.id) {
						if (found) {
							message.reply("already set");
						} else {
							message.reply("not already set");
						}
					}
				});
			});

		});

	}
})

client.on("messageReactionAdd", (messageReaction, user) => {
	//console.log(messageReaction.emoji.id);

	db.serialize(() => {
		db.each(`SELECT * FROM report`, (err, row) => {
			if (err) {console.error(err.message);}
			if (row.serverID == messageReaction.message.guild.id) {
				var reportChannel = row.reportChannel;
				var reportEmoticon = row.reportEmoticon;

				if (messageReaction.emoji.id == reportEmoticon) {
					messageReaction.remove(user);					

					var channels = messageReaction.message.guild.channels.array();
					for (var i = 0; i < channels.length; i++) {
						if (channels[i].type == "text" && Number(channels[i].id) === Number(row.reportChannel)) {
							channels[i].send("<@" + user.id + "> reported <@" + messageReaction.message.author.id + ">\nThe original message said:```" + messageReaction.message.content + "```");
						}
					}

				}
			}
		});
	});

	

	
});

client.login(config.token);