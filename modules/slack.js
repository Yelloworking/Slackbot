/* (c) 2015 Anthony Catel <paraboul@gmail.com> */

var Slack = function(token)
{
    this.token = token;
    this.ws = null;
    this.idx = 0;
    this.cmd = new Map();
    this.hook = require("hook");

    this.self = {
        id: null,
        name: null
    }

    this.users = new Map()
}

Slack.prototype.getWSUrl = function(callback)
{
    var start = new Http('https://slack.com/api/rtm.start?token=' + this.token);

    start.request({
        method: 'GET'
    }, function(ev) {
        var url = null;
        try {
            url = ev.data.url;
        } catch(e) {}

        this.self.id = ev.data.self.id;
        this.self.name = ev.data.self.name;

        callback(url);
    }.bind(this));

    start.onerror = function(err) {
        callback(null);
    }
}

Slack.prototype.updateUsersHash = function()
{
    this.API('users.list', {}, function(res) {
        if (!res.ok) {
            console.log("Failed to update user list");
            return;
        }

        for (let user of res.members) {
            this.users.set(user.id, {
                nick: user.name,
                firstname: user.profile.first_name,
                lastname: user.profile.last_name,
                email: user.profile.email,
                slackuser: user.id
            });
        }

        console.log("User list updated");

    }.bind(this));
}

Slack.prototype._onMessage = function(obj)
{
    if (obj.type && obj.type == "message" && obj.text) {
        var msg = obj.text;

        if (msg[0] == '!') {
            var args = obj.text.split(' ');
            var cmd = this.cmd.get(args[0].substr(1)) || function(){};
            
            obj.reply = (...args) => {
                this.sendMessage([obj.channel], args.join(' '));
            }

            cmd(obj, ...(args.slice(1)));
        } else {
            var f = {
                reply: (...args) => {
                    this.sendMessage([obj.channel], args.join(' '));
                }
            }

            this.hook.call("message", msg, f);
        }
    }
}

Slack.prototype.API = function(name, args, callback)
{
    var qs = "?token=" + this.token;

    for (var k in args) {
        qs += '&' + k + "=" + encodeURIComponent(args[k]);
    }

    var start = new Http('https://slack.com/api/' + name + qs);

    start.request({
        method: 'GET'
    }, function(ev) {
        callback(ev.data);
    });

    start.onerror = function(err)
    {
        callback(null);
    }
}

Slack.prototype.getUserInfo = function(userid, callback)
{
    this.API('users.info', {"user": userid}, callback);
}

Slack.prototype.send = function(obj)
{
    obj.id = ++this.idx;

    this.ws.send(JSON.stringify(obj));
}

Slack.prototype.sendMessage = function(channels, ...message)
{
    if (!Array.isArray(channels)) {
        channels = [channels];
    }

    for (let chan of channels) {
        this.send({
            type: "message",
            channel: chan,
            text: message.join(' ')
        });
    }
}

Slack.prototype.ping = function(ws = false)
{
    if (!ws) {
        this.send({
            type: "ping",
            time: +new Date()
        })
    } else {
        this.ws.ping();
    }
}

Slack.prototype.registerCmd = function(cmd, cb)
{
    this.cmd.set(cmd, cb);
}

Slack.prototype.connect = function(cb)
{
    this.getWSUrl((url) => {
        if (!url) {
            console.log("Failed to connect (no WS URL)");
            return;
        }

        var ws = new WebSocket(url);
        this.ws = ws;
        this.ptime = null;

        ws.onopen = () => {
            cb();

            this.ptime = setInterval(() => {
                this.ping(false);
            }, 15000);
        }

        ws.onmessage = (evt) => {
            this._onMessage(JSON.parse(evt.data))
        }

        ws.onclose = () => {
            if (this.ptime) {
                clearInterval(this.ptime);
                this.ptime = null;
            }
            console.log("Connection closed");

            setTimeout(function() {
                console.log("Reconnecting....");
                this.connect(cb);
            }.bind(this), 500);
            
        }
    });
}

module.exports = Slack;