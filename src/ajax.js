import {parse as parseURL, format as formatURL} from './url';
import { config } from './config';
import Promise from 'promise-polyfill';

var utils = require('./utils');

const XHR_DONE = 4;

/**
 * Simple IE9+ and cross-browser ajax request function
 * Note: x-domain requests in IE9 do not support the use of cookies
 *
 * @param url string url
 * @param callback {object | function} callback
 * @param data mixed data
 * @param options object
 */
export const ajax = ajaxBuilder();

export function ajaxBuilder(timeout = 3000, {request, done} = {}) {
  return function(url, callback, data, options = {}) {
    try {
      let x;
      let method = options.method || (data ? 'POST' : 'GET');
      let parser = document.createElement('a');
      parser.href = url;

      let callbacks = typeof callback === 'object' && callback !== null ? callback : {
        success: function() {
          utils.logMessage('xhr success');
        },
        error: function(e) {
          utils.logError('xhr error', null, e);
        }
      };

      if (typeof callback === 'function') {
        callbacks.success = callback;
      }

      x = new window.XMLHttpRequest();
      done(parser.origin);
      callbacks.success(x.responseText, x);
      return;
      x.onreadystatechange = function () {
        if (x.readyState === XHR_DONE) {
          if (typeof done === 'function') {
            done(parser.origin);
          }
          let status = x.status;
          if ((status >= 200 && status < 300) || status === 304) {
          } else {
            callbacks.error(x.statusText, x);
          }
        }
      };

      // Disabled timeout temporarily to avoid xhr failed requests. https://github.com/prebid/Prebid.js/issues/2648
      if (!config.getConfig('disableAjaxTimeout')) {
        x.ontimeout = function () {
          utils.logError('  xhr timeout after ', x.timeout, 'ms');
        };
      }

      if (method === 'GET' && data) {
        let urlInfo = parseURL(url, options);
        Object.assign(urlInfo.search, data);
        url = formatURL(urlInfo);
      }

      x.open(method, url, true);
      // IE needs timoeut to be set after open - see #1410
      // Disabled timeout temporarily to avoid xhr failed requests. https://github.com/prebid/Prebid.js/issues/2648
      if (!config.getConfig('disableAjaxTimeout')) {
        x.timeout = timeout;
      }

      if (options.withCredentials) {
        x.withCredentials = true;
      }
      utils._each(options.customHeaders, (value, header) => {
        x.setRequestHeader(header, value);
      });
      if (options.preflight) {
        x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }
      x.setRequestHeader('Content-Type', options.contentType || 'text/plain');

      if (typeof request === 'function') {
        request(parser.origin);
      }

      // if (method === 'POST' && data) {
      //   x.send(data);
      // } else {
      //   x.send();
      // }
    } catch (error) {
      utils.logError('xhr construction', error);
    }
  }
}

export function ajaxBuilderPromise(timeout = 3000, {request} = {}) {
  return function(url, data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        let x;
        let method = options.method || (data ? 'POST' : 'GET');
        let parser = document.createElement('a');
        parser.href = url;

        x = new window.XMLHttpRequest();
        resolve(x);
        x.onreadystatechange = function () {
          if (x.readyState === XHR_DONE) {
            let status = x.status;
            if ((status >= 200 && status < 300) || status === 304) {
              console.log('x:::', JSON.stringify(x));
              resolve(x);
            } else {
              reject(x.statusText);
            }
          }
        };
        
        // Disabled timeout temporarily to avoid xhr failed requests. https://github.com/prebid/Prebid.js/issues/2648
        if (!config.getConfig('disableAjaxTimeout')) {
          x.ontimeout = function () {
            utils.logError('  xhr timeout after ', x.timeout, 'ms');
          };
        }
  
        if (method === 'GET' && data) {
          let urlInfo = parseURL(url, options);
          Object.assign(urlInfo.search, data);
          url = formatURL(urlInfo);
        }
  
        x.open(method, url, true);
        // IE needs timoeut to be set after open - see #1410
        // Disabled timeout temporarily to avoid xhr failed requests. https://github.com/prebid/Prebid.js/issues/2648
        if (!config.getConfig('disableAjaxTimeout')) {
          x.timeout = timeout;
        }
  
        if (options.withCredentials) {
          x.withCredentials = true;
        }
        utils._each(options.customHeaders, (value, header) => {
          x.setRequestHeader(header, value);
        });
        if (options.preflight) {
          x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        }
        x.setRequestHeader('Content-Type', options.contentType || 'text/plain');
  
        if (typeof request === 'function') {
          request(parser.origin);
        }
  
        // if (method === 'POST' && data) {
        //   x.send(data);
        // } else {
        //   x.send();
        // }
      } catch (error) {
        utils.logError('xhr construction', error);
      }
    });
  }
}