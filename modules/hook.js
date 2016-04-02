/* (c) 2015 Anthony Catel <paraboul@gmail.com> */

var RegisteredHook = new Map();

module.exports = {
    call: function(eventName, ...arg) {
        var lst = RegisteredHook.get(eventName);
        if (!lst) return;

        for (var i = 0; i < lst.length; i++) {
            lst[i](...arg);           
        }
    },

    on: function(eventName, cb) {
        var lst = RegisteredHook.get(eventName);
        if (!lst) {
            RegisteredHook.set(eventName, [cb]);

            return;
        }

        lst.push(cb);
    }
}