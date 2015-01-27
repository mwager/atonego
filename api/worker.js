/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * This is the "worker" of the AtOneGo Node Server (see server.js)
 *
 * Load config, configure express, connect to MongoDB,
 * register models and api-controllers, and finally startup the server
 *
 * @author Michael Wager <mail@mwager.de>
 */
'use strict';

// module dependencies
var
    ENV             = process.env.NODE_ENV || 'development',
    _               = require('underscore'),
    cluster         = require('cluster'),
    mongoose        = require('mongoose'),
    domain          = require('domain'),
    path            = require('path'),
    application     = require('./server/lib/application'),
    pjson           = require('./package.json'),
    passport        = require('passport'),
    http            = require('http'),
    // https = require('https'), openshift handles https for us
    // cookie = require('cookie'),
    // connect = require('connect'),
    connectTimeout  = require('connect-timeout'),
    express         = require('express'),
    I18n            = require('i18n-2'),

    //  MemoryStore = express.session.MemoryStore,
    MongoStore      = require('connect-mongo')(express),
    // "DO NOT - DO NOT - DO NOT USE 'connect-mongo' in production"
    // http://architects.dzone.com/articles/video-production-nodejs
    // XXX checkout openshift: new "scalable app" ? then add redis too
    // RedisStore   = require('connect-redis')(express),


    EventEmitter    = require('events').EventEmitter,
    AppEmitter      = new EventEmitter(),

    utils           = require(application.PROJECT_ROOT + 'server/lib/utils'),
    db              = require(application.PROJECT_ROOT + 'server/lib/db'),
    logger          = require(application.PROJECT_ROOT + 'server/lib/logger'),

    app,    // express app object
    server, // http(s) server object
    colors,

    // production: sessions in DB
    sessionCollectionName = 'aog-sessions',
    // sessionStore,

    // experimenting, not used anymore
    // socketIO = require('socket.io'),
    // SocketIOController = require(application.PROJECT_ROOT + 'server/app/controllers/socketio_controller'),
    // socketIOController, // instance

    //  gzippo = require('gzippo'), // XXX ?

    config,
    KILL_TIMEOUT = 3000;

colors  = require('colors');

/**
 * The domain error handler callback
 *
 * We want to send a 500 to the request which caused this fatal error,
 * shut down the process and fork a new one
 *
 * @see http://nodejs.org/api/domain.html
 */
function globalDomainErrorHandler(err, req, res) {
    // log the error and send an email to the admin if in production
    var sendMail = true; // (ENV === 'production');
    utils.handleError(err, null, sendMail);

    // Note: we're in dangerous territory!
    // By definition, something unexpected occurred,
    // which we probably didn't want.
    // Anything can happen now!  Be very careful!

    try {
        // make sure we close down
        // @see http://nodejs.org/api/domain.html#domain_warning_don_t_ignore_errors
        var killtimer = setTimeout(function() {
            log('============== KILLING THE WORKER ==============');
            process.exit(1);
        }, KILL_TIMEOUT);

        // But don't keep the process open just for that!
        // http://nodejs.org/api/timers.html#timers_unref
        if(killtimer.unref) {
            killtimer.unref();
        }

        // stop taking new requests.
        server.close();

        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        cluster.worker.disconnect();


        // XXX send PUSH notification? (-:


        // try to send an error to the request that triggered the problem
        return application.sendDefaultError(req, res, err, 'This is an error. Try again.'); // TODO locale?
    } catch (err2) {
        // oh well, not much we can do at this point.
        console.error('Error sending 500!', err2.stack);
    }
}

/**
 * Express Framework configuration
 */
function configureExpress() {

    // global helpers for usage in the views...
    app.locals.parseDate = function(timestamp) {
        var dateInstance = new Date(Number(timestamp));

        var year    = dateInstance.getFullYear();
        var month   = dateInstance.getMonth() + 1;
        var day     = dateInstance.getDate();

        if(day.toString().length === 1) {
            day = '0' + day;
        }
        if(month.toString().length === 1) {
            month = '0' + month;
        }

        var str = day + '.' + month + '.' + year;
        str += ', ';

        var h = dateInstance.getHours();
        var m = dateInstance.getMinutes();

        if(h.toString().length === 1) {
            h = '0' + h;
        }
        if(m.toString().length === 1) {
            m = '0' + m;
        }
        str += h + ':' + m;

        return str;
    };
    /**
     * Own Error Handling middleware
     *
     * Run EVERY Route-Handler within a domainRunner!
     *
     * So we can listen for errors, triggered by the execution
     * of code within a request, destroy the worker & fork a new onbe
     *
     * @see http://nodejs.org/api/domain.html
     */
    app.use(function(req, res, next) {
        var domayn = domain.create();

        domayn.on('error', function __domainError(err) {
            globalDomainErrorHandler(err, req, res);
        });

        // Because req and res were created before this domain existed,
        // we need to explicitly add them.
        // See the explanation of implicit vs explicit binding below.
        domayn.add(req);
        domayn.add(res);

        // Now run the handler function in the domain.
        domayn.run(function __domainRunner() {
            next();
        });
    });

    // etags ? phonegap?!?!?!?
    // app.use(require('etagify')());

    // Do we want everybody to know that this app is provided by Express? NO!
    app.use(function (req, res, next) {
        res.removeHeader('X-Powered-By');
        next();
    });

    // XXX sessions sometimes error ?
    /*app.use(function(req, res, next) {
        var hour = 3600000;
        if(req.session && req.session.cookie && !req.session.cookie.maxAge) {
            req.session.cookie.expires = new Date(Date.now() + hour);
            req.session.cookie.maxAge  = hour;
        }
        next();
    });*/

    // flash messages
    app.use(require('connect-flash')());

    // Expose the flash function to the view layer
    app.use(function (req, res, next) {
        res.locals.flash = req.flash.bind(req);
        next();
    });

    // XXX ? needed ? http://www.exratione.com/2013/05/the-use-of-cookies-versus-query-string-tokens-\
    // to-identify-sessions-in-socketio/
    /*express.use(function (req, res, next) {
        res.locals.socketIoNamespace = "namespace";
        res.locals.socketIoToken = 1; // someEncryptionFunction(req.session.id);
        next();
    });*/

    app.configure(function () {
        var dbFromConf,
            mongoStoreConf,
            // onSessionStoreConnected,
            isLive;

        // ?
        // app.set('port', process.env.PORT || config.blaaaaaaa);

        // use ejs as server-side template language
        app.set('views', __dirname + '/server/website/views');
        app.set('view engine', 'ejs');
        app.engine('html', require('ejs').renderFile);
        // app.use(express.favicon());

        app.use(express.compress());
        app.use(express.methodOverride());
        app.use(express.bodyParser());

        // INIT THE SESSION STORAGE - WE DO NOT USE COOKIES. WE SET AN API TOKEN
        // IN THE REQUEST HEADER INSTEAD
        // Wir haben dennoch sessions, zb für flash messages etc...
        dbFromConf = config.db[ENV].main;
        isLive = process.env.OPENSHIFT_MONGODB_DB_PORT;

        mongoStoreConf = {
            // use existing mongoose connection !
            mongooseConnection:  mongoose.connections[0],
            db:                  isLive ? 'atonego' : dbFromConf.DATABASE,
            host:                process.env.OPENSHIFT_MONGODB_DB_HOST || dbFromConf.HOST,
            port:                process.env.OPENSHIFT_MONGODB_DB_PORT|| dbFromConf.PORT || 27017,
            username:            process.env.OPENSHIFT_MONGODB_DB_USERNAME || '', // optional
            password:            process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '', // optional
            collection:          sessionCollectionName, // 'mySessions' // optional, default: sessions

            // ttl: 30,

            autoRemove: 'interval',
            autoRemoveInterval: 10 // In minutes. Default
        };

        // onSessionStoreConnected = function (conf) {
        //     logger.log(('Mongo Session Storage Module connected to database `' +
        //         conf.db.databaseName + '`. CollectionName: `' + sessionCollectionName + '` (-;').green);
        // };

        // wir wollen keine cookies, deshalb checken wir einen token im header
        // jedes requests um benutzer zu identifizieren
        // This works only after deleting the sessions collection
        app.use(express.cookieParser(config[ENV].SECRET));
        app.use(express.session({
            cookie: { maxAge: new Date(Date.now() + 360000)},
            // maxAge: Date.now() + (360000),

            secret: config[ENV].SECRET,
            store : new MongoStore(mongoStoreConf/*, onSessionStoreConnected*/)
            // key: 'connect.sid'
        }));

        // PASSPORT
        app.use(passport.initialize());
        app.use(passport.session());

        // XXX maybe sometimes in the future
        // app.use(express.csrf());
        // Attach the i18n property to the express request object
        // And attach helper methods for use in templates
        // => docs: https://github.com/jeresig/i18n-node-2
        I18n.expressBind(app, application.i18nOptions);

        app.use(app.router);

        // set root dir (like htdocs)
        app.use(express['static'](path.join(__dirname, 'server/website')));
        // test gzip:
        // curl -I -H 'Accept-Encoding: gzip,deflate'  http://flirtsaver.de/build/main-built.js | grep 'Content'
        //utils.ifEnv('production', function () {
        // enable gzip compression TODO doesn't work with express 3.0.0 !?!!?? shitty thing dat!
        //app.use(gzippo.staticGzip(path.join(__dirname, 'public')));
        //app.use(gzippo.compress());
        //});
        app.use(connectTimeout({
            time: parseInt(config[ENV].REQ_TIMEOUT || 10000, 10)
        }));
    });

    app.configure('development', function () {
        console.log('=== DEV ENVIRONMENT ==='.yellow);

        // wir wollen errors in requests direkt im browser oder console sehen,
        // mit stacktrace. Im "Fatal"-Fall wird ein neuer worker geforkt und der
        // aktuelle innerhalb eines timeouts gekillt.
        app.use(express.errorHandler({
            dumpExceptions: true,
            showStack: true
        }));
    });

    app.configure('production', function () {
        console.log('=== THIS IS PRODUCTION ENVIRONMENT ==='.yellow);
    });

    app.on('error', function (e) {
        // "cast" to string
        e = e.stack ? e.message + e.stack : e;
        e = 'GLOBAL EXPRESS ERROR: ' + e;
        utils.handleError(e);
    });
}

/**
 * Configure socketIO environments and authorization
 *
function configureSocketIO() {
    socketIO = socketIO.listen(server); // http oder https server !

    // socket io env based config
    // configure socketIO for PRODUCTION usage:
    // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
    socketIO.configure('production', function () {

        // not needed yet, vielleicht wenn auch als webapp ?
        socketIO.set('browser client', false);
        //        socketIO.enable('browser client minification');  // send minified client
        //        socketIO.enable('browser client etag');          // apply etag caching logic based on version number
        //        socketIO.enable('browser client gzip');          // gzip the file
        // reduce logging
        socketIO.set('log level', 1);

        // enable all transports (optional if you want flashsocket)
        socketIO.set('transports', [
            'websocket',
            // 'flashsocket',
            'htmlfile',
            'xhr-polling',
            'jsonp-polling'
        ]);
    });

    socketIO.configure('development', function () {
        //        socketIO.set('origins', '127.0.0.1');
        //        socketIO.set('origins', 'localhost');

        logger.log('CONFIGURE SOCKET IO FOR DEV !!!');

        socketIO.set('origins', '*:*');
        socketIO.set('origins', '*127.0.0.1*:*');

        //        socketIO.set('match origin protocol', true);
        //        socketIO.set('browser client', true);
        // enable all transports (optional if you want flashsocket)
        socketIO.set('transports', ['websocket', /*'flashsocket',* / 'htmlfile', 'xhr-polling', 'jsonp-polling']);
    });

    **
     * SocketIO Authorization using a encrypted token since cookie
     * support is bad on ios with phonegap
     *
     * @see  http://www.exratione.com/2013/05/\
     *           the-use-of-cookies-versus-query-string-tokens-to-identify-sessions-in-socketio
     * @see http://www.danielbaulig.de/socket-ioexpress/
     *
    socketIO.set('authorization', function (handshakeData, accept) {
        var err;

        // get the api token from the ?query parameter
        var API_TOKEN = handshakeData.query.api_token;

        if(!API_TOKEN) {
            err = 'No API_TOKEN transmitted.';
            err += ' HEADER: ' + JSON.stringify(handshakeData.headers);
            logger.log('worker.js: ' + err);
            return accept('No token transmitted', false);
        }

        logger.log('SOCKET IO authorization, API_TOKEN is:' + API_TOKEN);

        var User   = mongoose.model('User');
        var userID = application.parseRemembermeToken(application.SALT, API_TOKEN);

        User.findById(userID, function(err, user) {
            if(err) {
                utils.handleError(err);
            }

            // speichere user in handshake data für Verwendung in allen
            // weiteren incoming requests!
            if(!err && user) {
                // save language from user
                handshakeData.language = user.lang;

                // we only store a raw json object here
                handshakeData.user = user.toJSON();

                // also store token for further use
                handshakeData.user.API_TOKEN = API_TOKEN;

                log('GOT user from websocket connection: ' + user.email + ' token: ' + API_TOKEN);
            }

            // ok, we are done
            accept(null, true);
        });
    });
}
***********/

/**
 * Register all models here
 */
function registerModels() {
    // register models (injecting the db connection)
    require(application.PROJECT_ROOT + 'server/app/models/user')(mongoose);
    require(application.PROJECT_ROOT + 'server/app/models/todolist')(mongoose);
    require(application.PROJECT_ROOT + 'server/app/models/todo')(mongoose);
    require(application.PROJECT_ROOT + 'server/app/models/deleted_user')(mongoose);
}

/**
 * Register all controllers here (website & api)
 *
 * NUR die Controller der API sind für Texte (i18n) verantwortlich.
 * Models kommunizieren via dokumentierten Statuscodes in den error-Objekten
 * der Callbacks
 */
function registerControllers() {
    // Jeder Controller bekommt eine Instanz des SocketIOControllers übergeben
    // um ggf events zu gewissen clients zu pushen
    // socketIOController = new SocketIOController(app, mongoose, config);
    // socketIOController.initSocketIOListening(socketIO);

    [
        // Website controller(s)
        'website',

        // API controllers
        'auth',
        'users',
        'todolists',
        'todos'
    ].forEach(function (controller) {
        var Con = require(application.PROJECT_ROOT + 'server/app/controllers/' + controller + '_controller');
        new Con(app, mongoose, config/*, socketIOController*/);
    });
}


/**
 * The Cronjob POST "Hack"
 */
function __doCronJobOnPOST(req, res) {
    // init needed models
    var Todo = mongoose.model('Todo');
    var User = mongoose.model('User');

    var checkDateAndPUSH = function(todo) {
        var now = new Date();
        var todoDate = todo.date;
        var todolist = todo.todolist;

        if(!todoDate instanceof Date) {
            return false;
        }

        // some logging
        var dateNowUtc = new Date(); // XXX ? new Date(Date.UTC(now.getFullYear(), now.getMonth()-1, now.getDay()));
        logger.cronlog('[' + dateNowUtc.toString() + '] checking task: ' +
            todo.title + ' - task-date: ' + todo.date + ' list: ' +
            todo.todolist.title + ' userID of List: ' + todo.todolist.user);

        var i18n = application.getI18nInstance();

        // Negativ bedeutet "ist noch in Zukunft"!
        // now: 100, todo date: 200 -> diff: -100
        var diff = now.getTime() - todoDate.getTime();

        // wenn die Differenz kleiner als eine Minute ist: PUSH
        var oneMinuteInMillis = 60 * 1000;

        // log(diff, oneMinuteInMillis, now, todoDate)
        // log(todo)

        if(diff > 0 && diff < oneMinuteInMillis) {
            logger.cronlog('    ===> FOUND A TASK WHICH IS PAYABLE NOW: ' +
                todo.title + ' LIST: ' + todolist.title);

            // --- find ALL list participants (owner and other invited users)
            User.fetchListParticipants(todolist, function(err, users) {
                if(err) {
                    utils.handleError(err);
                    return false;
                }

                if(!err && users.length > 0) {
                    var pushMessage, pushMessageAPN;

                    users.forEach(function(user) {
                        // soll dieser Benutzer auch wirklich benachrichtigt werden?
                        var userShouldBeNotified =
                            _.indexOf(todo.users_to_notify, (user._id+'')) >= 0;

                        if(userShouldBeNotified) {
                            logger.cronlog('    ===> NOTIFYING USER: ' + user.email +
                                ' about Todo `' + todo.title + '`' +
                                ' settings: ' + JSON.stringify(user.notify_settings));

                            // set i18n locale based on the user's language
                            i18n.setLocale(user.lang);

                            // get the notify message
                            pushMessage    = i18n.__('notificationMailBody', todo.title, todolist.title, todo.notice);

                            // apn extra message - kein html ! -> status 7 - "Invalid payload size"
                            pushMessageAPN = i18n.__('notificationMailBodyAPN', todo.title, todolist.title);

                            // --- 1. "In-APP" via socket IO: IMMER!
                            // socketIOController.pushToUser(user, 'push_notification', {body: pushMessage}, req);

                            // --- 2. via email
                            if(user.notify_settings.email) {
                                utils.sendMail(
                                    config[ENV].ADMIN_EMAIL,
                                    user.email,
                                    i18n.__('notificationMailSubject'),
                                    pushMessage
                                );
                            }

                            // --- 3. Via PUSH
                            application.sendAPN_PUSH(user,  pushMessageAPN);
                            application.send_GCM_PUSH(user, pushMessageAPN);
                        }
                    });
                }
            });
        }

        return false;
    };

    /**
     * Wir laufen im minütlichen Cronjob alle Todos durch, welche
     * nicht abgehakt und in den nächsten paar minuten ablaufen
     */
    Todo.findPayableTodos(true, function(err, todos) {
        if(err) {
            utils.handleError(err);
            return res.send('error');
        }

        if(todos && todos.length > 0) {
            todos.forEach(function(todo) {
                if(todo.date && !todo.completed) {
                    checkDateAndPUSH(todo);
                }
            });
        }
        else {
            logger.cronlog('no tasks found');
        }

        return res.end('done - see the logs');
    });
}

/**
 * The main initializer
 */
function main(conf) {
    config = conf;

    application.setConfig(conf);
    application.initI18n();
    application.setEncryptionSalt(config[ENV].SALT);
    application.initAPNFeedbackPolling();

    mongoose    = db.connectToDatabase(mongoose, config.db[ENV].main);
    app         = express();
    server      = http.createServer(app);

    configureExpress();
    // configureSocketIO(); // muss vor den controller inits passieren!
    registerModels();

    // pass the user model to the application sandbox
    application.setUserModel(mongoose.model('User'));

    registerControllers();

    if(ENV !== 'test') { // dont listen here when testing
        var ipaddr = process.env.OPENSHIFT_NODEJS_IP   || config[ENV].HOST;
        var port   = process.env.OPENSHIFT_NODEJS_PORT || config[ENV].PORT;

        var url = (config[ENV].HTTPS ? 'https://' : 'http://') + ipaddr + ':' + port;

        logger.log('--> trying url: ' + url);

        server.listen(port, ipaddr, function () {
            app.serverUp = true;
        });

        // log a startup message...

        var msg = ('Express server listening on ' + url + ', environment: ' + ENV + ', PID: ').green;
        msg     += (process.pid + '').red;

        logger.log(msg);
        logger.log('loaded config: ' + JSON.stringify(conf[ENV]));

        // CORS OPTIONS FOR API URL
        // see
        // https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS
        app.options(application.apiVersion + '/*', function opts(req, res) {
            // var method = req.method.toLowerCase(); // "options"
            return application.sendDefaultSuccess(req, res, {}, 204);
        });

        /*app.get('/api', function __apiWelcomeMessage(req, res) {
            // return res.json(req.session); // check session lifetime via cookies (not really used)

            // test an error within a request...
            // setTimeout(function() {
            //    throw new Error('HI!!!!!!!!!!!!!!!!! ERROR!!!!');
            // }, 1000);

            // etags for this response
            // res.etagify();

            // testing
            // var i18n = application.getI18nInstance();
            // i18n.setLocale('de'); // 'en'
            // return res.send(i18n.__.apply(i18n, ['listInvitationBody', 'fred', 'listeeeeeeeeeeeee']));

            var msg = 'Welcome to the AtOneGo API v' + pjson.version + '. Environment: ' + ENV;
            return res.json({message: msg}, 200); // hier kein CORS notwendig
        });*/

        // receive client logs (must be authenticated...)
        app.post('/api/v1/logs', application.checkAuth, function __receiveClientLogs(req, res) {
            var message = req.body.m;
            if(message) {
                console.log('||| CLIENT ERROR ||| ' + message);
            }
            return application.sendDefaultSuccess(req, res, {}, 204);
        });

        // endpoint for application usage statistics
        app.get('/stats', function __sendStats(req, res) {
            var mem = process.memoryUsage();
            // convert to MB
            mem.heapTotal = utils.round(mem.heapTotal / 1024.0 / 1024.0);
            mem.heapUsed  = utils.round(mem.heapUsed / 1024.0 / 1024.0);
            mem.rss       = utils.round(mem.rss / 1024.0 / 1024.0) + '(= actual physical RAM)';

            var uptimeH = utils.round(process.uptime() / 60.0 / 60.0);
            var uptimeM = utils.round(process.uptime() / 60.0);

            var json = {
                pid   : process.pid,
                memory: mem,
                uptime: uptimeH + ' hours (= ' + uptimeM + ' minutes)',
                customMsg: 'AtOneGo API v' + pjson.version + ' - Environment: ' + ENV
            };

            return res.json(json, 200);
        });

        if(ENV === 'production') {
            /**
             * The AtOneGo "Cron-Hack" - see .openshift/cron/minutely/atonego.sh
             *
             * Do some pseudo authorization here to "make sure" this request comes from
             * the cronjob shell script
             */
            app.post('/cron874693274924724798uesihrdsbhkjsbsbdsbdybsajbk', function __cronJob(req, res) {
                var KEY1  = conf[ENV].CRONJOB_KEY;
                var KEY2  = conf[ENV].CRONJOB_KEY2;
                var pass1 = req.body.my_awesome_key;
                var pass2 = req.headers['aog-ch'];

                if(KEY1 !== pass1 || KEY2 !== pass2) {
                    return res.json(500, {fuck: 'you'});
                }

                return __doCronJobOnPOST(req, res);
            });
        }
    }

    // used by server tests
    AppEmitter.on('checkApp', function () {
        AppEmitter.emit('getApp', server);
    });
}



// -------------- WORKER --------------

// -- "This is where we put our bugs!"
function initWorker() {
    /**
     * load config and configure express, start listening
     */
    utils.loadConfig(application.PROJECT_ROOT + 'server/config', main);
}


if(!cluster.isMaster) {
    module.exports = {bootApp: initWorker};
}
else {

    // Module can be executed client side for tests (module.parent === true)
    initWorker();

    /**
     * export AppEmitter for external services so that the callback can execute
     * when the app has finished loading the configuration (see /server/test/*)
     */
    module.exports = AppEmitter;
}
