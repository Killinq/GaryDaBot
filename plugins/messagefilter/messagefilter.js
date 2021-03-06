var self = this;

self.config = null;
self.fullconfig = null;
self.prefix = null;
self.logger = null;

var allChannelsNotSpecified = null;

exports.init = function (client, config, package, logger) {
    self.config = config.messageFilter;
    self.fullconfig = config;
    self.prefix = config.prefix;
    self.logger = logger;
    
    for (var i = 0; i < self.config.channels.length; i++) {
        if (self.config.channels[i].channel == "*") {
            allChannelsNotSpecified = i;
        }
    }

    client.on('message', filter);
}

function filter(message) {
    if (message.channel.type == 'dm')
        return;

    if (message.author.bot || self.config.channels.length < 1 || message.content.startsWith(self.prefix))
        return;

    if (allChannelsNotSpecified == null) {
        self.logger.log("Please include a channel with the name of '*' to be all channels not specified.")
        return;
    }

    if (self.config.channels[allChannelsNotSpecified].whitelist == null) {
        self.logger.log("Please include a whitelist for all channels not specified (channel with the name of '*').")
        return;
    }

    if (self.config.channels[allChannelsNotSpecified].blacklist == null) {
        self.logger.log("Please include a blacklist for all channels not specified (channel with the name of '*').")
        return;
    }

    for (var i = 0; i < self.fullconfig.immuneRoleNames.length; i++) {
        var immuneRole = message.guild.roles.find(r => r.name == self.config.immuneRoleNames[i]);
        if (message.member.roles.has(immuneRole.id))
            return;
    }

    var channelinfo = null;
    
    for (var i = 0; i < self.config.channels.length; i++) {
        if (self.config.channels[i].channel == message.channel.name) {
            channelinfo = self.config.channels[i];
        }
    }

    if (channelinfo == null) {
        if (allChannelsNotSpecified == null)
            return;

        channelinfo = self.config.channels[allChannelsNotSpecified];
    }
    
    var blacklist = channelinfo.blacklist;
    if (blacklist == null) {
        blacklist = self.config.channels[allChannelsNotSpecified].blacklist;
    }
    
    for (var i = 0; i < blacklist.length; i++) {
        var search = new RegExp(blacklist[i]);

        if (message.content.search(search) != -1) {
            message.delete()
                .then(() => {
                    var name = message.member.displayName;
                    var content = message.content;
                    
                    self.logger.log(`Deleted blacklisted message: ${name}: ${content}`, 'msgfilter');
                })
                .catch(self.logger.error);
            return;
        }
    }

    var whitelist = channelinfo.whitelist;
    if (whitelist == null) {
        whitelist = self.config.channels[allChannelsNotSpecified].whitelist;
    }

    for (var i = 0; i < whitelist.length; i++) {
        var search = new RegExp(whitelist[i]);

        if (message.content.search(search) == -1 && !message.author.bot) {
            message.delete();
            return;
        }
    }
}
