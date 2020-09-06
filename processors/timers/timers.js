const fs = require('fs');
const path = require('path');
const util = require('util'); // eslint-disable-line
const Bot = require('../../modules/Bot.js');
const { client } = require('../../modules/Bot.js');
const { time } = require('console');
const { brotliCompress } = require('zlib');
const { Instance } = require('localizify');

//APACHE 2.0 LICENSE: https://spdx.org/licenses/Apache-2.0.html#licenseText
var settings = {};
var messageCount = 0;
var queue = [];
var intervals = [];

function add(args)
{
    var timerName = args[0];
    var t = parseInt(args[1]);
    var m = args.slice(2).join(" ");
    if (m !== undefined && isNaN(t) !== true)
    {
        var s = settings.timers[timerName]= {
            message: m,
            time : parseInt(t)
        };
        intervals.push(
            {
            name: args[0],
            timer:  setInterval(function a(){queue.push({name: timerName,message:m})},parseInt(t) * 1000)
            });
        
            fs.writeFileSync(path.join(__dirname, 'timers.json'), JSON.stringify(settings, undefined, 4), (err) => {
                if (err) {
                    Bot.log(Bot.translate("processors.users.error_writing", {
                        fileName: 'timers.json',
                        error: err
                    }));
                }
            });
            Bot.client.sendMessage(Bot.translate("processors.timers.done"));
    }
    else 
    {
        Bot.client.sendMessage(Bot.translate("processors.timers.addError"));
    }
}
function remove(args)
{
    if (args[0] !== undefined)
    {
        var timerName = args[0];
        delete settings.timers[timerName];
        for (var i = 0; i < intervals.length; i++)
        {
            if (intervals[i].name == timerName)
            {
                intervals.splice(i,1);
            }
        }
        queue = [];
        fs.writeFileSync(path.join(__dirname, 'timers.json'), JSON.stringify(settings, undefined, 4), (err) => {
            if (err) {
                Bot.log(Bot.translate("processors.users.error_writing", {
                    fileName: 'timers.json',
                    error: err
                }));
            }
        });
        Bot.client.sendMessage(Bot.translate("processors.timers.done"));
    }
}


module.exports = {
  name: 'timers',
  description: "Allows for the use of commands from a json file.",
  author: "Krammy <krammy_ie@outlook.com> (https://github.com/kramitox)",
  license: "Apache-2.0",
  activate() {
    settings = require('./timers.json');
    var timerNames = settings.timers;
    
    Object.keys(timerNames).forEach(function(key)
    {
        intervals.push(
            {
               name: key,
               timer:  setInterval(function a(){
                   queue.push({name: key,message:timerNames[key].message});
            }, (parseInt(timerNames[key].time) * 1000))
            });
    });
    Bot.log(Bot.translate("processors.timers.activated"));
  },
  deactivate() {
    settings = {};
    queue = {};
    
    for (i = 0; i < intervals.length; i++)
    {
        clearInterval(intervals[i]);
    }

    Bot.log(Bot.translate("processors.timers.deactivated"));
  },
  process(data, client, callback) {
    var skip = false;
    var args = data.content.slice(Bot.settings.prefix.length).split(/ +/);
    var commandName = args[0].toLowerCase();
    args = args.slice(1);

    if (commandName === "timers" || commandName === "timer" && args[0] === "add")
    {
        add(args.slice(1));
        skip = true;
    }
    else if (commandName === "timers" || commandName === "timer" && args[0] === "remove")
    {
        remove(args.slice(1));
        skip = true;
    }
    else{
        if (data.user !== Bot.settings.name)
        {
            messageCount++;
        }
        if (messageCount > 10 && queue.length > 0)
        {
            var m = queue.shift();
            client.sendMessage(m.message);
            messageCount = 0;
        }
        callback(null, skip);
    }
  },
};
