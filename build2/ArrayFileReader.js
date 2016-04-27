
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MediaFileReader = require('./MediaFileReader');

var ArrayFileReader = function (_MediaFileReader) {
  _inherits(ArrayFileReader, _MediaFileReader);

  function ArrayFileReader(array) {
    _classCallCheck(this, ArrayFileReader);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ArrayFileReader).call(this));

    _this._array = array;
    _this._size = array.length;
    _this._isInitialized = true;
    return _this;
  }

  _createClass(ArrayFileReader, [{
    key: 'init',
    value: function init(callbacks) {
      setTimeout(callbacks.onSuccess, 0);
    }
  }, {
    key: 'loadRange',
    value: function loadRange(range, callbacks) {
      setTimeout(callbacks.onSuccess, 0);
    }
  }, {
    key: 'getByteAt',
    value: function getByteAt(offset) {
      return this._array[offset];
    }
  }], [{
    key: 'canReadFile',
    value: function canReadFile(file) {
      return Array.isArray(file) || typeof Buffer === 'function' && Buffer.isBuffer(file);
    }
  }]);

  return ArrayFileReader;
}(MediaFileReader);

module.exports = ArrayFileReader;