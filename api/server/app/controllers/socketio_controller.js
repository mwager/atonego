/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * SocketIOController
 *
 * Handles ALL SocketIO Events
 *
 * NOT USED ANYMORE
 * see commit "d81586ca6c9cdc20fdcff0120dd499b1f00cf3fe REMOVE SOCKET IO"
 * in the old repo
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

var
    ENV = process.env.NODE_ENV || 'development',
    application = require('../../lib/application'),
    // i18n = application.getI18nInstance(),
    // _ = require('underscore'),
    utils = require('../../lib/utils'),
    logger = require('../../lib/logger'),
    // _ = require('underscore'),
    User,
    SocketIOController;


// Global Socket IO instance
var socketIO;

// Constructor
SocketIOController = function (app, mongoose, config) {
    this.mongoose = mongoose;
    this.config = config;

    User = mongoose.model('User');
};

SocketIOController.prototype = {
    /**
     * Listen for websocket connections and start listening for events
     * on successfull connections
     */
    initSocketIOListening: function(io) {
        // The Global socketIO object
        socketIO = io;

        var self = this;

        socketIO.sockets.on('connection', function (socket) {
            var hs = socket.handshake;
            var user = hs.user;

            // get the IP address of the connected client
            var IP = hs.address.address + ':' + hs.address.port;

            // we log ALL incoming socket requests
            var msg = 'A client connected via SocketIO. IP: ' + IP;

            if(user) {
                msg += ' It is: ' + ((user && user.email) ? user.email : ' UNKNOWN!?');
            } else {
                msg += ' NO AUTH. RETURNING';
            }

            // some logging
            logger.info(msg);

            if(!user) {
                return false;
            }

            socket.on('log', function (data) {
                var msg = '===> ERROR LOG FROM CLIENT VIA SOCKET-IO ' + data;
                utils.handleError(msg);
            });

            setTimeout(function() {
                // NOW FETCH BACK THE USER!!!
                // SO ON ANY RESUME EVENT, THE USER WILL BE FETCHED, BECAUSE WE
                // MUST RE-CONNECT ANYWAY
                User.fetchUser(user._id, function(err, userFound) {
                    if(err) {
                        utils.handleError(err);
                    }

                    if(!err && userFound) {
                        socket.emit('user', userFound);
                    }
                });
            }, 3000);

            // init socket listening for this socket
            self.setSocketAndStartListening(socket);
        });
    },

    /**
     * Set socket of connected client to start listening and
     * emit events of this socket
     */
    setSocketAndStartListening: function(socket) {
        // es kommt ein array mit ListIDs rein:
        socket.on('subscribeToLists', function(lists) {

            lists.forEach(function(listID) {
                socket.join(listID);
            });

            /*setTimeout(function() {
                // now, it's easy to send a message to just the clients in a given room
                // socketIO.sockets.in(listID).emit('update_list', {title: 'DEMO LIST'});

                // geht zu mir zurück
                // socket.emit('update_list', {title: 'DEMO LIST'});
                // geht auch zu mir zurück
                // socket.in(listID).emit('update_list', {title: 'DEMO LIST'});

                // NUR ALLE /ANDEREN/ USER!
                // socket.broadcast.emit('update_list', {title: 'DEMO LIST'});

                // NUR ALLE /ANDEREN/ USER /INNERHALB/ DER LISTE!
                // socket.in(listID).broadcast.emit('update_list', {title: 'DEMO LIST'});
                socket.broadcast.to(listID).emit('update_list', {title: 'DEMO LIST2'});
            }, 10);*/
        });

        socket.on('unsubscribeFromLists', function(lists) {
            lists.forEach(function(listID) {
                socket.leave(listID);
            });
        });
    },

    /**
     * Broadcast bedeutet "im Namen eines Users" an alle anderen
     * verbundenen clients INNERHALB EINER LISTE zu pushen
     */
    broadcast: function(user, listID, evnt, data, incomingHTTPRequest) {
        // XXX cleanup
        if(true) {
            return false;
        }


        if(arguments.length !== 5) {
            utils.handleError('broadcast: not enough arguments: ' + arguments.length);
            return false;
        }
        if(!listID) {
            utils.handleError('broadcast: no list id');
            return false;
        }

        var headerAuth = application.getAPITokenFromHttpBasicAuthRequestHeader(incomingHTTPRequest);
        if(!headerAuth) {
            return false;
        }

        var incomingToken    = headerAuth.API_TOKEN;
        var connectedClients = socketIO.sockets.clients();

        if(ENV !== 'test') {
            console.log('BROADCAST IN THE NAME OF: ' + user.email + ' listID: ' +  listID +
                ' EVENT: "' + evnt + '". All connected clients: ' +
                ' ' + connectedClients.length + ' ');
        }

        var socketUser,
            socketToUse = null,
            isSameUser = false;

        // AUFGABE: "Wir müssen den Socket des Users finden und nutzen,
        // welcher den REST/HTTP Request gemacht hat."
        // .....................................................................
        // Denn mit diesem Socket können wir an alle AUßER DIESEN broadcasten!
        // Um dies auch tatsächlich sicher sagen zu können (es kann sein
        // dass ein benutzer auf mehreren geräten eingeloggt ist) speichern
        // wir bei der socket io auth neben dem user auch den API TOKEN
        // Somit können wir hier den Token im HTTP Header des eingehenden HTTP Reqs
        // mit diesem vergleichen
        connectedClients.forEach(function (socket) {
            socketUser = null;

            if(socket.handshake) {
                socketUser = socket.handshake.user;

                // is this the user which triggered this broadcast by making
                // a HTTP Req to the server?
                // ==> IN DESSEN NAMEN WOLLEN WIR HIER BROADCASTEN !!!
                // SONST KANN ES SEIN, DASS WENN ICH AUF 2 GERÄTEN EINGELOGGT BIN,
                // DASS ICH ZB EIN TODO AKTUALISIERE UND DANN ZU MIR SELBST
                // "GE-BROADCASTED" WIRD!
                isSameUser = incomingToken === socket.handshake.user.API_TOKEN;

                // XXX raus
                console.log('found a socket-user: ' +
                    ((socketUser && socketUser.email) ? socketUser.email : 'NO USER') +
                    ' isSameUser? '    + isSameUser +
                    ' incomingToken: ' + incomingToken +
                    ' - and the socket user\'s API TOKEN: ' + socket.handshake.user.API_TOKEN);
            }

            if(isSameUser && socketUser !== null && ('' + socketUser._id === '' + user._id)) {
                socketToUse = socket;
            }
        });

        if(socketToUse !== null) {
            console.log('    ===> FINALLY: user of socket to use is: ' + socketToUse.handshake.user.email);
            socketToUse.broadcast.to(listID).emit(evnt, data);
        }
        else {
            console.log('SOCKET BROADCAST: NO USER FOUND!');
        }
        /*else {
            socketIO.sockets.in(listID).emit(evnt, data);
        }*/
    },

    /**
     * Hier wird direkt der Socket des Users verwendet, welcher die id des
     * übergebenen users besitzt. Dieser muss dafür natürlich gerade via
     * SocketIO verbunden sein
     */
    pushToUser: function(user, evnt, data, incomingHTTPRequest) {
        /*jshint maxcomplexity: 12*/

        // XXX cleanup
        if(true) {
            return false;
        }

        if(arguments.length !== 4) {
            utils.handleError('pushToUser: not enough arguments: ' + arguments.length);
            return false;
        }

        if(!user) {
            utils.handleError('pushToUser: no user ? ' + user);
            return false;
        }

        var headerAuth = application.getAPITokenFromHttpBasicAuthRequestHeader(incomingHTTPRequest);
        if(!headerAuth) {
            return false;
        }

        var incomingToken    = headerAuth.API_TOKEN;
        var connectedClients = socketIO.sockets.clients();

        if(ENV !== 'test') {
            console.log('PUSHING TO USER: ' + user.email +
                ' EVENT: "' + evnt + '". All connected clients: ' +
                '(' + connectedClients.length + ') ');
        }

        var socketUser,
            socketToUse = null,
            socketID,
            isSameUser = false;

        var i, socket;

        // NOTE: Der Benutzer kann mit mehreren geräten (sockets) verbunden sein!
        for(i in connectedClients) {
            socketUser = null;

            if(connectedClients.hasOwnProperty(i)) {
                socket = connectedClients[i];

                if(socket.handshake) {
                    socketUser = socket.handshake.user;
                    console.log('found a socket-user: ' + socketUser.email);

                    // is this the user which triggered this broadcast by making
                    // a HTTP Req to the server?
                    isSameUser = incomingToken === socket.handshake.user.API_TOKEN;
                }

                if(socketUser !== null && ('' + socketUser._id === '' + user._id)) {
                    socketToUse = socket;
                    socketID    = socket.id;

                    // NO! emit to this socket
                    // UPDATE: (hmm kann sein dass dann 2mal auf selbem Gerät kommt!?)
                    // XXX JA UND ? DANN DIESEN FALL EBEN AUSSCHLIEßEN!
                    if(!isSameUser) {
                        console.log('EMITTING DIRECTLY TO SOCKET: ' + socketToUse.handshake.user.email); // TODO raus
                        socketToUse.emit(evnt, data);
                    }
                }
            }
        }

        /*
        old:
        if(socketToUse !== null) {
            console.log('EMITTING TO SOCKET: ' + socketToUse.handshake.user.email); // TODO raus
            // socketIO.sockets.socket(socketID).emit(evnt, data);
            socketToUse.emit(evnt, data);
        }*/
    }
};

module.exports = SocketIOController;
