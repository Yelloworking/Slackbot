var Nest = function() {
    this.key = 'Bearer c.otmuQeAK8GHAgORBmxr7PgDjUl17o7kuk93xvyEqYuoTWKActSnrb9TgEGgtq6BLmidsT241lD2FM1ZL9NtMcNnVojbyQjdVIWuoEts3giOT3Uf9LZTNd5QClQhIZ0DA9xKuqnNLPEoCWeit';
    this.device = 'QfWMXjTAsXDKAI40bfTGHHkzzjpt86Rh';
    this.url = 'https://firebase-apiserver06-tah01-iad01.dapi.production.nest.com:9553/';
}

Nest.prototype.API = function(write, name, args, callback, append_device = false)
{
    var api = this.url + name + '/' + (append_device ? this.device : '');

    var content = args == undefined ? undefined : JSON.stringify(args);

    var start = new Http(api);

    console.log("Content", content);
    console.log("URL", api);

    start.request({
        method: write ? 'PUT' : 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': this.key
        },
        data: content

    }, function(ev) {
        callback(ev.data);
    });

    start.onerror = function(err)
    {
        console.log("err");
        console.log(JSON.stringify(err));
        callback(null);
    }
}

Nest.prototype.APIRead = function(name, args, callback, append_device = false)
{
    return this.API(false, name, args, callback, append_device);
}

Nest.prototype.APIWrite = function(name, args, callback, append_device = false)
{
    return this.API(true, name, args, callback, append_device);
}

Nest.prototype.heatNow = function()
{
    this.APIWrite('devices/thermostats', {'target_temperature_c': 30}, function(ev) {
        console.log(ev);
    }, true);
}

Nest.prototype.heatStop = function()
{
    this.APIWrite('devices/thermostats', {'target_temperature_c': 18}, function(ev) {
        console.log(ev);
    }, true);
}

Nest.prototype.getTemp = function(cb)
{
    this.APIRead('devices/thermostats', undefined, function(ev) {
        cb({
            cur: ev.ambient_temperature_c,
        });
    }, true);
}


module.exports = Nest;