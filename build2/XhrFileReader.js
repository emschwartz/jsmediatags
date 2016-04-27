
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ChunkedFileData = require('./ChunkedFileData');
var MediaFileReader = require('./MediaFileReader');

var CHUNK_SIZE = 1024;

var XhrFileReader = function (_MediaFileReader) {
  _inherits(XhrFileReader, _MediaFileReader);

  function XhrFileReader(url) {
    _classCallCheck(this, XhrFileReader);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(XhrFileReader).call(this));

    _this._url = url;
    // $FlowIssue - Constructor cannot be called on exports
    _this._fileData = new ChunkedFileData();
    return _this;
  }
  // $FlowIssue - Flow gets confused with module.exports


  _createClass(XhrFileReader, [{
    key: '_init',
    value: function _init(callbacks) {
      if (XhrFileReader._config.avoidHeadRequests) {
        this._fetchSizeWithGetRequest(callbacks);
      } else {
        this._fetchSizeWithHeadRequest(callbacks);
      }
    }
  }, {
    key: '_fetchSizeWithHeadRequest',
    value: function _fetchSizeWithHeadRequest(callbacks) {
      var self = this;

      this._makeXHRRequest("HEAD", null, {
        onSuccess: function onSuccess(xhr) {
          var contentLength = self._parseContentLength(xhr);
          if (contentLength) {
            self._size = contentLength;
            callbacks.onSuccess();
          } else {
            // Content-Length not provided by the server, fallback to
            // GET requests.
            self._fetchSizeWithGetRequest(callbacks);
          }
        },
        onError: callbacks.onError
      });
    }
  }, {
    key: '_fetchSizeWithGetRequest',
    value: function _fetchSizeWithGetRequest(callbacks) {
      var self = this;
      var range = this._roundRangeToChunkMultiple([0, 0]);

      this._makeXHRRequest("GET", range, {
        onSuccess: function onSuccess(xhr) {
          var contentRange = self._parseContentRange(xhr);
          var data = self._getXhrResponseContent(xhr);

          if (contentRange) {
            if (contentRange.instanceLength == null) {
              // Last resort, server is not able to tell us the content length,
              // need to fetch entire file then.
              self._fetchEntireFile(callbacks);
              return;
            }
            self._size = contentRange.instanceLength;
          } else {
            // Range request not supported, we got the entire file
            self._size = data.length;
          }

          self._fileData.addData(0, data);
          callbacks.onSuccess();
        },
        onError: callbacks.onError
      });
    }
  }, {
    key: '_fetchEntireFile',
    value: function _fetchEntireFile(callbacks) {
      var self = this;
      this._makeXHRRequest("GET", null, {
        onSuccess: function onSuccess(xhr) {
          var data = self._getXhrResponseContent(xhr);
          self._size = data.length;
          self._fileData.addData(0, data);
          callbacks.onSuccess();
        },
        onError: callbacks.onError
      });
    }
  }, {
    key: '_getXhrResponseContent',
    value: function _getXhrResponseContent(xhr) {
      return xhr.responseBody || xhr.responseText || "";
    }
  }, {
    key: '_parseContentLength',
    value: function _parseContentLength(xhr) {
      var contentLength = this._getResponseHeader(xhr, "Content-Length");

      if (contentLength == null) {
        return contentLength;
      } else {
        return parseInt(contentLength, 10);
      }
    }
  }, {
    key: '_parseContentRange',
    value: function _parseContentRange(xhr) {
      var contentRange = this._getResponseHeader(xhr, "Content-Range");

      if (contentRange) {
        var parsedContentRange = contentRange.match(/bytes (\d+)-(\d+)\/(?:(\d+)|\*)/i);
        if (!parsedContentRange) {
          throw new Error("FIXME: Unknown Content-Range syntax: ", contentRange);
        }

        return {
          firstBytePosition: parseInt(parsedContentRange[1], 10),
          lastBytePosition: parseInt(parsedContentRange[2], 10),
          instanceLength: parsedContentRange[3] ? parseInt(parsedContentRange[3], 10) : null
        };
      } else {
        return null;
      }
    }
  }, {
    key: 'loadRange',
    value: function loadRange(range, callbacks) {
      var self = this;

      if (self._fileData.hasDataRange(range[0], range[1])) {
        setTimeout(callbacks.onSuccess, 1);
        return;
      }

      // Always download in multiples of CHUNK_SIZE. If we're going to make a
      // request might as well get a chunk that makes sense. The big cost is
      // establishing the connection so getting 10bytes or 1K doesn't really
      // make a difference.
      range = this._roundRangeToChunkMultiple(range);

      this._makeXHRRequest("GET", range, {
        onSuccess: function onSuccess(xhr) {
          var data = self._getXhrResponseContent(xhr);
          self._fileData.addData(range[0], data);
          callbacks.onSuccess();
        },
        onError: callbacks.onError
      });
    }
  }, {
    key: '_roundRangeToChunkMultiple',
    value: function _roundRangeToChunkMultiple(range) {
      var length = range[1] - range[0] + 1;
      var newLength = Math.ceil(length / CHUNK_SIZE) * CHUNK_SIZE;
      return [range[0], range[0] + newLength - 1];
    }
  }, {
    key: '_makeXHRRequest',
    value: function _makeXHRRequest(method, range, callbacks) {
      var xhr = this._createXHRObject();

      var onXHRLoad = function onXHRLoad() {
        // 200 - OK
        // 206 - Partial Content
        if (xhr.status === 200 || xhr.status === 206) {
          callbacks.onSuccess(xhr);
        } else if (callbacks.onError) {
          callbacks.onError({
            "type": "xhr",
            // $FlowIssue - xhr will not be null here
            "info": "Unexpected HTTP status " + xhr.status + ".",
            "xhr": xhr
          });
        }
        xhr = null;
      };

      if (typeof xhr.onload !== 'undefined') {
        xhr.onload = onXHRLoad;
        xhr.onerror = function () {
          if (callbacks.onError) {
            callbacks.onError({
              "type": "xhr",
              "info": "Generic XHR error, check xhr object.",
              "xhr": xhr
            });
          }
        };
      } else {
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            onXHRLoad();
          }
        };
      }

      xhr.open(method, this._url);
      xhr.overrideMimeType("text/plain; charset=x-user-defined");
      if (range) {
        this._setRequestHeader(xhr, "Range", "bytes=" + range[0] + "-" + range[1]);
      }
      this._setRequestHeader(xhr, "If-Modified-Since", "Sat, 01 Jan 1970 00:00:00 GMT");
      xhr.send(null);
    }
  }, {
    key: '_setRequestHeader',
    value: function _setRequestHeader(xhr, headerName, headerValue) {
      if (XhrFileReader._config.disallowedXhrHeaders.indexOf(headerName.toLowerCase()) < 0) {
        xhr.setRequestHeader(headerName, headerValue);
      }
    }
  }, {
    key: '_hasResponseHeader',
    value: function _hasResponseHeader(xhr, headerName) {
      var allResponseHeaders = xhr.getAllResponseHeaders();

      if (!allResponseHeaders) {
        return false;
      }

      var headers = allResponseHeaders.split("\r\n");
      var headerNames = [];
      for (var i = 0; i < headers.length; i++) {
        headerNames[i] = headers[i].split(":")[0].toLowerCase();
      }

      return headerNames.indexOf(headerName.toLowerCase()) >= 0;
    }
  }, {
    key: '_getResponseHeader',
    value: function _getResponseHeader(xhr, headerName) {
      if (!this._hasResponseHeader(xhr, headerName)) {
        return null;
      }

      return xhr.getResponseHeader(headerName);
    }
  }, {
    key: 'getByteAt',
    value: function getByteAt(offset) {
      var character = this._fileData.getByteAt(offset);
      return character.charCodeAt(0) & 0xff;
    }
  }, {
    key: '_createXHRObject',
    value: function _createXHRObject() {
      if (typeof window === "undefined") {
        // $FlowIssue - flow is not able to recognize this module.
        return new (require("xhr2").XMLHttpRequest)();
      }

      if (window.XMLHttpRequest) {
        return new window.XMLHttpRequest();
      }

      throw new Error("XMLHttpRequest is not supported");
    }
  }], [{
    key: 'canReadFile',
    value: function canReadFile(file) {
      return typeof file === 'string' && /^[a-z]+:\/\//i.test(file);
    }
  }, {
    key: 'setConfig',
    value: function setConfig(config) {
      for (var key in config) {
        if (config.hasOwnProperty(key)) {
          this._config[key] = config[key];
        }
      }var disallowedXhrHeaders = this._config.disallowedXhrHeaders;
      for (var i = 0; i < disallowedXhrHeaders.length; i++) {
        disallowedXhrHeaders[i] = disallowedXhrHeaders[i].toLowerCase();
      }
    }
  }]);

  return XhrFileReader;
}(MediaFileReader);

XhrFileReader._config = {
  avoidHeadRequests: false,
  disallowedXhrHeaders: []
};

module.exports = XhrFileReader;