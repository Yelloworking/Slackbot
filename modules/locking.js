/* (c) 2016 Anthony Catel <paraboul@gmail.com> */

var Locking = function()
{
    this.url = "http://localhost:8090/locking/";
}

Locking.prototype.API = function(name, args, callback)
{
    var start = new Http(this.url + name);

    var qs = '';

    if (args) {
        for (var k in args) {
            qs += k + "=" + encodeURIComponent(args[k]) + "&";
        }

        qs = qs.slice(0, -1);

        console.log("Send qs", qs);
    }

    if (args) {
        start.request({
            method: 'POST',
            data: qs,
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            }
        }, function(ev) {
            callback(ev.data);
        });

    } else {
        start.request({
            method: 'GET'
        }, function(ev) {
            callback(ev.data);
        });   
    }

    start.onerror = function(err)
    {
        callback(null);
    }
}

Locking.prototype.getByDayId = function(dayid, what, callback)
{
    locking.API("get/" + what + "/" + dayid, null, callback);
}

Locking.prototype.getNextDays = function(days, callback)
{
    locking.API("getNext/" + days, null, callback);
}

Locking.prototype.setUserToDate = function(dayid, what, userobj, callback)
{

    locking.API("set/" + what + "/" + dayid, {
        slackuser: userobj.slackuser,
        fullname: userobj.firstname + " " + userobj.lastname
    }, callback);
}

Locking.prototype.delToDate = function(dayid, what, callback)
{
    locking.API("del/" + what + "/" + dayid, {}, callback);
}

Locking.prototype.setUserAllDay = function(daynum, what, userobj, callback)
{
    locking.API("setNext/" + what + "/" + daynum, {
        slackuser: userobj.slackuser,
        fullname: userobj.firstname + " " + userobj.lastname
    }, callback);
}


module.exports = Locking;
