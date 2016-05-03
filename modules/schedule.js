/* (c) 2016 Anthony Catel <paraboul@gmail.com> */

var list = [];

var stimer = setInterval(function() {

    var cur = new Date();
    var cursec = Math.ceil((+new Date())/1000);

    var fstr = cur.toLocaleFormat("%H:%M");

    for (let action of list) {
        if (action.time == fstr && cursec - action.last > 120) {
            action.callback.apply(this, action.args);
            action.last = cursec; 
        }
    }

}, 1000);

var schedule = function(time, callback, ...args)
{
    var obj = {
        time: time,
        callback: callback,
        args: args,
        last: 0
    }

    list.push(obj);
}


module.exports = schedule;
