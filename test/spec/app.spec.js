/*
 * This file is part of the AtOneGo project.
 * (c) 2013 Michael Wager <mail@mwager.de>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */

/**
 * Tests für globale Funktionalität und die 'common'-Helperfunktionen.
 *
 * @author Michael Wager <mail@mwager.de>
 */
define('AppSpec', ['underscore', 'app', 'common'], function (_, app, common) {

    'use strict';

    var email, name;

    describe('The `app` object', function () {
        it('should be defined', function () {
            expect(_.isUndefined(app)).to.equal(false);
            expect(typeof app).to.equal('object');
        });

        it('should expose some functionality (public API)', function () {
            expect(_.isUndefined(app.VERSION)).to.equal(false);
            expect(_.isUndefined(app.user)).to.equal(false);
            expect(_.isUndefined(app.isLoggedIn)).to.equal(false);

            expect(_.isFunction(app.initGlobalization)).to.equal(true);
            expect(_.isFunction(app.changeLang)).to.equal(true);
            expect(_.isFunction(app.handleError)).to.equal(true);
            expect(_.isFunction(app.login)).to.equal(true);
        });

        describe('I18next module', function () {
            it('should load language files via ajax', function (done) {
                expect(typeof window.__).to.equal('function');

                // ist hier auch schon geladen
                // expect(__('test', {foo:'bar'})).to.equal('hello bar!');

                // initGlobalization triggers loaded event
                app.on('translationsLoaded', function () {
                    var str = __('test', {foo: 'bar'});
                    expect(str).to.equal('hello bar');

                    // log(str);
                    log('app.lang ist nun: ' + app.lang);

                    done();
                });

                app.initGlobalization();
            });
        });
    });

    describe('Helpers - libs/common.js', function () {
        it('should extend Backbone.Events', function () {
            // expect(common).to.exist;
            expect(_.isUndefined(common)).to.equal(false);

            expect(typeof common.on).to.equal('function');
            expect(typeof common.hasDate).to.equal('function');
            expect(typeof common.dialog).to.equal('function');
        });

        it('should provide a local storage wrapper', function () {
            var store = common.store;
            store.set('test', '123');
            expect(store.get('test')).to.equal('123');
            store.drop('test');
            expect(store.get('test')).to.equal(null);

            // ---------------------------------------------------
            var obj = {
                foo: 'bar'
            };

            store.set('test', JSON.stringify(obj));
            var obj2 = JSON.parse(store.get('test'));
            expect(obj2.foo).to.equal(obj.foo);
            store.drop('test');
            expect(store.get('test')).to.equal(null);
        });

        it('should know valid addresses', function () {
            expect(common.isValidMail('mail@mwager.de')).to.equal(true);
            expect(common.isValidMail('m@mwager.de')).to.equal(true);
            expect(common.isValidMail('m@m.de')).to.equal(true);
            expect(common.isValidMail('hans@example.org')).to.equal(true);
        });

        it('should know invalid addresses', function () {
            expect(common.isValidMail('@mwager.de')).to.equal(false);
            expect(common.isValidMail('@')).to.equal(false);
            expect(common.isValidMail('')).to.equal(false);
            expect(common.isValidMail(null)).to.equal(false);
            expect(common.isValidMail(undefined)).to.equal(false);
        });

        it('parse the name from en email', function () {
            email = 'fred@mwager.de';
            name = common.generateNameFromEmail(email);
            expect(name).to.equal('fred');
        });

        it('should get the name from a valid mail address', function () {
            email = 'fredfdgfdgdf5.fsd.5465@mwager.de';
            name = common.generateNameFromEmail(email);
            expect(name).to.equal('fredfdgfdgdf5.fsd.5465');
        });

        it('should return false if no valid email provided', function () {
            email = 'fredfdgfdgdf5.fsd.5465';
            name = common.generateNameFromEmail(email);
            expect(name).to.equal('---');
        });

        it('should escape strings to prevent XSS stuff', function () {
            expect(common.escape('<')).to.equal('&lt;');
            expect(common.escape('<<')).to.equal('&lt;&lt;');
            expect(common.escape('<<')).to.equal('&lt;&lt;');
            expect(common.escape('>')).to.equal('&gt;');
            expect(common.escape('"')).to.equal('&quot;');
            expect(common.escape('""')).to.equal('&quot;&quot;');
            expect(common.escape('"""')).to.equal('&quot;&quot;&quot;');

            expect(common.escape('\'')).to.equal('&#039;');
            expect(common.escape('\'\'')).to.equal('&#039;&#039;');
            expect(common.escape('\'\'Hallo welt\'')).to.equal('&#039;&#039;Hallo welt&#039;');


            expect(common.escape('<script>')).to.equal('&lt;script&gt;');
            expect(common.escape('<script>alert("XSS");</script>'))
                .to.equal('&lt;script&gt;alert(&quot;XSS&quot;);&lt;/script&gt;');

            expect(common.escape('<script> document.cookie </script>'))
                .to.equal('&lt;script&gt; document.cookie &lt;/script&gt;');
        });

        it('should provide some date helpers using moment.js', function () {
            expect(typeof common.hasDate).to.equal('function');
            var hasDate;
            hasDate = common.hasDate();
            expect(hasDate).to.equal(false);
            hasDate = common.hasDate({});
            expect(hasDate).to.equal(false);
            hasDate = common.hasDate({created_at: '', updated_at: ''});
            expect(hasDate).to.equal(true);


            expect(typeof common.parseDate).to.equal('function');
            var dateParsed;
            dateParsed = common.parseDate(new Date(2013, 4, 1, 8, 0), 'de');
            expect(dateParsed).to.equal('01.05.2013 08:00');

            dateParsed = common.parseDate(new Date(2013, 4, 1, 8, 0), 'en');
            expect(dateParsed).to.equal('05/01/2013 8:00 AM');


            expect(typeof common.fromNow).to.equal('function');
            expect(typeof common.now).to.equal('function');
            expect(typeof common.diffInDaysFromNowTo).to.equal('function');
        });

        it('should FORMAT dates in all supported languages', function () {
            var parser;

            // --- test german formatting
            parser = common.getDateParser('de');

            expect(parser.format(new Date(2013, 5, 3))).to.equal('03.06.2013 00:00');
            expect(parser.format(new Date(2012, 1, 29))).to.equal('29.02.2012 00:00');
            expect(parser.format(new Date(1986, 11, 1, 8, 13))).to.equal('01.12.1986 08:13');
            expect(parser.format(new Date(1986, 11, 1, 18, 45))).to.equal('01.12.1986 18:45');

            expect(parser.format(new Date(1986, 11, 1, 12, 15))).to.equal('01.12.1986 12:15');

            // --- test english formatting
            parser = common.getDateParser('en');

            expect(parser.format(new Date(2013, 5, 3))).to.equal('06/03/2013 00:00 AM');
            expect(parser.format(new Date(2012, 1, 29))).to.equal('02/29/2012 00:00 AM');
            expect(parser.format(new Date(1986, 11, 1, 8, 13))).to.equal('12/01/1986 08:13 AM');
            expect(parser.format(new Date(1986, 11, 1, 18, 45))).to.equal('12/01/1986 06:45 PM');

            // 12:15 uhr muss 00:15 PM sein !
            expect(parser.format(new Date(1986, 11, 1, 12, 15))).to.equal('12/01/1986 00:15 PM');
        });

        it('should PARSE dates in all supported languages', function () {
            var parser, dateExpected, date;

            // --- test german parsing
            parser = common.getDateParser('de');

            dateExpected = new Date(2013, 5, 3);
            date = parser.parse('03.06.2013 00:00');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(2012, 1, 29);
            date = parser.parse('29.02.2012 00:00');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 8, 13);
            date = parser.parse('01.12.1986 08:13');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 18, 45);
            date = parser.parse('01.12.1986 18:45');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 12, 15);
            date = parser.parse('01.12.1986 12:15');
            expect(date.getTime()).to.equal(dateExpected.getTime());


            // --- test english formatting
            parser = common.getDateParser('en');

            dateExpected = new Date(2013, 5, 3, 0, 0);
            date = parser.parse('06/03/2013 00:00 AM');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(2013, 5, 3,  12, 0);
            date = parser.parse('06/03/2013 00:00 PM');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(2012, 1, 29);
            date = parser.parse('02/29/2012 00:00 AM');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 8, 13);
            date = parser.parse('12/01/1986 08:13 AM');
            expect(date.getTime()).to.equal(dateExpected.getTime());
            // PM:
            dateExpected = new Date(1986, 11, 1, 20, 13);
            date = parser.parse('12/01/1986 08:13 PM');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 18, 45);
            date = parser.parse('12/01/1986 06:45 PM');
            expect(date.getTime()).to.equal(dateExpected.getTime());

            dateExpected = new Date(1986, 11, 1, 12, 15);
            date = parser.parse('12/01/1986 00:15 PM');
            expect(date.getTime()).to.equal(dateExpected.getTime());
        });
    });


    describe('Off Topic', function () {
        it('How to break Underscore\'s each() loop? Not possible, you must use ' +
            '_.find -> should return true to break it', function () {

            var i = 0,
                arr = [1, 2, 3, 4, 5];

            // 1. javascript break
            while (i++ < 10) {
                if (i === 2) {
                    break;
                }
            }
            expect(i).to.equal(2);

            // 2. Underscore's each()
            // EDIT: from the underscore docs:
            // "It's also good to note that an each loop cannot be broken out
            // of — to break, use _.find instead."
            i = 0;
            _.find(arr, function (a) {
                i = a;

                // since 1.6 not possible anymore? damn... use _.find!
                if (a === 2) {
                    return true; // -> breaks loop
                }
            });

            expect(i).to.equal(2);
        });
    });
});
