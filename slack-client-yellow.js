/* (c) 2016 Anthony Catel <paraboul@gmail.com> */

var Slack = require("slack");
var Locking = require("locking");
var util = require("util");
var schedule = require("schedule");

const TOKEN = 'SLACK_TOKEN';
const CHANNEL_OF = 'G0WNEDBV5';
const CHANNEL_TEST = 'G0WJD007Q';

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
}

Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

var words = {
    positive: ["y a moyen", "dans le mille, Emile", "et comment", "un peu mon neveu !", "parfaitement", "Oui", "Affirmatif", "Oui...", "vui", "oue", "yep", "ja", "ouep", "OUI", "A ton avis", "evidement", "lol oue", "ohhh oui", "ahahaha", "comme tu dis, Fifi", "t'as pas tort, Hector"],
    neutral: ["demande a google", "quoi ?", "devine", "laisse moi reflechir", "Je crois...", "Je crois bien...", "Peut etre", "Je sais pas trop", "Pas sur", "hmmm", "heu", "euh", "...", "ptetre", "jsais pas", "euhhhh", "bof", "ta gueule", "t'es relou", "pourquoi ?", "aucune idee", "c'est probable, je sais pas"],
    negative: ["pas possible", "impossible", "pas moyen", "non...", "non", "lol non", "vraiment pas", "heu non Oo", "nop", "nein", "nein", "NON", "trop pas", "negatif", "", ":o :o", "jamais", "surement pas", "pas du tout"],
    smiley: [":)",":p", "><", ":D", "xD", ":o", ":3", "Oo", "O_o", "^^", ":>", ":'(", ":(", ":-(", ";)", ":'", "!", ":°", "...", "..", "!!", "aha", "mdr", "lul", "loul", "...trop swag", "batard", "Ôo", "et toi ?"]
}


var motive = ["Bonne journée :)", "Viens me voir si t'as besoin de quelque chose...", "Pas trop seul ?", "Pas trop dur ce matin ?", "J'ai déposé des croissants dans la cuisine...virtuelle :bread:"]
var emo = [":kissing_heart:", ":heart:", ":smirk:", ":metal:", ":v:", ":joy:"];

var days = ["lundis", "mardis", "mercredis", "jeudis", "vendredis"];

function ask() { return (Math.floor(Math.random()*2) == 1 ? true : false); }

function isWeekend(date) {
    var day = date.getDay();

    return (day == 6) || (day == 0);
} 

var slack = new Slack(TOKEN);
var locking = new Locking();

slack.connect(function() {
    console.log("Connected to slack :-)");
    slack.updateUsersHash();
});


slack.registerCmd('js', function(obj, ...args) {

    try {
        var ret = eval(args.join(' '));
    } catch(e) {

        slack.sendMessage([obj.channel], e);
        return;
    }

    slack.sendMessage([obj.channel], ret);
});


schedule("17:00", function() {
    var d = new Date();

    if (isWeekend(d)) return;

    var dayid = d.toLocaleFormat("%d%m%y");

    locking.getByDayId(dayid, "close", function(ret) {
        var data = ret.res[0];

        if (!data.who.length) {
            slack.sendMessage(CHANNEL_OF, ":warning: Attention, personne a la fermeture ce soir (ping <!channel>)");
        } else {
            slack.sendMessage(CHANNEL_OF, "Rappel : ce soir c'est <@"+data.who[0].slackuser+"> qui ferme", emo.pick())
        }
    });
});

schedule("17:30", function() {
    var d = new Date();
    d = d.addDays(1);

    if (isWeekend(d)) return;

    var dayid = d.toLocaleFormat("%d%m%y");

    locking.getByDayId(dayid, "open", function(ret) {
        var data = ret.res[0];

        if (!data.who.length) {
            slack.sendMessage(CHANNEL_OF, ":warning: Attention, personne n'ouvre demain matin ! (ping <!channel>)");
        } else {
            slack.sendMessage(CHANNEL_OF, "Hey, demain matin c'est <@"+data.who[0].slackuser+"> qui ouvre", emo.pick())
        }
    });
});


schedule("08:05", function() {
    var d = new Date();

    if (isWeekend(d)) return;

    var dayid = d.toLocaleFormat("%d%m%y");

    locking.getByDayId(dayid, "open", function(ret) {
        var data = ret.res[0];

        if (data.who.length) {
            slack.sendMessage(CHANNEL_OF, "Hello <@"+data.who[0].slackuser+"> l'ouverture se passe bien ?", emo.pick(), motive.pick());
        }
    });
});

slack.registerCmd('of', function(obj, ...args) {

    var currentUser = slack.users.get(obj.user);

    switch (args[0]) {
        case "help":
        case "aide":
            obj.reply(util.format("<@%s> La syntaxe pour les Ouverture/Fermeture est la suivante :\n```!of <ouverture|fermeture> <jjmmaa> [@slackuser]\n!of <ouverture|fermeture> <jour de la semaine au pluriel> [@slackuser]\n!of qui```", obj.user));
            obj.reply(util.format("Exemples :\n```!of ouverture 121016 @camille\n!of ouverture Lundis @vpeyre```"));
            obj.reply(util.format("PS: si le pseudo slack est omit, tu es automatiquement désigné :cop:"));
            break;
        case "qui":
            let duration = args[1] || 7;
            locking.getNextDays(parseInt(duration), function(ret) {
                for (let day of ret.res) {
                    let msg = '';
                    let who = day.who;
                    let ouverture = undefined;
                    let fermeture = undefined;

                    if (who.length == 0) {
                        msg += "`personne`";
                    } else {

                        if (who[0].kind == "open") {
                            ouverture = who[0];
                        } else {
                            fermeture = who[0];
                        }

                        if (who[1]) {
                            if (who[1].kind == "open") {
                                ouverture = who[1];
                            } else {
                                fermeture = who[1];
                            }
                        }

                        msg += util.format("Ouverture : `%s` ", ouverture ? ouverture.fullname : "personne");
                        msg += util.format("Fermeture : `%s` ", fermeture ? fermeture.fullname : "personne");
                    }

                    obj.reply("*" + day.date + "*", ":", msg);
                }
            });

            break;

        case "ouverture":
        case "fermeture":

            let action = args[0] == 'ouverture' ? 'open' : 'close';
            let targetUser = currentUser;

            if (args[2]) {
                var m = args[2].match(/<@([A-Z0-9]+)>/);
                if (m) {
                    targetUser = slack.users.get(m[1]);
                }
            }

            if (days.indexOf(args[1].toLowerCase()) !== -1) {
                locking.setUserAllDay(days.indexOf(args[1].toLowerCase()), action, targetUser, function(ret) {
                    obj.reply("Ok c'est note pour tous les "+ args[1] +" :+1: ");
                });
            } else {

                locking.setUserToDate(args[1], action, targetUser, function(ret) {
                    obj.reply("Ok c'est note :+1:");
                });
            }

            break;
    }
});

slack.hook.on("message", function(msg, resp) {

    var m = msg.match(/<@([A-Z0-9]+)>(.*?)\?/);
    if (!m) {
        return;
    }

    if (m[1] == slack.self.id) {
        var replied = '';
        var what = ['positive', 'neutral', 'negative'];

        replied = words[what.pick()].pick();
        if (ask()) {
            replied += ' ' + words.smiley.pick();
        }

        resp.reply(replied);
    }
});
