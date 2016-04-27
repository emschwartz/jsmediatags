
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fs = require('fs');

var ChunkedFileData = require('./ChunkedFileData');
var MediaFileReader = require('./MediaFileReader');

var NodeFileReader = function (_MediaFileReader) {
  _inherits(NodeFileReader, _MediaFileReader);

  function NodeFileReader(path) {
    _classCallCheck(this, NodeFileReader);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NodeFileReader).call(this));

    _this._path = path;
    // $FlowIssue - Constructor cannot be called on exports
    _this._fileData = new ChunkedFileData();
    return _this;
  }
  // $FlowIssue - Flow gets confused with module.exports


  _createClass(NodeFileReader, [{
    key: 'getByteAt',
    value: function getByteAt(offset) {
      return this._fileData.getByteAt(offset);
    }
  }, {
    key: '_init',
    value: function _init(callbacks) {
      var self = this;

      fs.stat(self._path, function (err, stats) {
        if (err) {
          if (callbacks.onError) {
            callbacks.onError({ "type": "fs", "info": err });
          }
        } else {
          self._size = stats.size;
          callbacks.onSuccess();
        }
      });
    }
  }, {
    key: 'loadRange',
    value: function loadRange(range, callbacks) {
      var fd = -1;
      var self = this;
      var fileData = this._fileData;

      var length = range[1] - range[0] + 1;
      var onSuccess = callbacks.onSuccess;
      var onError = callbacks.onError || function () {};

      if (fileData.hasDataRange(range[0], range[1])) {
        process.nextTick(onSuccess);
        return;
      }

      var readData = function readData(err, _fd) {
        if (err) {
          onError({ "type": "fs", "info": err });
          return;
        }

        fd = _fd;
        // TODO: Should create a pool of Buffer objects across all instances of
        //       NodeFileReader. This is fine for now.
        var buffer = new Buffer(length);
        fs.read(_fd, buffer, 0, length, range[0], processData);
      };

      var processData = function processData(err, bytesRead, buffer) {
        fs.close(fd, function (err) {
          if (err) {
            console.error(err);
          }
        });

        if (err) {
          onError({ "type": "fs", "info": err });
          return;
        }

        storeBuffer(buffer);
        onSuccess();
      };

      var storeBuffer = function storeBuffer(buffer) {
        var data = Array.prototype.slice.call(buffer, 0, length);
        fileData.addData(range[0], data);
      };

      fs.open(this._path, "r", undefined, readData);
    }
  }], [{
    key: 'canReadFile',
    value: function canReadFile(file) {
      return typeof file === 'string' && !/^[a-z]+:\/\//i.test(file);
    }
  }]);

  return NodeFileReader;
}(MediaFileReader);

module.exports = NodeFileReader;