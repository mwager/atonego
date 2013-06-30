// fork of https://github.com/justspamjustin/junior/blob/master/src/javascripts/junior.js
// June 2013 Michael Wager <mail@mwager.de>

// XXX now - code review and:
//
// "empty page bug"
// Sometimes there will be a blank screen AFTER the transition is
// done (ios device only with phonegap)
//
// Strangly, the empty screen has all elements are clickable/selectable, you can even
// click a button in the header and everything is well again...
// I've tried a lot (js, css, google, stackoverflow...)
//
// Our workaround is currently to wait a bit after the navigation is done before
// we allow the next page navigation because it seems that this empty screen
// comes only when navigating very fast & wild...

define(function(require) {
  'use strict';

  // KEEP IN SYNC WITH junior.css (0.4s animation time)
  // PROBLEM: the problem on real devices is, the animation may not be in
  // sync with our callback:
  //
  //  1. case: animation finished before our callback is done
  //          (or pseudo sync) - ideal case
  //
  //  2. case: our callback gets invoked before the animation has finished
  //        (maybe did not even begin: click on link > js timeout starts but
  //        animation takes some time to start)
  //        -> so this means ths js is fired and will remove the current root
  //        view's el (fromEl), even is the animation did not start or is still
  //        running.
  //
  //  SOLUTION: use "webkitTransitionEnd" event ! (but problem remains)
  // var ANIMATION_TIME = 400;

  var Backbone = require('backbone');
  var $        = require('zepto');
  var _        = require('lodash');
  var app      = require('app');
  var Jr       = Jr || {};

  var $appMain, $appContainer;

  // var CNT = 0, tm;

  // cache relevant dom elements
  $(function() {
    $appMain      = $('#app-main');
    $appContainer = $('#app-container');
  });

  (function(Jr){
    /*not used
    Jr.View = Backbone.View.extend({
      delegateEvents: function(events) {
        var key, newKey, oldValue;
        this.events = this.events || events;
        for (key in this.events) {
          if (key.indexOf('click') === 0) {
            if (Modernizr.touch) {
              newKey = key.replace('click', 'touchend');
              oldValue = this.events[key];
              this.events[newKey] = oldValue;
              delete this.events[key];
            }
          }
        }
        return Backbone.View.prototype.delegateEvents.call(this, this.events);
      }
    });*/

    Jr.Navigator = {
      isAnimating: false,
      backButtonFlag: true,
      history: [],
      directions: {
        UP: 'UP',
        DOWN: 'DOWN',
        LEFT: 'LEFT',
        RIGHT: 'RIGHT'
      },
      opposites: {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT'
      },
      animations: {
        SLIDE_STACK: 'SLIDE_STACK',
        SLIDE_OVER: 'SLIDE_OVER'
      },

      navigate: function(url, opts) {
        // while testing with casper js, this will never end
        if(Jr.Navigator.isAnimating && !app.isPhantomJS) {
          // alert("IS ANIMATING!!! RETURNING. WANT TO GO TO: " + url );
          return false;
        }

        this.history.push(opts);
        this.backButtonFlag = false;
        return Backbone.history.navigate(url, {trigger: true});
      },

      // the main render fn
      renderScreen: function(mainEl, view, touch, done) {
        // $('#app-main').css('overflow-y', 'hidden');

        var newEl,
            animation = this.history.length > 0 ?
              this.history[this.history.length - 1].animation :
              null;

        // transition only on mobile devices !
        if(!touch) {
          animation = null;
        }

        if (animation) {
          newEl = $('<div></div>'); // will be the "#app-main" after the animation is done

          // #1 from junior.js
          // ? this.resetContent(newEl, view);
          // this.normalRenderView(newEl, view);
          // this.animate(mainEl, newEl, animation.type, animation.direction, done);

          // #2 - render after animation started to avoid the delay after
          // touching a link (mostly on real devices...)
          newEl.append(view.render().el);

          this.animate(mainEl, newEl, animation.type, animation.direction, done);

          // note: view.render will render the whole screen including the
          // header, so we want to render after the animation has been started
          // Problem: we see an empty screen for a short time, so we MUST render
          // before the animation starts damnit
          // setTimeout(function() {
          //   view.render();
          // }, 10);

          return this.afterAnimation();
        }
        else {
          this.resetContent(mainEl, view);
          this.normalRenderView(mainEl, view);

          if(typeof done === 'function') {
              done();
          }

          /***** want animations? hmmm thats not mine..
          if(this.history.length === 0) {
            return this.normalRenderView(mainEl, view);
          }
          else if(this.history.length > 0) {
            $appContainer.css('opacity', 0);
            this.normalRenderView(mainEl, view)

            // no animation? use fade in effect
            $appContainer.animate({
                opacity: 1,
                translate3d: '0,0%,0' // XXX?
            }, {
                duration: 300,
                easing: 'ease',
                complete: function() {
                    if(typeof done === 'function') {
                        done();
                    }
                }
            });
          }***/
        }
      },

      normalRenderView: function(mainEl, view) {
        return mainEl.append(view.render().el);
      },
      resetContent: function(mainEl) {
        return mainEl.empty();
      },
      animate: function(fromEl, toEl, type, direction, done) {
        if (this.animations.hasOwnProperty(type)) {
          return this.doAnimation(fromEl, toEl, type, direction, done);
        } else {
          throw new Error('Animation Not Available');
        }
      },

      /**
       * Do the page transition
       * @param  {[type]}   fromEl    The current #app-main
       * @param  {[type]}   toEl      The new container for the next screen (like $('<div></div>'))
       * @param  {[type]}   type      Type
       * @param  {[type]}   direction Direction (LEFT, RIGHT)
       * @param  {Function} done      Callback gets called when anim done
       * @return {[type]}             after anima
       */
      doAnimation: function(fromEl, toEl, type, direction, done) {
        Jr.Navigator.isAnimating = true;

        var start, after;

        // 1. "toEL" will be added and set -100% or 100%,
        // so it is "out of the viewport" (right or left)
        $appContainer.prepend(toEl);
        toEl.addClass('animate-to-view').addClass(direction).addClass('initial');

        // 2. this will start the transition
        $appContainer.addClass('animate').addClass(direction);

        // 3. for the animated header only !
        start = function() {
          return toEl.removeClass('initial');
        };
        setTimeout(start, 1);


        after = function() {
          // alert("NO")
          // BUG: if we remove this here, sometimes there will be an empty screen
          // 1.:
          fromEl.remove();
          // 2.:
          // fromEl.attr('id', 'tmp_' + CNT++).addClass('hidden').addClass('to-be-removed'); // XXX now .remove();
          // fromEl = null;

          toEl.attr('id', 'app-main')
            .removeClass('animate-to-view')
            .removeClass(direction);

          $appContainer.removeClass('animate').removeClass(direction);

          // log('AFTER: --------------->>>>>>>>>>>>>>> ' + $('#app-container').children().length);

          // Jr.Navigator.isAnimating = false;
          // wait a bit before we allow to navitate again
          // to HOPEFULLY FIX the "empty/blank page bug"
          setTimeout(function() {
            Jr.Navigator.isAnimating = false;
          }, 500); // passt

          if(_.isFunction(done)) {
            done();
          }
        };

        // 4. listen for transition end
        // ? this aint in sync with the css animation !
        // and introduces STRANGE BUGS!
        // return setTimeout(after, ANIMATION_TIME);
        // ==> BETTER:
        // SOMETIMES THIS WONT FIRE!?!?!?!? -> "EMPTY SCREEN BUG" )-:
        $appContainer.one('webkitTransitionEnd', after); // or: "transitionend"

        // 5. pre check, avoid "empty page bug"
        // check if averything went nice
        /*if(tm) {
          clearTimeout(tm);
        }
        tm = setTimeout(function __fixEmptyPageBugAfterAnim() {
          $('.to-be-removed').each(function(idx) {
            log("-->>> REMOVING OLD TMP DIV " + idx + ': ' + $(this).attr('id'));
            $(this).remove();
          });

          log(
              $('#app-container').attr('class'),  $('#app-main').attr('class'), // both ""
              $('#app-container').css('class'),   $('#app-main').css('opacity'), // both 1, sometimes 1 0
              $('#app-container').css('z-index'), $('#app-main').css('z-index'), // both auto & ""
              $('#app-container').css('display'), $('#app-main').css('display'), // both auto & ""
              $('#app-container').css('visibility'), $('#app-main').css('visibility'),
              $('#app-container').css('-webkit-backface-visibility'), $('#app-main').css('-webkit-backface-visibility'),
              $('#app-container').css('backface-visibility'), $('#app-main').css('backface-visibility')
          );

          // fix!? no )-:
          $('#app-main').css('opacity', 1);

          // now we can reset this cnt
          CNT = 0;
        }, 2000);*/
      },


      afterAnimation: function() {
        var animation, opposite;
        var lastNavigate = this.history.pop();
        animation = lastNavigate.animation;
        opposite = this.opposites[animation.direction];
        lastNavigate.animation.direction = opposite;
        this.history.push(lastNavigate);
        if(this.backButtonFlag) {
          this.history.pop();
        }
        this.backButtonFlag = true;
      }
    };

    Jr.Router = Backbone.Router.extend({
      renderScreen: function(view, isTouch, fn) {
        // must reload here
        $appMain = $('#app-main');

        return Jr.Navigator.renderScreen($appMain, view, isTouch, fn);
      }
    });
  })(Jr);

  return Jr;
});
