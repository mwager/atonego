'use strict';

module.exports = {
  /**
  * Creates a base-64 encoded ASCII string from a "string" of binary data
  * using the browser's native function window.btoa()
  *
  * @see https://developer.mozilla.org/en-US/docs/Web/API/window.btoa
  */
  base64Encode: function(val) {
    if(!window.btoa) {
      throw 'Native Base64 encoding not supported in this browser';
    }

    if(typeof val !== 'string') {
      throw 'Base64 encoding - no string: ' + val;
    }

    // without Unicode support:
    // var encodedData = window.btoa(val);

    // with Unicode support:
    var encodedData = window.btoa(window.unescape(encodeURIComponent( val )));

    return encodedData;
  }
};
