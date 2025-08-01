(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/fft.js/lib/fft.js
  var require_fft = __commonJS({
    "node_modules/fft.js/lib/fft.js"(exports, module) {
      "use strict";
      function FFT2(size) {
        this.size = size | 0;
        if (this.size <= 1 || (this.size & this.size - 1) !== 0)
          throw new Error("FFT size must be a power of two and bigger than 1");
        this._csize = size << 1;
        var table = new Array(this.size * 2);
        for (var i = 0; i < table.length; i += 2) {
          const angle = Math.PI * i / this.size;
          table[i] = Math.cos(angle);
          table[i + 1] = -Math.sin(angle);
        }
        this.table = table;
        var power = 0;
        for (var t = 1; this.size > t; t <<= 1)
          power++;
        this._width = power % 2 === 0 ? power - 1 : power;
        this._bitrev = new Array(1 << this._width);
        for (var j = 0; j < this._bitrev.length; j++) {
          this._bitrev[j] = 0;
          for (var shift = 0; shift < this._width; shift += 2) {
            var revShift = this._width - shift - 2;
            this._bitrev[j] |= (j >>> shift & 3) << revShift;
          }
        }
        this._out = null;
        this._data = null;
        this._inv = 0;
      }
      module.exports = FFT2;
      FFT2.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
        var res = storage || new Array(complex.length >>> 1);
        for (var i = 0; i < complex.length; i += 2)
          res[i >>> 1] = complex[i];
        return res;
      };
      FFT2.prototype.createComplexArray = function createComplexArray() {
        const res = new Array(this._csize);
        for (var i = 0; i < res.length; i++)
          res[i] = 0;
        return res;
      };
      FFT2.prototype.toComplexArray = function toComplexArray(input, storage) {
        var res = storage || this.createComplexArray();
        for (var i = 0; i < res.length; i += 2) {
          res[i] = input[i >>> 1];
          res[i + 1] = 0;
        }
        return res;
      };
      FFT2.prototype.completeSpectrum = function completeSpectrum(spectrum) {
        var size = this._csize;
        var half = size >>> 1;
        for (var i = 2; i < half; i += 2) {
          spectrum[size - i] = spectrum[i];
          spectrum[size - i + 1] = -spectrum[i + 1];
        }
      };
      FFT2.prototype.transform = function transform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 0;
        this._transform4();
        this._out = null;
        this._data = null;
      };
      FFT2.prototype.realTransform = function realTransform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 0;
        this._realTransform4();
        this._out = null;
        this._data = null;
      };
      FFT2.prototype.inverseTransform = function inverseTransform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 1;
        this._transform4();
        for (var i = 0; i < out.length; i++)
          out[i] /= this.size;
        this._out = null;
        this._data = null;
      };
      FFT2.prototype._transform4 = function _transform4() {
        var out = this._out;
        var size = this._csize;
        var width = this._width;
        var step = 1 << width;
        var len = size / step << 1;
        var outOff;
        var t;
        var bitrev = this._bitrev;
        if (len === 4) {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleTransform2(outOff, off, step);
          }
        } else {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleTransform4(outOff, off, step);
          }
        }
        var inv = this._inv ? -1 : 1;
        var table = this.table;
        for (step >>= 2; step >= 2; step >>= 2) {
          len = size / step << 1;
          var quarterLen = len >>> 2;
          for (outOff = 0; outOff < size; outOff += len) {
            var limit = outOff + quarterLen;
            for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
              const A = i;
              const B = A + quarterLen;
              const C = B + quarterLen;
              const D = C + quarterLen;
              const Ar = out[A];
              const Ai = out[A + 1];
              const Br = out[B];
              const Bi = out[B + 1];
              const Cr = out[C];
              const Ci = out[C + 1];
              const Dr = out[D];
              const Di = out[D + 1];
              const MAr = Ar;
              const MAi = Ai;
              const tableBr = table[k];
              const tableBi = inv * table[k + 1];
              const MBr = Br * tableBr - Bi * tableBi;
              const MBi = Br * tableBi + Bi * tableBr;
              const tableCr = table[2 * k];
              const tableCi = inv * table[2 * k + 1];
              const MCr = Cr * tableCr - Ci * tableCi;
              const MCi = Cr * tableCi + Ci * tableCr;
              const tableDr = table[3 * k];
              const tableDi = inv * table[3 * k + 1];
              const MDr = Dr * tableDr - Di * tableDi;
              const MDi = Dr * tableDi + Di * tableDr;
              const T0r = MAr + MCr;
              const T0i = MAi + MCi;
              const T1r = MAr - MCr;
              const T1i = MAi - MCi;
              const T2r = MBr + MDr;
              const T2i = MBi + MDi;
              const T3r = inv * (MBr - MDr);
              const T3i = inv * (MBi - MDi);
              const FAr = T0r + T2r;
              const FAi = T0i + T2i;
              const FCr = T0r - T2r;
              const FCi = T0i - T2i;
              const FBr = T1r + T3i;
              const FBi = T1i - T3r;
              const FDr = T1r - T3i;
              const FDi = T1i + T3r;
              out[A] = FAr;
              out[A + 1] = FAi;
              out[B] = FBr;
              out[B + 1] = FBi;
              out[C] = FCr;
              out[C + 1] = FCi;
              out[D] = FDr;
              out[D + 1] = FDi;
            }
          }
        }
      };
      FFT2.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const evenR = data[off];
        const evenI = data[off + 1];
        const oddR = data[off + step];
        const oddI = data[off + step + 1];
        const leftR = evenR + oddR;
        const leftI = evenI + oddI;
        const rightR = evenR - oddR;
        const rightI = evenI - oddI;
        out[outOff] = leftR;
        out[outOff + 1] = leftI;
        out[outOff + 2] = rightR;
        out[outOff + 3] = rightI;
      };
      FFT2.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const inv = this._inv ? -1 : 1;
        const step2 = step * 2;
        const step3 = step * 3;
        const Ar = data[off];
        const Ai = data[off + 1];
        const Br = data[off + step];
        const Bi = data[off + step + 1];
        const Cr = data[off + step2];
        const Ci = data[off + step2 + 1];
        const Dr = data[off + step3];
        const Di = data[off + step3 + 1];
        const T0r = Ar + Cr;
        const T0i = Ai + Ci;
        const T1r = Ar - Cr;
        const T1i = Ai - Ci;
        const T2r = Br + Dr;
        const T2i = Bi + Di;
        const T3r = inv * (Br - Dr);
        const T3i = inv * (Bi - Di);
        const FAr = T0r + T2r;
        const FAi = T0i + T2i;
        const FBr = T1r + T3i;
        const FBi = T1i - T3r;
        const FCr = T0r - T2r;
        const FCi = T0i - T2i;
        const FDr = T1r - T3i;
        const FDi = T1i + T3r;
        out[outOff] = FAr;
        out[outOff + 1] = FAi;
        out[outOff + 2] = FBr;
        out[outOff + 3] = FBi;
        out[outOff + 4] = FCr;
        out[outOff + 5] = FCi;
        out[outOff + 6] = FDr;
        out[outOff + 7] = FDi;
      };
      FFT2.prototype._realTransform4 = function _realTransform4() {
        var out = this._out;
        var size = this._csize;
        var width = this._width;
        var step = 1 << width;
        var len = size / step << 1;
        var outOff;
        var t;
        var bitrev = this._bitrev;
        if (len === 4) {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
          }
        } else {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
          }
        }
        var inv = this._inv ? -1 : 1;
        var table = this.table;
        for (step >>= 2; step >= 2; step >>= 2) {
          len = size / step << 1;
          var halfLen = len >>> 1;
          var quarterLen = halfLen >>> 1;
          var hquarterLen = quarterLen >>> 1;
          for (outOff = 0; outOff < size; outOff += len) {
            for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
              var A = outOff + i;
              var B = A + quarterLen;
              var C = B + quarterLen;
              var D = C + quarterLen;
              var Ar = out[A];
              var Ai = out[A + 1];
              var Br = out[B];
              var Bi = out[B + 1];
              var Cr = out[C];
              var Ci = out[C + 1];
              var Dr = out[D];
              var Di = out[D + 1];
              var MAr = Ar;
              var MAi = Ai;
              var tableBr = table[k];
              var tableBi = inv * table[k + 1];
              var MBr = Br * tableBr - Bi * tableBi;
              var MBi = Br * tableBi + Bi * tableBr;
              var tableCr = table[2 * k];
              var tableCi = inv * table[2 * k + 1];
              var MCr = Cr * tableCr - Ci * tableCi;
              var MCi = Cr * tableCi + Ci * tableCr;
              var tableDr = table[3 * k];
              var tableDi = inv * table[3 * k + 1];
              var MDr = Dr * tableDr - Di * tableDi;
              var MDi = Dr * tableDi + Di * tableDr;
              var T0r = MAr + MCr;
              var T0i = MAi + MCi;
              var T1r = MAr - MCr;
              var T1i = MAi - MCi;
              var T2r = MBr + MDr;
              var T2i = MBi + MDi;
              var T3r = inv * (MBr - MDr);
              var T3i = inv * (MBi - MDi);
              var FAr = T0r + T2r;
              var FAi = T0i + T2i;
              var FBr = T1r + T3i;
              var FBi = T1i - T3r;
              out[A] = FAr;
              out[A + 1] = FAi;
              out[B] = FBr;
              out[B + 1] = FBi;
              if (i === 0) {
                var FCr = T0r - T2r;
                var FCi = T0i - T2i;
                out[C] = FCr;
                out[C + 1] = FCi;
                continue;
              }
              if (i === hquarterLen)
                continue;
              var ST0r = T1r;
              var ST0i = -T1i;
              var ST1r = T0r;
              var ST1i = -T0i;
              var ST2r = -inv * T3i;
              var ST2i = -inv * T3r;
              var ST3r = -inv * T2i;
              var ST3i = -inv * T2r;
              var SFAr = ST0r + ST2r;
              var SFAi = ST0i + ST2i;
              var SFBr = ST1r + ST3i;
              var SFBi = ST1i - ST3r;
              var SA = outOff + quarterLen - i;
              var SB = outOff + halfLen - i;
              out[SA] = SFAr;
              out[SA + 1] = SFAi;
              out[SB] = SFBr;
              out[SB + 1] = SFBi;
            }
          }
        }
      };
      FFT2.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const evenR = data[off];
        const oddR = data[off + step];
        const leftR = evenR + oddR;
        const rightR = evenR - oddR;
        out[outOff] = leftR;
        out[outOff + 1] = 0;
        out[outOff + 2] = rightR;
        out[outOff + 3] = 0;
      };
      FFT2.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const inv = this._inv ? -1 : 1;
        const step2 = step * 2;
        const step3 = step * 3;
        const Ar = data[off];
        const Br = data[off + step];
        const Cr = data[off + step2];
        const Dr = data[off + step3];
        const T0r = Ar + Cr;
        const T1r = Ar - Cr;
        const T2r = Br + Dr;
        const T3r = inv * (Br - Dr);
        const FAr = T0r + T2r;
        const FBr = T1r;
        const FBi = -T3r;
        const FCr = T0r - T2r;
        const FDr = T1r;
        const FDi = T3r;
        out[outOff] = FAr;
        out[outOff + 1] = 0;
        out[outOff + 2] = FBr;
        out[outOff + 3] = FBi;
        out[outOff + 4] = FCr;
        out[outOff + 5] = 0;
        out[outOff + 6] = FDr;
        out[outOff + 7] = FDi;
      };
    }
  });

  // node_modules/pitchy/index.js
  var import_fft = __toESM(require_fft(), 1);
  var Autocorrelator = class _Autocorrelator {
    /** @private @readonly @type {number} */
    _inputLength;
    /** @private @type {FFT} */
    _fft;
    /** @private @type {(size: number) => T} */
    _bufferSupplier;
    /** @private @type {T} */
    _paddedInputBuffer;
    /** @private @type {T} */
    _transformBuffer;
    /** @private @type {T} */
    _inverseBuffer;
    /**
     * A helper method to create an {@link Autocorrelator} using
     * {@link Float32Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<Float32Array>}
     */
    static forFloat32Array(inputLength) {
      return new _Autocorrelator(
        inputLength,
        (length) => new Float32Array(length)
      );
    }
    /**
     * A helper method to create an {@link Autocorrelator} using
     * {@link Float64Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<Float64Array>}
     */
    static forFloat64Array(inputLength) {
      return new _Autocorrelator(
        inputLength,
        (length) => new Float64Array(length)
      );
    }
    /**
     * A helper method to create an {@link Autocorrelator} using `number[]`
     * buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<number[]>}
     */
    static forNumberArray(inputLength) {
      return new _Autocorrelator(inputLength, (length) => Array(length));
    }
    /**
     * Constructs a new {@link Autocorrelator} able to handle input arrays of the
     * given length.
     *
     * @param inputLength {number} the input array length to support. This
     * `Autocorrelator` will only support operation on arrays of this length.
     * @param bufferSupplier {(length: number) => T} the function to use for
     * creating buffers, accepting the length of the buffer to create and
     * returning a new buffer of that length. The values of the returned buffer
     * need not be initialized in any particular way.
     */
    constructor(inputLength, bufferSupplier) {
      if (inputLength < 1) {
        throw new Error(`Input length must be at least one`);
      }
      this._inputLength = inputLength;
      this._fft = new import_fft.default(ceilPow2(2 * inputLength));
      this._bufferSupplier = bufferSupplier;
      this._paddedInputBuffer = this._bufferSupplier(this._fft.size);
      this._transformBuffer = this._bufferSupplier(2 * this._fft.size);
      this._inverseBuffer = this._bufferSupplier(2 * this._fft.size);
    }
    /**
     * Returns the supported input length.
     *
     * @returns {number} the supported input length
     */
    get inputLength() {
      return this._inputLength;
    }
    /**
     * Autocorrelates the given input data.
     *
     * @param input {ArrayLike<number>} the input data to autocorrelate
     * @param output {T} the output buffer into which to write the autocorrelated
     * data. If not provided, a new buffer will be created.
     * @returns {T} `output`
     */
    autocorrelate(input, output = this._bufferSupplier(input.length)) {
      if (input.length !== this._inputLength) {
        throw new Error(
          `Input must have length ${this._inputLength} but had length ${input.length}`
        );
      }
      for (let i = 0; i < input.length; i++) {
        this._paddedInputBuffer[i] = input[i];
      }
      for (let i = input.length; i < this._paddedInputBuffer.length; i++) {
        this._paddedInputBuffer[i] = 0;
      }
      this._fft.realTransform(this._transformBuffer, this._paddedInputBuffer);
      this._fft.completeSpectrum(this._transformBuffer);
      const tb = this._transformBuffer;
      for (let i = 0; i < tb.length; i += 2) {
        tb[i] = tb[i] * tb[i] + tb[i + 1] * tb[i + 1];
        tb[i + 1] = 0;
      }
      this._fft.inverseTransform(this._inverseBuffer, this._transformBuffer);
      for (let i = 0; i < input.length; i++) {
        output[i] = this._inverseBuffer[2 * i];
      }
      return output;
    }
  };
  function getKeyMaximumIndices(input) {
    const keyIndices = [];
    let lookingForMaximum = false;
    let max = -Infinity;
    let maxIndex = -1;
    for (let i = 1; i < input.length - 1; i++) {
      if (input[i - 1] <= 0 && input[i] > 0) {
        lookingForMaximum = true;
        maxIndex = i;
        max = input[i];
      } else if (input[i - 1] > 0 && input[i] <= 0) {
        lookingForMaximum = false;
        if (maxIndex !== -1) {
          keyIndices.push(maxIndex);
        }
      } else if (lookingForMaximum && input[i] > max) {
        max = input[i];
        maxIndex = i;
      }
    }
    return keyIndices;
  }
  function refineResultIndex(index, data) {
    const [x0, x1, x2] = [index - 1, index, index + 1];
    const [y0, y1, y2] = [data[x0], data[x1], data[x2]];
    const a = y0 / 2 - y1 + y2 / 2;
    const b = -(y0 / 2) * (x1 + x2) + y1 * (x0 + x2) - y2 / 2 * (x0 + x1);
    const c = y0 * x1 * x2 / 2 - y1 * x0 * x2 + y2 * x0 * x1 / 2;
    const xMax = -b / (2 * a);
    const yMax = a * xMax * xMax + b * xMax + c;
    return [xMax, yMax];
  }
  var PitchDetector = class _PitchDetector {
    /** @private @type {Autocorrelator<T>} */
    _autocorrelator;
    /** @private @type {T} */
    _nsdfBuffer;
    /** @private @type {number} */
    _clarityThreshold = 0.9;
    /** @private @type {number} */
    _minVolumeAbsolute = 0;
    /** @private @type {number} */
    _maxInputAmplitude = 1;
    /**
     * A helper method to create an {@link PitchDetector} using {@link Float32Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<Float32Array>}
     */
    static forFloat32Array(inputLength) {
      return new _PitchDetector(inputLength, (length) => new Float32Array(length));
    }
    /**
     * A helper method to create an {@link PitchDetector} using {@link Float64Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<Float64Array>}
     */
    static forFloat64Array(inputLength) {
      return new _PitchDetector(inputLength, (length) => new Float64Array(length));
    }
    /**
     * A helper method to create an {@link PitchDetector} using `number[]` buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<number[]>}
     */
    static forNumberArray(inputLength) {
      return new _PitchDetector(inputLength, (length) => Array(length));
    }
    /**
     * Constructs a new {@link PitchDetector} able to handle input arrays of the
     * given length.
     *
     * @param inputLength {number} the input array length to support. This
     * `PitchDetector` will only support operation on arrays of this length.
     * @param bufferSupplier {(inputLength: number) => T} the function to use for
     * creating buffers, accepting the length of the buffer to create and
     * returning a new buffer of that length. The values of the returned buffer
     * need not be initialized in any particular way.
     */
    constructor(inputLength, bufferSupplier) {
      this._autocorrelator = new Autocorrelator(inputLength, bufferSupplier);
      this._nsdfBuffer = bufferSupplier(inputLength);
    }
    /**
     * Returns the supported input length.
     *
     * @returns {number} the supported input length
     */
    get inputLength() {
      return this._autocorrelator.inputLength;
    }
    /**
     * Sets the clarity threshold used when identifying the correct pitch (the constant
     * `k` from the MPM paper). The value must be between 0 (exclusive) and 1
     * (inclusive), with the most suitable range being between 0.8 and 1.
     *
     * @param threshold {number} the clarity threshold
     */
    set clarityThreshold(threshold) {
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
        throw new Error("clarityThreshold must be a number in the range (0, 1]");
      }
      this._clarityThreshold = threshold;
    }
    /**
     * Sets the minimum detectable volume, as an absolute number between 0 and
     * `maxInputAmplitude`, inclusive, to consider in a sample when detecting the
     * pitch. If a sample fails to meet this minimum volume, `findPitch` will
     * return a clarity of 0.
     *
     * Volume is calculated as the RMS (root mean square) of the input samples.
     *
     * @param volume {number} the minimum volume as an absolute amplitude value
     */
    set minVolumeAbsolute(volume) {
      if (!Number.isFinite(volume) || volume < 0 || volume > this._maxInputAmplitude) {
        throw new Error(
          `minVolumeAbsolute must be a number in the range [0, ${this._maxInputAmplitude}]`
        );
      }
      this._minVolumeAbsolute = volume;
    }
    /**
     * Sets the minimum volume using a decibel measurement. Must be less than or
     * equal to 0: 0 indicates the loudest possible sound (see
     * `maxInputAmplitude`), -10 is a sound with a tenth of the volume of the
     * loudest possible sound, etc.
     *
     * Volume is calculated as the RMS (root mean square) of the input samples.
     *
     * @param db {number} the minimum volume in decibels, with 0 being the loudest
     * sound
     */
    set minVolumeDecibels(db) {
      if (!Number.isFinite(db) || db > 0) {
        throw new Error("minVolumeDecibels must be a number <= 0");
      }
      this._minVolumeAbsolute = this._maxInputAmplitude * 10 ** (db / 10);
    }
    /**
     * Sets the maximum amplitude of an input reading. Must be greater than 0.
     *
     * @param amplitude {number} the maximum amplitude (absolute value) of an input reading
     */
    set maxInputAmplitude(amplitude) {
      if (!Number.isFinite(amplitude) || amplitude <= 0) {
        throw new Error("maxInputAmplitude must be a number > 0");
      }
      this._maxInputAmplitude = amplitude;
    }
    /**
     * Returns the pitch detected using McLeod Pitch Method (MPM) along with a
     * measure of its clarity.
     *
     * The clarity is a value between 0 and 1 (potentially inclusive) that
     * represents how "clear" the pitch was. A clarity value of 1 indicates that
     * the pitch was very distinct, while lower clarity values indicate less
     * definite pitches.
     *
     * @param input {ArrayLike<number>} the time-domain input data
     * @param sampleRate {number} the sample rate at which the input data was
     * collected
     * @returns {[number, number]} the detected pitch, in Hz, followed by the
     * clarity. If a pitch cannot be determined from the input, such as if the
     * volume is too low (see `minVolumeAbsolute` and `minVolumeDecibels`), this
     * will be `[0, 0]`.
     */
    findPitch(input, sampleRate) {
      if (this._belowMinimumVolume(input)) return [0, 0];
      this._nsdf(input);
      const keyMaximumIndices = getKeyMaximumIndices(this._nsdfBuffer);
      if (keyMaximumIndices.length === 0) {
        return [0, 0];
      }
      const nMax = Math.max(...keyMaximumIndices.map((i) => this._nsdfBuffer[i]));
      const resultIndex = keyMaximumIndices.find(
        (i) => this._nsdfBuffer[i] >= this._clarityThreshold * nMax
      );
      const [refinedResultIndex, clarity] = refineResultIndex(
        // @ts-expect-error resultIndex is guaranteed to be defined
        resultIndex,
        this._nsdfBuffer
      );
      return [sampleRate / refinedResultIndex, Math.min(clarity, 1)];
    }
    /**
     * Returns whether the input audio data is below the minimum volume allowed by
     * the pitch detector.
     *
     * @private
     * @param input {ArrayLike<number>}
     * @returns {boolean}
     */
    _belowMinimumVolume(input) {
      if (this._minVolumeAbsolute === 0) return false;
      let squareSum = 0;
      for (let i = 0; i < input.length; i++) {
        squareSum += input[i] ** 2;
      }
      return Math.sqrt(squareSum / input.length) < this._minVolumeAbsolute;
    }
    /**
     * Computes the NSDF of the input and stores it in the internal buffer. This
     * is equation (9) in the McLeod pitch method paper.
     *
     * @private
     * @param input {ArrayLike<number>}
     */
    _nsdf(input) {
      this._autocorrelator.autocorrelate(input, this._nsdfBuffer);
      let m = 2 * this._nsdfBuffer[0];
      let i;
      for (i = 0; i < this._nsdfBuffer.length && m > 0; i++) {
        this._nsdfBuffer[i] = 2 * this._nsdfBuffer[i] / m;
        m -= input[i] ** 2 + input[input.length - i - 1] ** 2;
      }
      for (; i < this._nsdfBuffer.length; i++) {
        this._nsdfBuffer[i] = 0;
      }
    }
  };
  function ceilPow2(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
  }

  // js/audio-input.js
  console.log("TEST LOG FROM BUNDLE");
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }
  async function loadLibrary(lib) {
    if (lib === "aubio" && !window.Aubio) {
      await loadScript("/libs/aubio.js");
    }
  }
  var audioDetectLib = "pitchy";
  document.addEventListener("DOMContentLoaded", () => {
    const openTesterBtn = document.getElementById("open-input-tester");
    const testerModal = document.getElementById("input-tester-modal");
    const closeTesterBtn = document.getElementById("close-input-tester");
    const micSelect = document.getElementById("audio-mic-select-tester");
    async function populateMicSelect() {
      if (!micSelect) return;
      micSelect.innerHTML = '<option value="">Loading...</option>';
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        micSelect.innerHTML = "";
        mics.forEach((mic) => {
          const opt = document.createElement("option");
          opt.value = mic.deviceId;
          opt.textContent = mic.label || `Microphone ${mic.deviceId.substr(0, 6)}`;
          micSelect.appendChild(opt);
        });
      } catch (e) {
        micSelect.innerHTML = '<option value="">No microphones found</option>';
      }
    }
    if (openTesterBtn && testerModal && closeTesterBtn) {
      let closeTesterModal = function() {
        testerModal.classList.add("hidden");
        stopAudioInput("tester");
      };
      openTesterBtn.addEventListener("click", () => {
        testerModal.classList.remove("hidden");
        populateMicSelect();
      });
      closeTesterBtn.addEventListener("click", closeTesterModal);
      testerModal.addEventListener("click", (e) => {
        if (e.target === testerModal) {
          closeTesterModal();
        }
      });
      window.addEventListener("keydown", (e) => {
        if (!testerModal.classList.contains("hidden") && (e.key === "Escape" || e.key === "Esc")) {
          closeTesterModal();
        }
      });
      const startBtn = document.getElementById("audio-start-btn-tester");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          if (!audioInputActive) {
            requestAudioPermission("tester");
          } else {
            stopAudioInput("tester");
          }
        });
      }
    }
  });
  var audioContext = null;
  var analyser = null;
  var microphone = null;
  var audioInputActive = false;
  var audioInputTarget = null;
  async function requestAudioPermission(target = null) {
    try {
      let constraints = { audio: true };
      if (target === "tester") {
        const micSelect = document.getElementById("audio-mic-select-tester");
        if (micSelect && micSelect.value) {
          constraints = { audio: { deviceId: { exact: micSelect.value } } };
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 2048;
        microphone.connect(analyser);
      }
      audioInputActive = true;
      audioInputTarget = target;
      let statusElement, startBtn, freqDisplay, noteDisplay, vuBar;
      if (target === "tester") {
        statusElement = document.getElementById("audio-connection-status-tester");
        startBtn = document.getElementById("audio-start-btn-tester");
        freqDisplay = document.getElementById("audio-frequency-display-tester");
        noteDisplay = document.getElementById("audio-note-display-tester");
        vuBar = document.getElementById("vu-meter-bar-tester");
      } else {
        statusElement = document.getElementById("audio-connection-status");
        startBtn = document.getElementById("audio-start-btn");
        freqDisplay = document.getElementById("audio-frequency-display");
        noteDisplay = document.getElementById("audio-note-display");
        vuBar = document.getElementById("vu-meter-bar");
      }
      if (statusElement) {
        statusElement.textContent = "\u{1F3A4} Audio: Connected (listening...)";
        statusElement.style.color = "green";
      }
      if (target === "tester") {
        const testerStatus = document.getElementById("input-tester-status");
        if (testerStatus) {
          testerStatus.textContent = "Mic Connected (listening...)";
          testerStatus.style.color = "#28a745";
        }
      }
      if (startBtn) {
        startBtn.textContent = "Stop Audio Input";
        startBtn.classList.add("stop-audio");
      }
      if (freqDisplay) freqDisplay.textContent = "Frequency: --";
      if (noteDisplay) noteDisplay.textContent = "Play a note on your instrument";
      if (vuBar) vuBar.style.width = "0%";
      let heardAudio = false;
      let lastFreq = null;
      let checkTimeout = setTimeout(() => {
        if (!heardAudio) {
          if (window.notificationManager && typeof window.notificationManager.show === "function") {
            window.notificationManager.show("No audio detected from input. Please check your mic/cable and try again.", "warning", 5e3);
          } else {
            alert("No audio detected from input. Please check your mic/cable and try again.");
          }
          if (statusElement) {
            statusElement.textContent = "\u{1F3A4} Audio: Connected (no signal)";
            statusElement.style.color = "orange";
          }
        }
      }, 3500);
      const origStartPitchDetection = startPitchDetection;
      window._audioInputHeardAudio = false;
      startPitchDetection = async function patchedStartPitchDetection(target2) {
        await origStartPitchDetection(target2, (freq) => {
          if (freq && !heardAudio) {
            heardAudio = true;
            window._audioInputHeardAudio = true;
            if (statusElement) {
              statusElement.textContent = "\u{1F3A4} Audio: Connected (hearing audio)";
              statusElement.style.color = "green";
            }
          }
          lastFreq = freq;
        });
      };
      startPitchDetection(target);
      showPermissionFeedback("Audio", true);
      console.log("Audio permission granted");
      updateInputMethodButtons();
    } catch (error) {
      console.error("Audio permission failed:", error);
      showPermissionFeedback("Audio", false, error.message);
      updateInputMethodButtons();
    }
  }
  function stopAudioInput(target = null) {
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    audioInputActive = false;
    audioInputTarget = null;
    let statusElement, startBtn, freqDisplay, noteDisplay, vuBar;
    if (target === "tester") {
      statusElement = document.getElementById("audio-connection-status-tester");
      startBtn = document.getElementById("audio-start-btn-tester");
      freqDisplay = document.getElementById("audio-frequency-display-tester");
      noteDisplay = document.getElementById("audio-note-display-tester");
      vuBar = document.getElementById("vu-meter-bar-tester");
    } else {
      statusElement = document.getElementById("audio-connection-status");
      startBtn = document.getElementById("audio-start-btn");
      freqDisplay = document.getElementById("audio-frequency-display");
      noteDisplay = document.getElementById("audio-note-display");
      vuBar = document.getElementById("vu-meter-bar");
    }
    if (statusElement) {
      statusElement.textContent = "\u{1F3A4} Audio: Disconnected";
      statusElement.style.color = "black";
    }
    if (target === "tester") {
      const testerStatus = document.getElementById("input-tester-status");
      if (testerStatus) {
        testerStatus.textContent = "No Input Connected";
        testerStatus.style.color = "#4a90e2";
      }
    }
    if (startBtn) {
      startBtn.textContent = "Start Audio Input";
      startBtn.classList.remove("stop-audio");
    }
    if (vuBar) vuBar.style.width = "0%";
    if (noteDisplay) noteDisplay.textContent = "Play a note on your instrument";
    if (freqDisplay) freqDisplay.textContent = "Frequency: --";
    updateInputMethodButtons();
  }
  async function startPitchDetection(target = null) {
    if (!audioInputActive || !analyser) return;
    let pitchDetector = null;
    if (audioDetectLib === "pitchy") {
      const detectorFactory = PitchDetector.forFloat32Array;
      pitchDetector = detectorFactory(analyser.fftSize);
    } else if (audioDetectLib === "aubio") {
      await loadLibrary("aubio");
      pitchDetector = new window.Aubio().newPitch(
        "default",
        analyser.fftSize,
        analyser.fftSize,
        audioContext.sampleRate
      );
    }
    const bufferLength = analyser.fftSize;
    const timeDomainData = new Float32Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);
    const detectPitch = async () => {
      if (!audioInputActive) return;
      let frequency = null;
      if (audioDetectLib === "pitchy") {
        analyser.getFloatTimeDomainData(timeDomainData);
        const [freq, clarity] = pitchDetector.findPitch(timeDomainData, audioContext.sampleRate);
        if (clarity > 0.8) {
          frequency = freq;
        }
      } else if (audioDetectLib === "aubio") {
        analyser.getFloatTimeDomainData(timeDomainData);
        const result = pitchDetector.do(timeDomainData);
        frequency = result[0];
      } else {
        analyser.getByteFrequencyData(freqData);
        let maxAmp = 0, maxIndex = 0;
        const sensitivitySlider = document.getElementById("audio-sensitivity");
        const sensitivity = sensitivitySlider ? parseFloat(sensitivitySlider.value) : 0.3;
        const threshold = 255 * sensitivity;
        for (let i = 0; i < bufferLength; i++) {
          if (freqData[i] > maxAmp && freqData[i] > threshold) {
            maxAmp = freqData[i];
            maxIndex = i;
          }
        }
        if (maxAmp > threshold) {
          frequency = maxIndex * audioContext.sampleRate / (analyser.fftSize * 2);
        }
      }
      if (frequency) {
        if (typeof window._audioInputHeardAudioCallback === "function") {
          window._audioInputHeardAudioCallback(frequency);
        }
        const noteName = frequencyToNote(frequency);
        if (noteName) {
          console.log("[Pitchy] Detected note:", noteName, "Frequency:", frequency.toFixed(2));
        }
        const suffix = target === "tester" ? "-tester" : "";
        const freqDisplay = document.getElementById("audio-frequency-display" + suffix);
        const noteDisplay = document.getElementById("audio-note-display" + suffix);
        const vuBar = document.getElementById("vu-meter-bar" + suffix);
        if (freqDisplay) freqDisplay.textContent = `Frequency: ${frequency.toFixed(1)} Hz`;
        if (noteName && noteDisplay) noteDisplay.textContent = `Note: ${noteName}`;
        if (vuBar) {
          analyser.getByteFrequencyData(freqData);
          let max = 0;
          for (let v of freqData) if (v > max) max = v;
          vuBar.style.width = Math.min(100, max / 255 * 100) + "%";
        }
        document.querySelectorAll("#piano-ui .piano-key.active").forEach((key) => key.classList.remove("active"));
        let highlightNotes = [noteName];
        if (noteName && noteName.includes("#")) {
          const sharpToFlat = {
            "C#": "Db",
            "D#": "Eb",
            "F#": "Gb",
            "G#": "Ab",
            "A#": "Bb"
          };
          const match = noteName.match(/^([A-G]#)(\d)$/);
          if (match && sharpToFlat[match[1]]) {
            highlightNotes.push(sharpToFlat[match[1]] + match[2]);
          }
        } else if (noteName && noteName.includes("b")) {
          const flatToSharp = {
            "Db": "C#",
            "Eb": "D#",
            "Gb": "F#",
            "Ab": "G#",
            "Bb": "A#"
          };
          const match = noteName.match(/^([A-G]b)(\d)$/);
          if (match && flatToSharp[match[1]]) {
            highlightNotes.push(flatToSharp[match[1]] + match[2]);
          }
        }
        let found = false;
        for (const n of highlightNotes) {
          const keyEl = document.querySelector(`#piano-ui .piano-key[data-note="${n}"]`);
          if (keyEl) {
            keyEl.classList.add("active");
            setTimeout(() => keyEl.classList.remove("active"), 350);
            found = true;
            break;
          }
        }
        if (window.game && (window.game.state.input.method === "audio" || window.game.state.input.method === "instrument") && !window.game.dom.elements.quizCard.classList.contains("hidden")) {
          handleNoteInput(noteName);
        }
      }
      requestAnimationFrame(detectPitch);
    };
    window._audioInputHeardAudioCallback = arguments[1] || null;
    detectPitch();
  }
  function frequencyToNote(frequency) {
    if (!frequency || frequency <= 0) return null;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const A4 = 440;
    const semitones = 12 * Math.log2(frequency / A4);
    const midi = Math.round(semitones) + 69;
    if (midi < 0 || midi > 127) return null;
    const note = noteNames[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return note + octave;
  }
  window.requestAudioPermission = requestAudioPermission;
})();
