/**
 * This is only used for testing, but could be used for other purposes as
 * writing.
 *
 * http://atomicparsley.sourceforge.net/mpeg-4files.html
 *
 * 
 */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ByteArrayUtils = require('./ByteArrayUtils');
var bin = ByteArrayUtils.bin;
var pad = ByteArrayUtils.pad;
var getInteger32 = ByteArrayUtils.getInteger32;

var MP4TagContents = function () {
  function MP4TagContents(ftyp, atoms) {
    _classCallCheck(this, MP4TagContents);

    this._atoms = [new Atom("ftyp", pad(bin(ftyp), 24))].concat(atoms || []);
  }

  _createClass(MP4TagContents, [{
    key: 'toArray',
    value: function toArray() {
      return this._atoms.reduce(function (array, atom) {
        return array.concat(atom.toArray());
      }, []);
    }
  }], [{
    key: 'createAtom',
    value: function createAtom(atomName) {
      return new Atom(atomName);
    }
  }, {
    key: 'createContainerAtom',
    value: function createContainerAtom(atomName, atoms, data) {
      return new Atom(atomName, data, atoms);
    }
  }, {
    key: 'createMetadataAtom',
    value: function createMetadataAtom(atomName, type, data) {
      var klass = {
        "uint8": 0,
        "uint8b": 21, // Apple changed from 21 to 0 in latest versions
        "text": 1,
        "jpeg": 13,
        "png": 14
      }[type];

      return this.createContainerAtom(atomName, [new Atom("data", [].concat([0x00, 0x00, 0x00, klass], // 1 byte atom version + 3 byte atom flags
      [0x00, 0x00, 0x00, 0x00], // NULL space
      data))]);
    }
  }]);

  return MP4TagContents;
}();

var Atom = function () {
  function Atom(name, data, atoms) {
    _classCallCheck(this, Atom);

    this._name = name;
    this._data = data || [];
    this._atoms = atoms || [];
  }

  _createClass(Atom, [{
    key: 'toArray',
    value: function toArray() {
      var atomsArray = this._atoms.reduce(function (array, atom) {
        return array.concat(atom.toArray());
      }, []);
      var length = 4 + this._name.length + this._data.length + atomsArray.length;

      return [].concat(getInteger32(length), bin(this._name), this._data, atomsArray);
    }
  }]);

  return Atom;
}();

module.exports = MP4TagContents;