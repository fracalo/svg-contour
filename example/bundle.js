(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

require('./path-data')

require('./contour')

},{"./contour":2,"./path-data":3}],2:[function(require,module,exports){

const { drawPoint } = require('./utils/draw')
// const contiguousBorderIntersection = require('./utils/contiguous-border-point-intersection')
// const getControlPoints = require('./utils/get-control-points').default
// const getPoints = require('./utils/get-control-points').getPoints
// const controlPolygonSegments = require('./utils/get-control-points').controlPolygonSegments
// const offsetLineSegmentIntersections = require('./utils/get-control-points').offsetLineSegmentIntersections
const getContour = require('./utils/get-contour')
const drawLine = require('./utils/draw-line')


const svgContour = (el, op) => {
  if (! el instanceof SVGGeometryElement)
    throw Error('svgContour element parameter accepts only instances of SVGGeometryElement')
  const offset = op.offset || op
  if (typeof offset !== 'number')
    throw Error('svgContour offset option must be a number')
  const append = op.append || true
  if (typeof append !== 'boolean')
    throw Error('svgContour append option must be a boolean')
  const style = op.style || el.style
  if (typeof style !== 'object')
    throw Error('svgContour append option must be a object')

  const pathData = el.getPathData({ normalize: true })


  const contourD = getContour(offset)(pathData)

  const contourPath = drawLine(style, contourD, el.getPathData({ normalize: true }))

  if (append)
    el.parentElement.appendChild(contourPath)

  return contourPath
}


const testStyles = {
  stroke: 'navy', stokeWidth: 1
}


/** *** **/
const testP = document.querySelector('path')
svgContour(testP, {
  offset: 90, style: testStyles
})
svgContour(testP, {
  offset: -90, style: testStyles
})

},{"./utils/draw":5,"./utils/draw-line":4,"./utils/get-contour":6}],3:[function(require,module,exports){

// @info
//   Polyfill for SVG getPathData() and setPathData() methods. Based on:
//   - SVGPathSeg polyfill by Philip Rogers (MIT License)
//     https://github.com/progers/pathseg
//   - SVGPathNormalizer by Tadahisa Motooka (MIT License)
//     https://github.com/motooka/SVGPathNormalizer/tree/master/src
//   - arcToCubicCurves() by Dmitry Baranovskiy (MIT License)
//     https://github.com/DmitryBaranovskiy/raphael/blob/v2.1.1/raphael.core.js#L1837
// @author
//   Jarosław Foksa
// @license
//   MIT License
if (!SVGPathElement.prototype.getPathData || !SVGPathElement.prototype.setPathData) {
  (function() {
    var commandsMap = {
      "Z":"Z", "M":"M", "L":"L", "C":"C", "Q":"Q", "A":"A", "H":"H", "V":"V", "S":"S", "T":"T",
      "z":"Z", "m":"m", "l":"l", "c":"c", "q":"q", "a":"a", "h":"h", "v":"v", "s":"s", "t":"t"
    };

    var Source = function(string) {
      this._string = string;
      this._currentIndex = 0;
      this._endIndex = this._string.length;
      this._prevCommand = null;
      this._skipOptionalSpaces();
    };

    var isIE = window.navigator.userAgent.indexOf("MSIE ") !== -1;

    Source.prototype = {
      parseSegment: function() {
        var char = this._string[this._currentIndex];
        var command = commandsMap[char] ? commandsMap[char] : null;

        if (command === null) {
          // Possibly an implicit command. Not allowed if this is the first command.
          if (this._prevCommand === null) {
            return null;
          }

          // Check for remaining coordinates in the current command.
          if (
            (char === "+" || char === "-" || char === "." || (char >= "0" && char <= "9")) && this._prevCommand !== "Z"
          ) {
            if (this._prevCommand === "M") {
              command = "L";
            }
            else if (this._prevCommand === "m") {
              command = "l";
            }
            else {
              command = this._prevCommand;
            }
          }
          else {
            command = null;
          }

          if (command === null) {
            return null;
          }
        }
        else {
          this._currentIndex += 1;
        }

        this._prevCommand = command;

        var values = null;
        var cmd = command.toUpperCase();

        if (cmd === "H" || cmd === "V") {
          values = [this._parseNumber()];
        }
        else if (cmd === "M" || cmd === "L" || cmd === "T") {
          values = [this._parseNumber(), this._parseNumber()];
        }
        else if (cmd === "S" || cmd === "Q") {
          values = [this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber()];
        }
        else if (cmd === "C") {
          values = [
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber()
          ];
        }
        else if (cmd === "A") {
          values = [
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseArcFlag(),
            this._parseArcFlag(),
            this._parseNumber(),
            this._parseNumber()
          ];
        }
        else if (cmd === "Z") {
          this._skipOptionalSpaces();
          values = [];
        }

        if (values === null || values.indexOf(null) >= 0) {
          // Unknown command or known command with invalid values
          return null;
        }
        else {
          return {type: command, values: values};
        }
      },

      hasMoreData: function() {
        return this._currentIndex < this._endIndex;
      },

      peekSegmentType: function() {
        var char = this._string[this._currentIndex];
        return commandsMap[char] ? commandsMap[char] : null;
      },

      initialCommandIsMoveTo: function() {
        // If the path is empty it is still valid, so return true.
        if (!this.hasMoreData()) {
          return true;
        }

        var command = this.peekSegmentType();
        // Path must start with moveTo.
        return command === "M" || command === "m";
      },

      _isCurrentSpace: function() {
        var char = this._string[this._currentIndex];
        return char <= " " && (char === " " || char === "\n" || char === "\t" || char === "\r" || char === "\f");
      },

      _skipOptionalSpaces: function() {
        while (this._currentIndex < this._endIndex && this._isCurrentSpace()) {
          this._currentIndex += 1;
        }

        return this._currentIndex < this._endIndex;
      },

      _skipOptionalSpacesOrDelimiter: function() {
        if (
          this._currentIndex < this._endIndex &&
          !this._isCurrentSpace() &&
          this._string[this._currentIndex] !== ","
        ) {
          return false;
        }

        if (this._skipOptionalSpaces()) {
          if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ",") {
            this._currentIndex += 1;
            this._skipOptionalSpaces();
          }
        }
        return this._currentIndex < this._endIndex;
      },

      // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from
      // Source/core/svg/SVGParserUtilities.cpp.
      // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
      _parseNumber: function() {
        var exponent = 0;
        var integer = 0;
        var frac = 1;
        var decimal = 0;
        var sign = 1;
        var expsign = 1;
        var startIndex = this._currentIndex;

        this._skipOptionalSpaces();

        // Read the sign.
        if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "+") {
          this._currentIndex += 1;
        }
        else if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "-") {
          this._currentIndex += 1;
          sign = -1;
        }

        if (
          this._currentIndex === this._endIndex ||
          (
            (this._string[this._currentIndex] < "0" || this._string[this._currentIndex] > "9") &&
            this._string[this._currentIndex] !== "."
          )
        ) {
          // The first character of a number must be one of [0-9+-.].
          return null;
        }

        // Read the integer part, build right-to-left.
        var startIntPartIndex = this._currentIndex;

        while (
          this._currentIndex < this._endIndex &&
          this._string[this._currentIndex] >= "0" &&
          this._string[this._currentIndex] <= "9"
        ) {
          this._currentIndex += 1; // Advance to first non-digit.
        }

        if (this._currentIndex !== startIntPartIndex) {
          var scanIntPartIndex = this._currentIndex - 1;
          var multiplier = 1;

          while (scanIntPartIndex >= startIntPartIndex) {
            integer += multiplier * (this._string[scanIntPartIndex] - "0");
            scanIntPartIndex -= 1;
            multiplier *= 10;
          }
        }

        // Read the decimals.
        if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ".") {
          this._currentIndex += 1;

          // There must be a least one digit following the .
          if (
            this._currentIndex >= this._endIndex ||
            this._string[this._currentIndex] < "0" ||
            this._string[this._currentIndex] > "9"
          ) {
            return null;
          }

          while (
            this._currentIndex < this._endIndex &&
            this._string[this._currentIndex] >= "0" &&
            this._string[this._currentIndex] <= "9"
          ) {
            frac *= 10;
            decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
            this._currentIndex += 1;
          }
        }

        // Read the exponent part.
        if (
          this._currentIndex !== startIndex &&
          this._currentIndex + 1 < this._endIndex &&
          (this._string[this._currentIndex] === "e" || this._string[this._currentIndex] === "E") &&
          (this._string[this._currentIndex + 1] !== "x" && this._string[this._currentIndex + 1] !== "m")
        ) {
          this._currentIndex += 1;

          // Read the sign of the exponent.
          if (this._string[this._currentIndex] === "+") {
            this._currentIndex += 1;
          }
          else if (this._string[this._currentIndex] === "-") {
            this._currentIndex += 1;
            expsign = -1;
          }

          // There must be an exponent.
          if (
            this._currentIndex >= this._endIndex ||
            this._string[this._currentIndex] < "0" ||
            this._string[this._currentIndex] > "9"
          ) {
            return null;
          }

          while (
            this._currentIndex < this._endIndex &&
            this._string[this._currentIndex] >= "0" &&
            this._string[this._currentIndex] <= "9"
          ) {
            exponent *= 10;
            exponent += (this._string[this._currentIndex] - "0");
            this._currentIndex += 1;
          }
        }

        var number = integer + decimal;
        number *= sign;

        if (exponent) {
          number *= Math.pow(10, expsign * exponent);
        }

        if (startIndex === this._currentIndex) {
          return null;
        }

        this._skipOptionalSpacesOrDelimiter();

        return number;
      },

      _parseArcFlag: function() {
        if (this._currentIndex >= this._endIndex) {
          return null;
        }

        var flag = null;
        var flagChar = this._string[this._currentIndex];

        this._currentIndex += 1;

        if (flagChar === "0") {
          flag = 0;
        }
        else if (flagChar === "1") {
          flag = 1;
        }
        else {
          return null;
        }

        this._skipOptionalSpacesOrDelimiter();
        return flag;
      }
    };

    var parsePathDataString = function(string) {
      if (!string || string.length === 0) return [];

      var source = new Source(string);
      var pathData = [];

      if (source.initialCommandIsMoveTo()) {
        while (source.hasMoreData()) {
          var pathSeg = source.parseSegment();

          if (pathSeg === null) {
            break;
          }
          else {
            pathData.push(pathSeg);
          }
        }
      }

      return pathData;
    }

    var setAttribute = SVGPathElement.prototype.setAttribute;
    var removeAttribute = SVGPathElement.prototype.removeAttribute;

    var $cachedPathData = window.Symbol ? Symbol() : "__cachedPathData";
    var $cachedNormalizedPathData = window.Symbol ? Symbol() : "__cachedNormalizedPathData";

    // @info
    //   Get an array of corresponding cubic bezier curve parameters for given arc curve paramters.
    var arcToCubicCurves = function(x1, y1, x2, y2, r1, r2, angle, largeArcFlag, sweepFlag, _recursive) {
      var degToRad = function(degrees) {
        return (Math.PI * degrees) / 180;
      };

      var rotate = function(x, y, angleRad) {
        var X = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        var Y = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        return {x: X, y: Y};
      };

      var angleRad = degToRad(angle);
      var params = [];
      var f1, f2, cx, cy;

      if (_recursive) {
        f1 = _recursive[0];
        f2 = _recursive[1];
        cx = _recursive[2];
        cy = _recursive[3];
      }
      else {
        var p1 = rotate(x1, y1, -angleRad);
        x1 = p1.x;
        y1 = p1.y;

        var p2 = rotate(x2, y2, -angleRad);
        x2 = p2.x;
        y2 = p2.y;

        var x = (x1 - x2) / 2;
        var y = (y1 - y2) / 2;
        var h = (x * x) / (r1 * r1) + (y * y) / (r2 * r2);

        if (h > 1) {
          h = Math.sqrt(h);
          r1 = h * r1;
          r2 = h * r2;
        }

        var sign;

        if (largeArcFlag === sweepFlag) {
          sign = -1;
        }
        else {
          sign = 1;
        }

        var r1Pow = r1 * r1;
        var r2Pow = r2 * r2;

        var left = r1Pow * r2Pow - r1Pow * y * y - r2Pow * x * x;
        var right = r1Pow * y * y + r2Pow * x * x;

        var k = sign * Math.sqrt(Math.abs(left/right));

        cx = k * r1 * y / r2 + (x1 + x2) / 2;
        cy = k * -r2 * x / r1 + (y1 + y2) / 2;

        f1 = Math.asin(((y1 - cy) / r2).toFixed(9));
        f2 = Math.asin(((y2 - cy) / r2).toFixed(9));

        if (x1 < cx) {
          f1 = Math.PI - f1;
        }
        if (x2 < cx) {
          f2 = Math.PI - f2;
        }

        if (f1 < 0) {
          f1 = Math.PI * 2 + f1;
        }
        if (f2 < 0) {
          f2 = Math.PI * 2 + f2;
        }

        if (sweepFlag && f1 > f2) {
          f1 = f1 - Math.PI * 2;
        }
        if (!sweepFlag && f2 > f1) {
          f2 = f2 - Math.PI * 2;
        }
      }

      var df = f2 - f1;

      if (Math.abs(df) > (Math.PI * 120 / 180)) {
        var f2old = f2;
        var x2old = x2;
        var y2old = y2;

        if (sweepFlag && f2 > f1) {
          f2 = f1 + (Math.PI * 120 / 180) * (1);
        }
        else {
          f2 = f1 + (Math.PI * 120 / 180) * (-1);
        }

        x2 = cx + r1 * Math.cos(f2);
        y2 = cy + r2 * Math.sin(f2);
        params = arcToCubicCurves(x2, y2, x2old, y2old, r1, r2, angle, 0, sweepFlag, [f2, f2old, cx, cy]);
      }

      df = f2 - f1;

      var c1 = Math.cos(f1);
      var s1 = Math.sin(f1);
      var c2 = Math.cos(f2);
      var s2 = Math.sin(f2);
      var t = Math.tan(df / 4);
      var hx = 4 / 3 * r1 * t;
      var hy = 4 / 3 * r2 * t;

      var m1 = [x1, y1];
      var m2 = [x1 + hx * s1, y1 - hy * c1];
      var m3 = [x2 + hx * s2, y2 - hy * c2];
      var m4 = [x2, y2];

      m2[0] = 2 * m1[0] - m2[0];
      m2[1] = 2 * m1[1] - m2[1];

      if (_recursive) {
        return [m2, m3, m4].concat(params);
      }
      else {
        params = [m2, m3, m4].concat(params).join().split(",");

        var curves = [];
        var curveParams = [];

        params.forEach( function(param, i) {
          if (i % 2) {
            curveParams.push(rotate(params[i - 1], params[i], angleRad).y);
          }
          else {
            curveParams.push(rotate(params[i], params[i + 1], angleRad).x);
          }

          if (curveParams.length === 6) {
            curves.push(curveParams);
            curveParams = [];
          }
        });

        return curves;
      }
    };

    var clonePathData = function(pathData) {
      return pathData.map( function(seg) {
        return {type: seg.type, values: Array.prototype.slice.call(seg.values)}
      });
    };

    // @info
    //   Takes any path data, returns path data that consists only from absolute commands.
    var absolutizePathData = function(pathData) {
      var absolutizedPathData = [];

      var currentX = null;
      var currentY = null;

      var subpathX = null;
      var subpathY = null;

      pathData.forEach( function(seg) {
        var type = seg.type;

        if (type === "M") {
          var x = seg.values[0];
          var y = seg.values[1];

          absolutizedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (type === "m") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1];

          absolutizedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (type === "L") {
          var x = seg.values[0];
          var y = seg.values[1];

          absolutizedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "l") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1];

          absolutizedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "C") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x2 = seg.values[2];
          var y2 = seg.values[3];
          var x = seg.values[4];
          var y = seg.values[5];

          absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "c") {
          var x1 = currentX + seg.values[0];
          var y1 = currentY + seg.values[1];
          var x2 = currentX + seg.values[2];
          var y2 = currentY + seg.values[3];
          var x = currentX + seg.values[4];
          var y = currentY + seg.values[5];

          absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "Q") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "q") {
          var x1 = currentX + seg.values[0];
          var y1 = currentY + seg.values[1];
          var x = currentX + seg.values[2];
          var y = currentY + seg.values[3];

          absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "A") {
          var x = seg.values[5];
          var y = seg.values[6];

          absolutizedPathData.push({
            type: "A",
            values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
          });

          currentX = x;
          currentY = y;
        }

        else if (type === "a") {
          var x = currentX + seg.values[5];
          var y = currentY + seg.values[6];

          absolutizedPathData.push({
            type: "A",
            values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
          });

          currentX = x;
          currentY = y;
        }

        else if (type === "H") {
          var x = seg.values[0];
          absolutizedPathData.push({type: "H", values: [x]});
          currentX = x;
        }

        else if (type === "h") {
          var x = currentX + seg.values[0];
          absolutizedPathData.push({type: "H", values: [x]});
          currentX = x;
        }

        else if (type === "V") {
          var y = seg.values[0];
          absolutizedPathData.push({type: "V", values: [y]});
          currentY = y;
        }

        else if (type === "v") {
          var y = currentY + seg.values[0];
          absolutizedPathData.push({type: "V", values: [y]});
          currentY = y;
        }

        else if (type === "S") {
          var x2 = seg.values[0];
          var y2 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "s") {
          var x2 = currentX + seg.values[0];
          var y2 = currentY + seg.values[1];
          var x = currentX + seg.values[2];
          var y = currentY + seg.values[3];

          absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "T") {
          var x = seg.values[0];
          var y = seg.values[1]

          absolutizedPathData.push({type: "T", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "t") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1]

          absolutizedPathData.push({type: "T", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "Z" || type === "z") {
          absolutizedPathData.push({type: "Z", values: []});

          currentX = subpathX;
          currentY = subpathY;
        }
      });

      return absolutizedPathData;
    };

    // @info
    //   Takes path data that consists only from absolute commands, returns path data that consists only from
    //   "M", "L", "C" and "Z" commands.
    var reducePathData = function(pathData) {
      var reducedPathData = [];
      var lastType = null;

      var lastControlX = null;
      var lastControlY = null;

      var currentX = null;
      var currentY = null;

      var subpathX = null;
      var subpathY = null;

      pathData.forEach( function(seg) {
        if (seg.type === "M") {
          var x = seg.values[0];
          var y = seg.values[1];

          reducedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "C") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x2 = seg.values[2];
          var y2 = seg.values[3];
          var x = seg.values[4];
          var y = seg.values[5];

          reducedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          lastControlX = x2;
          lastControlY = y2;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "L") {
          var x = seg.values[0];
          var y = seg.values[1];

          reducedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "H") {
          var x = seg.values[0];

          reducedPathData.push({type: "L", values: [x, currentY]});

          currentX = x;
        }

        else if (seg.type === "V") {
          var y = seg.values[0];

          reducedPathData.push({type: "L", values: [currentX, y]});

          currentY = y;
        }

        else if (seg.type === "S") {
          var x2 = seg.values[0];
          var y2 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          var cx1, cy1;

          if (lastType === "C" || lastType === "S") {
            cx1 = currentX + (currentX - lastControlX);
            cy1 = currentY + (currentY - lastControlY);
          }
          else {
            cx1 = currentX;
            cy1 = currentY;
          }

          reducedPathData.push({type: "C", values: [cx1, cy1, x2, y2, x, y]});

          lastControlX = x2;
          lastControlY = y2;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "T") {
          var x = seg.values[0];
          var y = seg.values[1];

          var x1, y1;

          if (lastType === "Q" || lastType === "T") {
            x1 = currentX + (currentX - lastControlX);
            y1 = currentY + (currentY - lastControlY);
          }
          else {
            x1 = currentX;
            y1 = currentY;
          }

          var cx1 = currentX + 2 * (x1 - currentX) / 3;
          var cy1 = currentY + 2 * (y1 - currentY) / 3;
          var cx2 = x + 2 * (x1 - x) / 3;
          var cy2 = y + 2 * (y1 - y) / 3;

          reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

          lastControlX = x1;
          lastControlY = y1;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "Q") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          var cx1 = currentX + 2 * (x1 - currentX) / 3;
          var cy1 = currentY + 2 * (y1 - currentY) / 3;
          var cx2 = x + 2 * (x1 - x) / 3;
          var cy2 = y + 2 * (y1 - y) / 3;

          reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

          lastControlX = x1;
          lastControlY = y1;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "A") {
          var r1 = seg.values[0];
          var r2 = seg.values[1];
          var angle = seg.values[2];
          var largeArcFlag = seg.values[3];
          var sweepFlag = seg.values[4];
          var x = seg.values[5];
          var y = seg.values[6];

          if (r1 === 0 || r2 === 0) {
            reducedPathData.push({type: "C", values: [currentX, currentY, x, y, x, y]});

            currentX = x;
            currentY = y;
          }
          else {
            if (currentX !== x || currentY !== y) {
              var curves = arcToCubicCurves(currentX, currentY, x, y, r1, r2, angle, largeArcFlag, sweepFlag);

              curves.forEach( function(curve) {
                reducedPathData.push({type: "C", values: curve});

                currentX = x;
                currentY = y;
              });
            }
          }
        }

        else if (seg.type === "Z") {
          reducedPathData.push(seg);

          currentX = subpathX;
          currentY = subpathY;
        }

        lastType = seg.type;
      });

      return reducedPathData;
    };

    SVGPathElement.prototype.setAttribute = function(name, value) {
      if (name === "d") {
        this[$cachedPathData] = null;
        this[$cachedNormalizedPathData] = null;
      }

      setAttribute.call(this, name, value);
    };

    SVGPathElement.prototype.removeAttribute = function(name, value) {
      if (name === "d") {
        this[$cachedPathData] = null;
        this[$cachedNormalizedPathData] = null;
      }

      removeAttribute.call(this, name);
    };

    SVGPathElement.prototype.getPathData = function(options) {
      if (options && options.normalize) {
        if (this[$cachedNormalizedPathData]) {
          return clonePathData(this[$cachedNormalizedPathData]);
        }
        else {
          var pathData;

          if (this[$cachedPathData]) {
            pathData = clonePathData(this[$cachedPathData]);
          }
          else {
            pathData = parsePathDataString(this.getAttribute("d") || "");
            this[$cachedPathData] = clonePathData(pathData);
          }

          var normalizedPathData = reducePathData(absolutizePathData(pathData));
          this[$cachedNormalizedPathData] = clonePathData(normalizedPathData);
          return normalizedPathData;
        }
      }
      else {
        if (this[$cachedPathData]) {
          return clonePathData(this[$cachedPathData]);
        }
        else {
          var pathData = parsePathDataString(this.getAttribute("d") || "");
          this[$cachedPathData] = clonePathData(pathData);
          return pathData;
        }
      }
    };

    SVGPathElement.prototype.setPathData = function(pathData) {
      if (pathData.length === 0) {
        if (isIE) {
          // @bugfix https://github.com/mbostock/d3/issues/1737
          this.setAttribute("d", "");
        }
        else {
          this.removeAttribute("d");
        }
      }
      else {
        var d = "";

        for (var i = 0, l = pathData.length; i < l; i += 1) {
          var seg = pathData[i];

          if (i > 0) {
            d += " ";
          }

          d += seg.type;

          if (seg.values && seg.values.length > 0) {
            d += " " + seg.values.join(" ");
          }
        }

        this.setAttribute("d", d);
      }
    };

    SVGRectElement.prototype.getPathData = function(options) {
      var x = this.x.baseVal.value;
      var y = this.y.baseVal.value;
      var width = this.width.baseVal.value;
      var height = this.height.baseVal.value;
      var rx = this.hasAttribute("rx") ? this.rx.baseVal.value : this.ry.baseVal.value;
      var ry = this.hasAttribute("ry") ? this.ry.baseVal.value : this.rx.baseVal.value;

      if (rx > width / 2) {
        rx = width / 2;
      }

      if (ry > height / 2) {
        ry = height / 2;
      }

      var pathData = [
        {type: "M", values: [x+rx, y]},
        {type: "H", values: [x+width-rx]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+width, y+ry]},
        {type: "V", values: [y+height-ry]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+width-rx, y+height]},
        {type: "H", values: [x+rx]},
        {type: "A", values: [rx, ry, 0, 0, 1, x, y+height-ry]},
        {type: "V", values: [y+ry]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+rx, y]},
        {type: "Z", values: []}
      ];

      // Get rid of redundant "A" segs when either rx or ry is 0
      pathData = pathData.filter(function(s) {
        return s.type === "A" && (s.values[0] === 0 || s.values[1] === 0) ? false : true;
      });

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    SVGCircleElement.prototype.getPathData = function(options) {
      var cx = this.cx.baseVal.value;
      var cy = this.cy.baseVal.value;
      var r = this.r.baseVal.value;

      var pathData = [
        { type: "M",  values: [cx + r, cy] },
        { type: "A",  values: [r, r, 0, 0, 1, cx, cy+r] },
        { type: "A",  values: [r, r, 0, 0, 1, cx-r, cy] },
        { type: "A",  values: [r, r, 0, 0, 1, cx, cy-r] },
        { type: "A",  values: [r, r, 0, 0, 1, cx+r, cy] },
        { type: "Z",  values: [] }
      ];

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    SVGEllipseElement.prototype.getPathData = function(options) {
      var cx = this.cx.baseVal.value;
      var cy = this.cy.baseVal.value;
      var rx = this.rx.baseVal.value;
      var ry = this.ry.baseVal.value;

      var pathData = [
        { type: "M",  values: [cx + rx, cy] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx, cy+ry] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx-rx, cy] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx, cy-ry] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx+rx, cy] },
        { type: "Z",  values: [] }
      ];

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    SVGLineElement.prototype.getPathData = function() {
      return [
        { type: "M", values: [this.x1.baseVal.value, this.y1.baseVal.value] },
        { type: "L", values: [this.x2.baseVal.value, this.y2.baseVal.value] }
      ];
    };

    SVGPolylineElement.prototype.getPathData = function() {
      var pathData = [];

      for (var i = 0; i < this.points.numberOfItems; i += 1) {
        var point = this.points.getItem(i);

        pathData.push({
          type: (i === 0 ? "M" : "L"),
          values: [point.x, point.y]
        });
      }

      return pathData;
    };

    SVGPolygonElement.prototype.getPathData = function() {
      var pathData = [];

      for (var i = 0; i < this.points.numberOfItems; i += 1) {
        var point = this.points.getItem(i);

        pathData.push({
          type: (i === 0 ? "M" : "L"),
          values: [point.x, point.y]
        });
      }

      pathData.push({
        type: "Z",
        values: []
      });

      return pathData;
    };
  })();
}

},{}],4:[function(require,module,exports){
module.exports = drawLine

// drawLine :: (Style, D, pointSeq) -> SVGPathElement

const svgNS = 'http://www.w3.org/2000/svg'
// const commandSize = {
//   M: 2,   L: 2,   Q: 4,
//   T: 2,   C: 6,   S: 4,   Z: 0
//   // TODO missing A, H, V
// }

function drawLine(styles, dataPairs, pData) {
  const data = dataPairs.reduce((a, x) => (
    [...a, ...x]
  ), [])
  const p = document.createElementNS(svgNS, 'path')
  Object.assign(p.style, styles)
  let i = 0
  let dataIndex = 0
  while (i < pData.length) {
    const command = pData[i]
    const size = command.values.length // commandSize[command.type]
    command.values = data.slice(dataIndex, size + dataIndex)
    dataIndex += size
    i++
  }
  p.setPathData(pData)
  return p
}

},{}],5:[function(require,module,exports){
const svgNS = 'http://www.w3.org/2000/svg'
const svg = document.querySelector('svg')
const pipe = require('./pipe')


const drawPoint = (p, col) => {
  const el = circleCreator(p)
  el.style.fill = col
  svg.appendChild(el)
}

exports.drawPoint = drawPoint

// assuming a path of only M and C TODO
const divideInVector = pd =>
  pd.reduce((ac, x) => {
    if (x.type === 'M')
      ac.push({ point: x.values, vector: null })
    if (x.type === 'C') {
      ac[ac.length - 1].vector = [x.values[0], x.values[1]]
      ac.push({ point: [x.values[2], x.values[3]], vector: [x.values[4], x.values[5]] })
    }
    return ac
  }, [])

exports.divideInVector = divideInVector


// getPoints Object -> [[Number, Number]]
const getPoints = (pd) => pd.reduce((ac, x) => {
  let array = x.values
  while (array.length > 0) {
    ac.push([array[0], array[1]])
    array = array.slice(2)
  }
  return ac
}, [])
// listOfCircles :: [[Number, Number]] -> [CircleNode]
const listOfCircles = (list) => list.map(circleCreator)
const circleCreator = (a) => {
  const el = document.createElementNS(svgNS, 'circle')
  el.setAttribute('cx', a[0])
  el.setAttribute('cy', a[1])
  return el
}

const colorArray = ['green', 'blue', 'red', 'yellow', 'purple']
const colorIt = colorArray[Symbol.iterator]()
// colorize :: [CircleNode] -> color
const colorize = list => {
  // const color = colorArray.slice(countCol++ %colorArray.length)[0]
  const color = colorIt.next().value
  return list.map(x => {
    x.style.fill = color
    return x
  })
}

const pointsFragment = points => points.reduce((ac, x) => {
  ac.appendChild(x)
  return ac
}, document.createDocumentFragment())

const pathDataToHandles = pipe(
  getPoints,
  listOfCircles,
  colorize,
  pointsFragment
)

// const datas = paths.map(x => x.getPathData())
//                       .map(pathDataToHandles)
// datas.forEach(x => {
//   svg.appendChild(x)
// })

},{"./pipe":8}],6:[function(require,module,exports){
const pipe = require('./pipe')
const Point = require('./point')
const Segment = require('./segment')
// drawPoint for test
// const { drawPoint } = require('./draw')

// getPoints:: pathData -> [Point]
const getPoints = pd =>
  pd.reduce((ac, x) => {
    let i = 0
    while (i + 2 <= x.values.length) {
      const [a, b] = x.values.slice(i, i + 2)
      ac.push(new Point(a, b))
      i = i + 2
    }
    return ac
  }, [])

// controlPolygonSegments ::
// [Point] -> [Segment]
// given an array of points it gives back an array of segments
const controlPolygonSegments = points =>
  points.reduce((ac, x, i, arr) => {
    if (i === 0)
      return ac
    ac.push(new Segment(arr[i - 1], x))
    return ac
  }, [])

// [Segment] -> [Segment, Null]
const offsetSegments = off => segments => segments.map(s => {
  if (s.zeroLength())
    return null

  const offsetLine = s.line().offset(off)
  const offsetPoints = new Segment(
    offsetLine.projection(s.p1),
    offsetLine.projection(s.p2)
  )
  return offsetPoints
})
// [Segment] -> [Point, Null]
const offsetSegmentsControlPoints = off => segments => segments.reduce((ac, s, i, arr) => {
  const offsetLine = s.zeroLength() ? null : s.line().offset(off)

  if (i === 0) {
    if (!offsetLine)
      ac.push(null)
    else {
      ac.push(offsetLine.projection(s.p1))
    }
  }

  if (i < arr.length - 1) {
    if (!offsetLine)
      ac.push(null)
    else {
      const followingValidSeg = nonZerolengthfallFront(arr, i)
      ac.push(
        followingValidSeg ?
        offsetLine.intersection(followingValidSeg.line().offset(off)) :
        offsetLine.projection(s.p2)
      )
    }
  }
  else { // last point
    if (!offsetLine)
      ac.push(null)
    else
      ac.push(offsetLine.projection(s.p2))
  }
  return ac
}, [])
// utility of offsetSegmentsControlPoints
function nonZerolengthfallFront(arr, i) {
  while (++i < arr.length) {
    if (! arr[i].zeroLength())
      return arr[i]
  }
  return null
}

// [Segment, Null] -> [Segment]
const fallbackForZeroLength = segPoints => segPoints.map((cp, i, arr) => (
  cp !== null ?
  cp :
  fallbackCp(arr, i)
))

function fallbackCp(arr, i) {
  let bi = i
  while (--bi > -1) {
    if (arr[bi]) return arr[bi]
  }
  let fi = i
  while (++fi < arr.length) {
    if (arr[fi]) return arr[fi]
  }
  throw new Error('all zeroLength segments')
}

// utility of fallbackForZeroLength
// function lookFor2Points(arr, i) {
//   const p2 = pointWithFallBackFrontward(arr, i)
//   const p1 = i === 0 ? p2 : arr[i - 1].p2
//   if (!p1 && !p2) throw new Error('all zeroLength segments')
//   return (
//     p1 && p2 ?
//     new Segment(p1, p2) :
//     new Segment(p1, p1) // if at the end there's no valid point repeat p1
//   )
// }
// // utility of lookFor2Points
// function pointWithFallBackFrontward(arr, index) {
//   let i = index - 1
//   while (++i < arr.length) {
//     if (arr[i])
//       return arr[i].p1
//   }
//   return null
// }

module.exports = off => pipe(
    getPoints,
    controlPolygonSegments,
    offsetSegmentsControlPoints(off),
    (x => x.map(s => {
      console.log('s', s)
      return s
    })),
    fallbackForZeroLength,
    (x => x.map(s => {
      console.log('fallbacked', s)
      return s
    }))
  )


  // const segmentsToLinePoints = segments => segments.reduce((ac, s, i, arr) => {
  //   if (i === 0) {
  //     const first = lineWithFallBackFrontward(s.p1, arr, i)
  //     ac.push(first)
  //   }
  //   const before = ac.slice(-1)[0]
  //   if (s.zeroLength()) {
  //     ac.push(before)
  //   }
  //   else if (i < arr.length - 1) {
  //     const after = lineWithFallBackFrontward(s.p2, arr, i + 1)
  //     const line = before && after ?
  //       linesRotationLerp(s.p2, before, after) :
  //       before
  //     ac.push(line)
  //   }
  //   else {
  //     ac.push(s.line(s.p2))
  //   }
  //   return ac
  // }, [])
  // function linesRotationLerp(center, segFrom, segTo) {
  //   const beforeRad = Math.atan(segFrom.m)
  //   const afterRad = Math.atan(segTo.m)
  //   const increment = (afterRad - beforeRad) / 2
  //   const m = Math.tan(beforeRad + increment)
  //   const inter = isFinite(m) ?
  //   center.y + m * -center.x :
  //   center.x
  //   return new Line(m, inter, center)
  // }
  // function lineWithFallBackFrontward(p, arr, index) {
  //   let i = index - 1
  //   while (++i < arr.length) {
  //     if (! arr[i].zeroLength())
  //       return arr[i].line(p)
  //   }
  // }

},{"./pipe":8,"./point":9,"./segment":10}],7:[function(require,module,exports){
const Point = require('./point')


class Line {
  constructor(m, inter, center) {
    this.m = m
    this.inter = inter
    this.vertical = ! isFinite(this.m)
    this.horizontal = this.m === 0
    this.center = center
  }
  func(x) {
    return (
      isFinite(this.m) ?
      this.m * x + this.inter :
      this.inter
    )
  }
  offset(n) {
    if (! isFinite(this.m))
      return new Line(this.m, this.inter - n)

    const vertDisplacement = n * Math.sqrt(1 + Math.pow(this.m, 2)) + this.inter
    // n / Math.cos(Math.atan(this.m)) + this.inter TODO check why this don't work
    return new Line(this.m, vertDisplacement)
  }
  intersection(other) {
    // return either a Point : [Number, Number]
    // true in case it's the same line
    // false in case parallel
    if (this.vertical && other.vertical)
      return this.inter === other.inter
    if (this.vertical) return new Point(this.inter, other.func(this.inter))
    if (other.vertical) {
      return new Point(other.inter, this.func(other.inter))
    }
    const crossingX = (this.inter - other.inter) / (other.m - this.m)
    return (
      isNaN(crossingX) ? true : // same m same inter
      ! isFinite(crossingX) ? false : // same m different inter
      new Point(crossingX, this.func(crossingX))
    )
  }
  projection(p) {
    const m2 = -1 / this.m
    const inter2 = isFinite(m2) ? p.y - m2 * p.x : p.x
    const l2 = new Line(m2, inter2)
    return this.intersection(l2)
  }
}


module.exports = Line

},{"./point":9}],8:[function(require,module,exports){
module.exports = (...arr) => arg =>
  arr.reduce((ac, f) => f(ac), arg)

},{}],9:[function(require,module,exports){

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  isEqual(other) {
    return this.x === other.x && this.y === other.y
  }
}

Point.prototype[Symbol.iterator] = function* () {
  yield this.x
  yield this.y
}
module.exports = Point

},{}],10:[function(require,module,exports){
const Point = require('./point')
const Line = require('./line')


class Segment {
  constructor(p1, p2) {
    this.p1 = p1 instanceof Point ? p1 : new Point(p1[0], p1[1])
    this.p2 = p2 instanceof Point ? p2 : new Point(p2[0], p2[1])
    this.m = (this.p1.y - this.p2.y) / (this.p1.x - this.p2.x)
  }
  getLineOrPoint() {
    return (
      isNaN(this.m) ?
      this.p1 :
      this.line()
    )
  }
  line(center) {
    if (this.zeroLength())
      throw new Error('no single line available for zero length segment')

    const inter = isFinite(this.m) ?
    this.p1.y + this.m * -this.p1.x :
    this.p1.x

    return new Line(this.m, inter, center)
  }
  zeroLength() {
    return this.p1.isEqual(this.p2)
  }
}

Segment.prototype[Symbol.iterator] = function* () {
  yield this.p1.x
  yield this.p1.y
  yield this.p2.x
  yield this.p2.y
  return
}

module.exports = Segment

},{"./line":7,"./point":9}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLmpzIiwic3JjL2NvbnRvdXIuanMiLCJzcmMvcGF0aC1kYXRhLmpzIiwic3JjL3V0aWxzL2RyYXctbGluZS5qcyIsInNyYy91dGlscy9kcmF3LmpzIiwic3JjL3V0aWxzL2dldC1jb250b3VyLmpzIiwic3JjL3V0aWxzL2xpbmUuanMiLCJzcmMvdXRpbHMvcGlwZS5qcyIsInNyYy91dGlscy9wb2ludC5qcyIsInNyYy91dGlscy9zZWdtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZtQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG5yZXF1aXJlKCcuL3BhdGgtZGF0YScpXG5cbnJlcXVpcmUoJy4vY29udG91cicpXG4iLCJcbmNvbnN0IHsgZHJhd1BvaW50IH0gPSByZXF1aXJlKCcuL3V0aWxzL2RyYXcnKVxuLy8gY29uc3QgY29udGlndW91c0JvcmRlckludGVyc2VjdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY29udGlndW91cy1ib3JkZXItcG9pbnQtaW50ZXJzZWN0aW9uJylcbi8vIGNvbnN0IGdldENvbnRyb2xQb2ludHMgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1jb250cm9sLXBvaW50cycpLmRlZmF1bHRcbi8vIGNvbnN0IGdldFBvaW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWNvbnRyb2wtcG9pbnRzJykuZ2V0UG9pbnRzXG4vLyBjb25zdCBjb250cm9sUG9seWdvblNlZ21lbnRzID0gcmVxdWlyZSgnLi91dGlscy9nZXQtY29udHJvbC1wb2ludHMnKS5jb250cm9sUG9seWdvblNlZ21lbnRzXG4vLyBjb25zdCBvZmZzZXRMaW5lU2VnbWVudEludGVyc2VjdGlvbnMgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1jb250cm9sLXBvaW50cycpLm9mZnNldExpbmVTZWdtZW50SW50ZXJzZWN0aW9uc1xuY29uc3QgZ2V0Q29udG91ciA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWNvbnRvdXInKVxuY29uc3QgZHJhd0xpbmUgPSByZXF1aXJlKCcuL3V0aWxzL2RyYXctbGluZScpXG5cblxuY29uc3Qgc3ZnQ29udG91ciA9IChlbCwgb3ApID0+IHtcbiAgaWYgKCEgZWwgaW5zdGFuY2VvZiBTVkdHZW9tZXRyeUVsZW1lbnQpXG4gICAgdGhyb3cgRXJyb3IoJ3N2Z0NvbnRvdXIgZWxlbWVudCBwYXJhbWV0ZXIgYWNjZXB0cyBvbmx5IGluc3RhbmNlcyBvZiBTVkdHZW9tZXRyeUVsZW1lbnQnKVxuICBjb25zdCBvZmZzZXQgPSBvcC5vZmZzZXQgfHwgb3BcbiAgaWYgKHR5cGVvZiBvZmZzZXQgIT09ICdudW1iZXInKVxuICAgIHRocm93IEVycm9yKCdzdmdDb250b3VyIG9mZnNldCBvcHRpb24gbXVzdCBiZSBhIG51bWJlcicpXG4gIGNvbnN0IGFwcGVuZCA9IG9wLmFwcGVuZCB8fCB0cnVlXG4gIGlmICh0eXBlb2YgYXBwZW5kICE9PSAnYm9vbGVhbicpXG4gICAgdGhyb3cgRXJyb3IoJ3N2Z0NvbnRvdXIgYXBwZW5kIG9wdGlvbiBtdXN0IGJlIGEgYm9vbGVhbicpXG4gIGNvbnN0IHN0eWxlID0gb3Auc3R5bGUgfHwgZWwuc3R5bGVcbiAgaWYgKHR5cGVvZiBzdHlsZSAhPT0gJ29iamVjdCcpXG4gICAgdGhyb3cgRXJyb3IoJ3N2Z0NvbnRvdXIgYXBwZW5kIG9wdGlvbiBtdXN0IGJlIGEgb2JqZWN0JylcblxuICBjb25zdCBwYXRoRGF0YSA9IGVsLmdldFBhdGhEYXRhKHsgbm9ybWFsaXplOiB0cnVlIH0pXG5cblxuICBjb25zdCBjb250b3VyRCA9IGdldENvbnRvdXIob2Zmc2V0KShwYXRoRGF0YSlcblxuICBjb25zdCBjb250b3VyUGF0aCA9IGRyYXdMaW5lKHN0eWxlLCBjb250b3VyRCwgZWwuZ2V0UGF0aERhdGEoeyBub3JtYWxpemU6IHRydWUgfSkpXG5cbiAgaWYgKGFwcGVuZClcbiAgICBlbC5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKGNvbnRvdXJQYXRoKVxuXG4gIHJldHVybiBjb250b3VyUGF0aFxufVxuXG5cbmNvbnN0IHRlc3RTdHlsZXMgPSB7XG4gIHN0cm9rZTogJ25hdnknLCBzdG9rZVdpZHRoOiAxXG59XG5cblxuLyoqICoqKiAqKi9cbmNvbnN0IHRlc3RQID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcigncGF0aCcpXG5zdmdDb250b3VyKHRlc3RQLCB7XG4gIG9mZnNldDogOTAsIHN0eWxlOiB0ZXN0U3R5bGVzXG59KVxuc3ZnQ29udG91cih0ZXN0UCwge1xuICBvZmZzZXQ6IC05MCwgc3R5bGU6IHRlc3RTdHlsZXNcbn0pXG4iLCJcbi8vIEBpbmZvXG4vLyAgIFBvbHlmaWxsIGZvciBTVkcgZ2V0UGF0aERhdGEoKSBhbmQgc2V0UGF0aERhdGEoKSBtZXRob2RzLiBCYXNlZCBvbjpcbi8vICAgLSBTVkdQYXRoU2VnIHBvbHlmaWxsIGJ5IFBoaWxpcCBSb2dlcnMgKE1JVCBMaWNlbnNlKVxuLy8gICAgIGh0dHBzOi8vZ2l0aHViLmNvbS9wcm9nZXJzL3BhdGhzZWdcbi8vICAgLSBTVkdQYXRoTm9ybWFsaXplciBieSBUYWRhaGlzYSBNb3Rvb2thIChNSVQgTGljZW5zZSlcbi8vICAgICBodHRwczovL2dpdGh1Yi5jb20vbW90b29rYS9TVkdQYXRoTm9ybWFsaXplci90cmVlL21hc3Rlci9zcmNcbi8vICAgLSBhcmNUb0N1YmljQ3VydmVzKCkgYnkgRG1pdHJ5IEJhcmFub3Zza2l5IChNSVQgTGljZW5zZSlcbi8vICAgICBodHRwczovL2dpdGh1Yi5jb20vRG1pdHJ5QmFyYW5vdnNraXkvcmFwaGFlbC9ibG9iL3YyLjEuMS9yYXBoYWVsLmNvcmUuanMjTDE4Mzdcbi8vIEBhdXRob3Jcbi8vICAgSmFyb3PFgmF3IEZva3NhXG4vLyBAbGljZW5zZVxuLy8gICBNSVQgTGljZW5zZVxuaWYgKCFTVkdQYXRoRWxlbWVudC5wcm90b3R5cGUuZ2V0UGF0aERhdGEgfHwgIVNWR1BhdGhFbGVtZW50LnByb3RvdHlwZS5zZXRQYXRoRGF0YSkge1xuICAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbW1hbmRzTWFwID0ge1xuICAgICAgXCJaXCI6XCJaXCIsIFwiTVwiOlwiTVwiLCBcIkxcIjpcIkxcIiwgXCJDXCI6XCJDXCIsIFwiUVwiOlwiUVwiLCBcIkFcIjpcIkFcIiwgXCJIXCI6XCJIXCIsIFwiVlwiOlwiVlwiLCBcIlNcIjpcIlNcIiwgXCJUXCI6XCJUXCIsXG4gICAgICBcInpcIjpcIlpcIiwgXCJtXCI6XCJtXCIsIFwibFwiOlwibFwiLCBcImNcIjpcImNcIiwgXCJxXCI6XCJxXCIsIFwiYVwiOlwiYVwiLCBcImhcIjpcImhcIiwgXCJ2XCI6XCJ2XCIsIFwic1wiOlwic1wiLCBcInRcIjpcInRcIlxuICAgIH07XG5cbiAgICB2YXIgU291cmNlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICB0aGlzLl9zdHJpbmcgPSBzdHJpbmc7XG4gICAgICB0aGlzLl9jdXJyZW50SW5kZXggPSAwO1xuICAgICAgdGhpcy5fZW5kSW5kZXggPSB0aGlzLl9zdHJpbmcubGVuZ3RoO1xuICAgICAgdGhpcy5fcHJldkNvbW1hbmQgPSBudWxsO1xuICAgICAgdGhpcy5fc2tpcE9wdGlvbmFsU3BhY2VzKCk7XG4gICAgfTtcblxuICAgIHZhciBpc0lFID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUUgXCIpICE9PSAtMTtcblxuICAgIFNvdXJjZS5wcm90b3R5cGUgPSB7XG4gICAgICBwYXJzZVNlZ21lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hhciA9IHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICB2YXIgY29tbWFuZCA9IGNvbW1hbmRzTWFwW2NoYXJdID8gY29tbWFuZHNNYXBbY2hhcl0gOiBudWxsO1xuXG4gICAgICAgIGlmIChjb21tYW5kID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gUG9zc2libHkgYW4gaW1wbGljaXQgY29tbWFuZC4gTm90IGFsbG93ZWQgaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29tbWFuZC5cbiAgICAgICAgICBpZiAodGhpcy5fcHJldkNvbW1hbmQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENoZWNrIGZvciByZW1haW5pbmcgY29vcmRpbmF0ZXMgaW4gdGhlIGN1cnJlbnQgY29tbWFuZC5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAoY2hhciA9PT0gXCIrXCIgfHwgY2hhciA9PT0gXCItXCIgfHwgY2hhciA9PT0gXCIuXCIgfHwgKGNoYXIgPj0gXCIwXCIgJiYgY2hhciA8PSBcIjlcIikpICYmIHRoaXMuX3ByZXZDb21tYW5kICE9PSBcIlpcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3ByZXZDb21tYW5kID09PSBcIk1cIikge1xuICAgICAgICAgICAgICBjb21tYW5kID0gXCJMXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLl9wcmV2Q29tbWFuZCA9PT0gXCJtXCIpIHtcbiAgICAgICAgICAgICAgY29tbWFuZCA9IFwibFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGNvbW1hbmQgPSB0aGlzLl9wcmV2Q29tbWFuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb21tYW5kID0gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tbWFuZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHJldkNvbW1hbmQgPSBjb21tYW5kO1xuXG4gICAgICAgIHZhciB2YWx1ZXMgPSBudWxsO1xuICAgICAgICB2YXIgY21kID0gY29tbWFuZC50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChjbWQgPT09IFwiSFwiIHx8IGNtZCA9PT0gXCJWXCIpIHtcbiAgICAgICAgICB2YWx1ZXMgPSBbdGhpcy5fcGFyc2VOdW1iZXIoKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY21kID09PSBcIk1cIiB8fCBjbWQgPT09IFwiTFwiIHx8IGNtZCA9PT0gXCJUXCIpIHtcbiAgICAgICAgICB2YWx1ZXMgPSBbdGhpcy5fcGFyc2VOdW1iZXIoKSwgdGhpcy5fcGFyc2VOdW1iZXIoKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY21kID09PSBcIlNcIiB8fCBjbWQgPT09IFwiUVwiKSB7XG4gICAgICAgICAgdmFsdWVzID0gW3RoaXMuX3BhcnNlTnVtYmVyKCksIHRoaXMuX3BhcnNlTnVtYmVyKCksIHRoaXMuX3BhcnNlTnVtYmVyKCksIHRoaXMuX3BhcnNlTnVtYmVyKCldO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNtZCA9PT0gXCJDXCIpIHtcbiAgICAgICAgICB2YWx1ZXMgPSBbXG4gICAgICAgICAgICB0aGlzLl9wYXJzZU51bWJlcigpLFxuICAgICAgICAgICAgdGhpcy5fcGFyc2VOdW1iZXIoKSxcbiAgICAgICAgICAgIHRoaXMuX3BhcnNlTnVtYmVyKCksXG4gICAgICAgICAgICB0aGlzLl9wYXJzZU51bWJlcigpLFxuICAgICAgICAgICAgdGhpcy5fcGFyc2VOdW1iZXIoKSxcbiAgICAgICAgICAgIHRoaXMuX3BhcnNlTnVtYmVyKClcbiAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNtZCA9PT0gXCJBXCIpIHtcbiAgICAgICAgICB2YWx1ZXMgPSBbXG4gICAgICAgICAgICB0aGlzLl9wYXJzZU51bWJlcigpLFxuICAgICAgICAgICAgdGhpcy5fcGFyc2VOdW1iZXIoKSxcbiAgICAgICAgICAgIHRoaXMuX3BhcnNlTnVtYmVyKCksXG4gICAgICAgICAgICB0aGlzLl9wYXJzZUFyY0ZsYWcoKSxcbiAgICAgICAgICAgIHRoaXMuX3BhcnNlQXJjRmxhZygpLFxuICAgICAgICAgICAgdGhpcy5fcGFyc2VOdW1iZXIoKSxcbiAgICAgICAgICAgIHRoaXMuX3BhcnNlTnVtYmVyKClcbiAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGNtZCA9PT0gXCJaXCIpIHtcbiAgICAgICAgICB0aGlzLl9za2lwT3B0aW9uYWxTcGFjZXMoKTtcbiAgICAgICAgICB2YWx1ZXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZXMgPT09IG51bGwgfHwgdmFsdWVzLmluZGV4T2YobnVsbCkgPj0gMCkge1xuICAgICAgICAgIC8vIFVua25vd24gY29tbWFuZCBvciBrbm93biBjb21tYW5kIHdpdGggaW52YWxpZCB2YWx1ZXNcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4ge3R5cGU6IGNvbW1hbmQsIHZhbHVlczogdmFsdWVzfTtcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgaGFzTW9yZURhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudEluZGV4IDwgdGhpcy5fZW5kSW5kZXg7XG4gICAgICB9LFxuXG4gICAgICBwZWVrU2VnbWVudFR5cGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY2hhciA9IHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdO1xuICAgICAgICByZXR1cm4gY29tbWFuZHNNYXBbY2hhcl0gPyBjb21tYW5kc01hcFtjaGFyXSA6IG51bGw7XG4gICAgICB9LFxuXG4gICAgICBpbml0aWFsQ29tbWFuZElzTW92ZVRvOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSWYgdGhlIHBhdGggaXMgZW1wdHkgaXQgaXMgc3RpbGwgdmFsaWQsIHNvIHJldHVybiB0cnVlLlxuICAgICAgICBpZiAoIXRoaXMuaGFzTW9yZURhdGEoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbW1hbmQgPSB0aGlzLnBlZWtTZWdtZW50VHlwZSgpO1xuICAgICAgICAvLyBQYXRoIG11c3Qgc3RhcnQgd2l0aCBtb3ZlVG8uXG4gICAgICAgIHJldHVybiBjb21tYW5kID09PSBcIk1cIiB8fCBjb21tYW5kID09PSBcIm1cIjtcbiAgICAgIH0sXG5cbiAgICAgIF9pc0N1cnJlbnRTcGFjZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjaGFyID0gdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF07XG4gICAgICAgIHJldHVybiBjaGFyIDw9IFwiIFwiICYmIChjaGFyID09PSBcIiBcIiB8fCBjaGFyID09PSBcIlxcblwiIHx8IGNoYXIgPT09IFwiXFx0XCIgfHwgY2hhciA9PT0gXCJcXHJcIiB8fCBjaGFyID09PSBcIlxcZlwiKTtcbiAgICAgIH0sXG5cbiAgICAgIF9za2lwT3B0aW9uYWxTcGFjZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5fY3VycmVudEluZGV4IDwgdGhpcy5fZW5kSW5kZXggJiYgdGhpcy5faXNDdXJyZW50U3BhY2UoKSkge1xuICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRJbmRleCA8IHRoaXMuX2VuZEluZGV4O1xuICAgICAgfSxcblxuICAgICAgX3NraXBPcHRpb25hbFNwYWNlc09yRGVsaW1pdGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA8IHRoaXMuX2VuZEluZGV4ICYmXG4gICAgICAgICAgIXRoaXMuX2lzQ3VycmVudFNwYWNlKCkgJiZcbiAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSAhPT0gXCIsXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3NraXBPcHRpb25hbFNwYWNlcygpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRJbmRleCA8IHRoaXMuX2VuZEluZGV4ICYmIHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdID09PSBcIixcIikge1xuICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ICs9IDE7XG4gICAgICAgICAgICB0aGlzLl9za2lwT3B0aW9uYWxTcGFjZXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRJbmRleCA8IHRoaXMuX2VuZEluZGV4O1xuICAgICAgfSxcblxuICAgICAgLy8gUGFyc2UgYSBudW1iZXIgZnJvbSBhbiBTVkcgcGF0aC4gVGhpcyB2ZXJ5IGNsb3NlbHkgZm9sbG93cyBnZW5lcmljUGFyc2VOdW1iZXIoLi4uKSBmcm9tXG4gICAgICAvLyBTb3VyY2UvY29yZS9zdmcvU1ZHUGFyc2VyVXRpbGl0aWVzLmNwcC5cbiAgICAgIC8vIFNwZWM6IGh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL3NpbmdsZS1wYWdlLmh0bWwjcGF0aHMtUGF0aERhdGFCTkZcbiAgICAgIF9wYXJzZU51bWJlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBleHBvbmVudCA9IDA7XG4gICAgICAgIHZhciBpbnRlZ2VyID0gMDtcbiAgICAgICAgdmFyIGZyYWMgPSAxO1xuICAgICAgICB2YXIgZGVjaW1hbCA9IDA7XG4gICAgICAgIHZhciBzaWduID0gMTtcbiAgICAgICAgdmFyIGV4cHNpZ24gPSAxO1xuICAgICAgICB2YXIgc3RhcnRJbmRleCA9IHRoaXMuX2N1cnJlbnRJbmRleDtcblxuICAgICAgICB0aGlzLl9za2lwT3B0aW9uYWxTcGFjZXMoKTtcblxuICAgICAgICAvLyBSZWFkIHRoZSBzaWduLlxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEluZGV4IDwgdGhpcy5fZW5kSW5kZXggJiYgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPT09IFwiK1wiKSB7XG4gICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5fY3VycmVudEluZGV4IDwgdGhpcy5fZW5kSW5kZXggJiYgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ICs9IDE7XG4gICAgICAgICAgc2lnbiA9IC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA9PT0gdGhpcy5fZW5kSW5kZXggfHxcbiAgICAgICAgICAoXG4gICAgICAgICAgICAodGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPCBcIjBcIiB8fCB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA+IFwiOVwiKSAmJlxuICAgICAgICAgICAgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gIT09IFwiLlwiXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBUaGUgZmlyc3QgY2hhcmFjdGVyIG9mIGEgbnVtYmVyIG11c3QgYmUgb25lIG9mIFswLTkrLS5dLlxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVhZCB0aGUgaW50ZWdlciBwYXJ0LCBidWlsZCByaWdodC10by1sZWZ0LlxuICAgICAgICB2YXIgc3RhcnRJbnRQYXJ0SW5kZXggPSB0aGlzLl9jdXJyZW50SW5kZXg7XG5cbiAgICAgICAgd2hpbGUgKFxuICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCA8IHRoaXMuX2VuZEluZGV4ICYmXG4gICAgICAgICAgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPj0gXCIwXCIgJiZcbiAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA8PSBcIjlcIlxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggKz0gMTsgLy8gQWR2YW5jZSB0byBmaXJzdCBub24tZGlnaXQuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEluZGV4ICE9PSBzdGFydEludFBhcnRJbmRleCkge1xuICAgICAgICAgIHZhciBzY2FuSW50UGFydEluZGV4ID0gdGhpcy5fY3VycmVudEluZGV4IC0gMTtcbiAgICAgICAgICB2YXIgbXVsdGlwbGllciA9IDE7XG5cbiAgICAgICAgICB3aGlsZSAoc2NhbkludFBhcnRJbmRleCA+PSBzdGFydEludFBhcnRJbmRleCkge1xuICAgICAgICAgICAgaW50ZWdlciArPSBtdWx0aXBsaWVyICogKHRoaXMuX3N0cmluZ1tzY2FuSW50UGFydEluZGV4XSAtIFwiMFwiKTtcbiAgICAgICAgICAgIHNjYW5JbnRQYXJ0SW5kZXggLT0gMTtcbiAgICAgICAgICAgIG11bHRpcGxpZXIgKj0gMTA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVhZCB0aGUgZGVjaW1hbHMuXG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPCB0aGlzLl9lbmRJbmRleCAmJiB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA9PT0gXCIuXCIpIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggKz0gMTtcblxuICAgICAgICAgIC8vIFRoZXJlIG11c3QgYmUgYSBsZWFzdCBvbmUgZGlnaXQgZm9sbG93aW5nIHRoZSAuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID49IHRoaXMuX2VuZEluZGV4IHx8XG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA8IFwiMFwiIHx8XG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA+IFwiOVwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPCB0aGlzLl9lbmRJbmRleCAmJlxuICAgICAgICAgICAgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPj0gXCIwXCIgJiZcbiAgICAgICAgICAgIHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdIDw9IFwiOVwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBmcmFjICo9IDEwO1xuICAgICAgICAgICAgZGVjaW1hbCArPSAodGhpcy5fc3RyaW5nLmNoYXJBdCh0aGlzLl9jdXJyZW50SW5kZXgpIC0gXCIwXCIpIC8gZnJhYztcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlYWQgdGhlIGV4cG9uZW50IHBhcnQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggIT09IHN0YXJ0SW5kZXggJiZcbiAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggKyAxIDwgdGhpcy5fZW5kSW5kZXggJiZcbiAgICAgICAgICAodGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPT09IFwiZVwiIHx8IHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdID09PSBcIkVcIikgJiZcbiAgICAgICAgICAodGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleCArIDFdICE9PSBcInhcIiAmJiB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4ICsgMV0gIT09IFwibVwiKVxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggKz0gMTtcblxuICAgICAgICAgIC8vIFJlYWQgdGhlIHNpZ24gb2YgdGhlIGV4cG9uZW50LlxuICAgICAgICAgIGlmICh0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA9PT0gXCIrXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICh0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA9PT0gXCItXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICAgICAgZXhwc2lnbiA9IC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFRoZXJlIG11c3QgYmUgYW4gZXhwb25lbnQuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ID49IHRoaXMuX2VuZEluZGV4IHx8XG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA8IFwiMFwiIHx8XG4gICAgICAgICAgICB0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSA+IFwiOVwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50SW5kZXggPCB0aGlzLl9lbmRJbmRleCAmJlxuICAgICAgICAgICAgdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF0gPj0gXCIwXCIgJiZcbiAgICAgICAgICAgIHRoaXMuX3N0cmluZ1t0aGlzLl9jdXJyZW50SW5kZXhdIDw9IFwiOVwiXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBleHBvbmVudCAqPSAxMDtcbiAgICAgICAgICAgIGV4cG9uZW50ICs9ICh0aGlzLl9zdHJpbmdbdGhpcy5fY3VycmVudEluZGV4XSAtIFwiMFwiKTtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRJbmRleCArPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBudW1iZXIgPSBpbnRlZ2VyICsgZGVjaW1hbDtcbiAgICAgICAgbnVtYmVyICo9IHNpZ247XG5cbiAgICAgICAgaWYgKGV4cG9uZW50KSB7XG4gICAgICAgICAgbnVtYmVyICo9IE1hdGgucG93KDEwLCBleHBzaWduICogZXhwb25lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXJ0SW5kZXggPT09IHRoaXMuX2N1cnJlbnRJbmRleCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2tpcE9wdGlvbmFsU3BhY2VzT3JEZWxpbWl0ZXIoKTtcblxuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgICAgfSxcblxuICAgICAgX3BhcnNlQXJjRmxhZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJyZW50SW5kZXggPj0gdGhpcy5fZW5kSW5kZXgpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmbGFnID0gbnVsbDtcbiAgICAgICAgdmFyIGZsYWdDaGFyID0gdGhpcy5fc3RyaW5nW3RoaXMuX2N1cnJlbnRJbmRleF07XG5cbiAgICAgICAgdGhpcy5fY3VycmVudEluZGV4ICs9IDE7XG5cbiAgICAgICAgaWYgKGZsYWdDaGFyID09PSBcIjBcIikge1xuICAgICAgICAgIGZsYWcgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGZsYWdDaGFyID09PSBcIjFcIikge1xuICAgICAgICAgIGZsYWcgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2tpcE9wdGlvbmFsU3BhY2VzT3JEZWxpbWl0ZXIoKTtcbiAgICAgICAgcmV0dXJuIGZsYWc7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwYXJzZVBhdGhEYXRhU3RyaW5nID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoIXN0cmluZyB8fCBzdHJpbmcubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG5cbiAgICAgIHZhciBzb3VyY2UgPSBuZXcgU291cmNlKHN0cmluZyk7XG4gICAgICB2YXIgcGF0aERhdGEgPSBbXTtcblxuICAgICAgaWYgKHNvdXJjZS5pbml0aWFsQ29tbWFuZElzTW92ZVRvKCkpIHtcbiAgICAgICAgd2hpbGUgKHNvdXJjZS5oYXNNb3JlRGF0YSgpKSB7XG4gICAgICAgICAgdmFyIHBhdGhTZWcgPSBzb3VyY2UucGFyc2VTZWdtZW50KCk7XG5cbiAgICAgICAgICBpZiAocGF0aFNlZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGF0aERhdGEucHVzaChwYXRoU2VnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhdGhEYXRhO1xuICAgIH1cblxuICAgIHZhciBzZXRBdHRyaWJ1dGUgPSBTVkdQYXRoRWxlbWVudC5wcm90b3R5cGUuc2V0QXR0cmlidXRlO1xuICAgIHZhciByZW1vdmVBdHRyaWJ1dGUgPSBTVkdQYXRoRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlQXR0cmlidXRlO1xuXG4gICAgdmFyICRjYWNoZWRQYXRoRGF0YSA9IHdpbmRvdy5TeW1ib2wgPyBTeW1ib2woKSA6IFwiX19jYWNoZWRQYXRoRGF0YVwiO1xuICAgIHZhciAkY2FjaGVkTm9ybWFsaXplZFBhdGhEYXRhID0gd2luZG93LlN5bWJvbCA/IFN5bWJvbCgpIDogXCJfX2NhY2hlZE5vcm1hbGl6ZWRQYXRoRGF0YVwiO1xuXG4gICAgLy8gQGluZm9cbiAgICAvLyAgIEdldCBhbiBhcnJheSBvZiBjb3JyZXNwb25kaW5nIGN1YmljIGJlemllciBjdXJ2ZSBwYXJhbWV0ZXJzIGZvciBnaXZlbiBhcmMgY3VydmUgcGFyYW10ZXJzLlxuICAgIHZhciBhcmNUb0N1YmljQ3VydmVzID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIHIxLCByMiwgYW5nbGUsIGxhcmdlQXJjRmxhZywgc3dlZXBGbGFnLCBfcmVjdXJzaXZlKSB7XG4gICAgICB2YXIgZGVnVG9SYWQgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG4gICAgICAgIHJldHVybiAoTWF0aC5QSSAqIGRlZ3JlZXMpIC8gMTgwO1xuICAgICAgfTtcblxuICAgICAgdmFyIHJvdGF0ZSA9IGZ1bmN0aW9uKHgsIHksIGFuZ2xlUmFkKSB7XG4gICAgICAgIHZhciBYID0geCAqIE1hdGguY29zKGFuZ2xlUmFkKSAtIHkgKiBNYXRoLnNpbihhbmdsZVJhZCk7XG4gICAgICAgIHZhciBZID0geCAqIE1hdGguc2luKGFuZ2xlUmFkKSArIHkgKiBNYXRoLmNvcyhhbmdsZVJhZCk7XG4gICAgICAgIHJldHVybiB7eDogWCwgeTogWX07XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5nbGVSYWQgPSBkZWdUb1JhZChhbmdsZSk7XG4gICAgICB2YXIgcGFyYW1zID0gW107XG4gICAgICB2YXIgZjEsIGYyLCBjeCwgY3k7XG5cbiAgICAgIGlmIChfcmVjdXJzaXZlKSB7XG4gICAgICAgIGYxID0gX3JlY3Vyc2l2ZVswXTtcbiAgICAgICAgZjIgPSBfcmVjdXJzaXZlWzFdO1xuICAgICAgICBjeCA9IF9yZWN1cnNpdmVbMl07XG4gICAgICAgIGN5ID0gX3JlY3Vyc2l2ZVszXTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgcDEgPSByb3RhdGUoeDEsIHkxLCAtYW5nbGVSYWQpO1xuICAgICAgICB4MSA9IHAxLng7XG4gICAgICAgIHkxID0gcDEueTtcblxuICAgICAgICB2YXIgcDIgPSByb3RhdGUoeDIsIHkyLCAtYW5nbGVSYWQpO1xuICAgICAgICB4MiA9IHAyLng7XG4gICAgICAgIHkyID0gcDIueTtcblxuICAgICAgICB2YXIgeCA9ICh4MSAtIHgyKSAvIDI7XG4gICAgICAgIHZhciB5ID0gKHkxIC0geTIpIC8gMjtcbiAgICAgICAgdmFyIGggPSAoeCAqIHgpIC8gKHIxICogcjEpICsgKHkgKiB5KSAvIChyMiAqIHIyKTtcblxuICAgICAgICBpZiAoaCA+IDEpIHtcbiAgICAgICAgICBoID0gTWF0aC5zcXJ0KGgpO1xuICAgICAgICAgIHIxID0gaCAqIHIxO1xuICAgICAgICAgIHIyID0gaCAqIHIyO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNpZ247XG5cbiAgICAgICAgaWYgKGxhcmdlQXJjRmxhZyA9PT0gc3dlZXBGbGFnKSB7XG4gICAgICAgICAgc2lnbiA9IC0xO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHNpZ24gPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHIxUG93ID0gcjEgKiByMTtcbiAgICAgICAgdmFyIHIyUG93ID0gcjIgKiByMjtcblxuICAgICAgICB2YXIgbGVmdCA9IHIxUG93ICogcjJQb3cgLSByMVBvdyAqIHkgKiB5IC0gcjJQb3cgKiB4ICogeDtcbiAgICAgICAgdmFyIHJpZ2h0ID0gcjFQb3cgKiB5ICogeSArIHIyUG93ICogeCAqIHg7XG5cbiAgICAgICAgdmFyIGsgPSBzaWduICogTWF0aC5zcXJ0KE1hdGguYWJzKGxlZnQvcmlnaHQpKTtcblxuICAgICAgICBjeCA9IGsgKiByMSAqIHkgLyByMiArICh4MSArIHgyKSAvIDI7XG4gICAgICAgIGN5ID0gayAqIC1yMiAqIHggLyByMSArICh5MSArIHkyKSAvIDI7XG5cbiAgICAgICAgZjEgPSBNYXRoLmFzaW4oKCh5MSAtIGN5KSAvIHIyKS50b0ZpeGVkKDkpKTtcbiAgICAgICAgZjIgPSBNYXRoLmFzaW4oKCh5MiAtIGN5KSAvIHIyKS50b0ZpeGVkKDkpKTtcblxuICAgICAgICBpZiAoeDEgPCBjeCkge1xuICAgICAgICAgIGYxID0gTWF0aC5QSSAtIGYxO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4MiA8IGN4KSB7XG4gICAgICAgICAgZjIgPSBNYXRoLlBJIC0gZjI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZjEgPCAwKSB7XG4gICAgICAgICAgZjEgPSBNYXRoLlBJICogMiArIGYxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmMiA8IDApIHtcbiAgICAgICAgICBmMiA9IE1hdGguUEkgKiAyICsgZjI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3dlZXBGbGFnICYmIGYxID4gZjIpIHtcbiAgICAgICAgICBmMSA9IGYxIC0gTWF0aC5QSSAqIDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzd2VlcEZsYWcgJiYgZjIgPiBmMSkge1xuICAgICAgICAgIGYyID0gZjIgLSBNYXRoLlBJICogMjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB2YXIgZGYgPSBmMiAtIGYxO1xuXG4gICAgICBpZiAoTWF0aC5hYnMoZGYpID4gKE1hdGguUEkgKiAxMjAgLyAxODApKSB7XG4gICAgICAgIHZhciBmMm9sZCA9IGYyO1xuICAgICAgICB2YXIgeDJvbGQgPSB4MjtcbiAgICAgICAgdmFyIHkyb2xkID0geTI7XG5cbiAgICAgICAgaWYgKHN3ZWVwRmxhZyAmJiBmMiA+IGYxKSB7XG4gICAgICAgICAgZjIgPSBmMSArIChNYXRoLlBJICogMTIwIC8gMTgwKSAqICgxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBmMiA9IGYxICsgKE1hdGguUEkgKiAxMjAgLyAxODApICogKC0xKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHgyID0gY3ggKyByMSAqIE1hdGguY29zKGYyKTtcbiAgICAgICAgeTIgPSBjeSArIHIyICogTWF0aC5zaW4oZjIpO1xuICAgICAgICBwYXJhbXMgPSBhcmNUb0N1YmljQ3VydmVzKHgyLCB5MiwgeDJvbGQsIHkyb2xkLCByMSwgcjIsIGFuZ2xlLCAwLCBzd2VlcEZsYWcsIFtmMiwgZjJvbGQsIGN4LCBjeV0pO1xuICAgICAgfVxuXG4gICAgICBkZiA9IGYyIC0gZjE7XG5cbiAgICAgIHZhciBjMSA9IE1hdGguY29zKGYxKTtcbiAgICAgIHZhciBzMSA9IE1hdGguc2luKGYxKTtcbiAgICAgIHZhciBjMiA9IE1hdGguY29zKGYyKTtcbiAgICAgIHZhciBzMiA9IE1hdGguc2luKGYyKTtcbiAgICAgIHZhciB0ID0gTWF0aC50YW4oZGYgLyA0KTtcbiAgICAgIHZhciBoeCA9IDQgLyAzICogcjEgKiB0O1xuICAgICAgdmFyIGh5ID0gNCAvIDMgKiByMiAqIHQ7XG5cbiAgICAgIHZhciBtMSA9IFt4MSwgeTFdO1xuICAgICAgdmFyIG0yID0gW3gxICsgaHggKiBzMSwgeTEgLSBoeSAqIGMxXTtcbiAgICAgIHZhciBtMyA9IFt4MiArIGh4ICogczIsIHkyIC0gaHkgKiBjMl07XG4gICAgICB2YXIgbTQgPSBbeDIsIHkyXTtcblxuICAgICAgbTJbMF0gPSAyICogbTFbMF0gLSBtMlswXTtcbiAgICAgIG0yWzFdID0gMiAqIG0xWzFdIC0gbTJbMV07XG5cbiAgICAgIGlmIChfcmVjdXJzaXZlKSB7XG4gICAgICAgIHJldHVybiBbbTIsIG0zLCBtNF0uY29uY2F0KHBhcmFtcyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcGFyYW1zID0gW20yLCBtMywgbTRdLmNvbmNhdChwYXJhbXMpLmpvaW4oKS5zcGxpdChcIixcIik7XG5cbiAgICAgICAgdmFyIGN1cnZlcyA9IFtdO1xuICAgICAgICB2YXIgY3VydmVQYXJhbXMgPSBbXTtcblxuICAgICAgICBwYXJhbXMuZm9yRWFjaCggZnVuY3Rpb24ocGFyYW0sIGkpIHtcbiAgICAgICAgICBpZiAoaSAlIDIpIHtcbiAgICAgICAgICAgIGN1cnZlUGFyYW1zLnB1c2gocm90YXRlKHBhcmFtc1tpIC0gMV0sIHBhcmFtc1tpXSwgYW5nbGVSYWQpLnkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGN1cnZlUGFyYW1zLnB1c2gocm90YXRlKHBhcmFtc1tpXSwgcGFyYW1zW2kgKyAxXSwgYW5nbGVSYWQpLngpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjdXJ2ZVBhcmFtcy5sZW5ndGggPT09IDYpIHtcbiAgICAgICAgICAgIGN1cnZlcy5wdXNoKGN1cnZlUGFyYW1zKTtcbiAgICAgICAgICAgIGN1cnZlUGFyYW1zID0gW107XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gY3VydmVzO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgY2xvbmVQYXRoRGF0YSA9IGZ1bmN0aW9uKHBhdGhEYXRhKSB7XG4gICAgICByZXR1cm4gcGF0aERhdGEubWFwKCBmdW5jdGlvbihzZWcpIHtcbiAgICAgICAgcmV0dXJuIHt0eXBlOiBzZWcudHlwZSwgdmFsdWVzOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChzZWcudmFsdWVzKX1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBAaW5mb1xuICAgIC8vICAgVGFrZXMgYW55IHBhdGggZGF0YSwgcmV0dXJucyBwYXRoIGRhdGEgdGhhdCBjb25zaXN0cyBvbmx5IGZyb20gYWJzb2x1dGUgY29tbWFuZHMuXG4gICAgdmFyIGFic29sdXRpemVQYXRoRGF0YSA9IGZ1bmN0aW9uKHBhdGhEYXRhKSB7XG4gICAgICB2YXIgYWJzb2x1dGl6ZWRQYXRoRGF0YSA9IFtdO1xuXG4gICAgICB2YXIgY3VycmVudFggPSBudWxsO1xuICAgICAgdmFyIGN1cnJlbnRZID0gbnVsbDtcblxuICAgICAgdmFyIHN1YnBhdGhYID0gbnVsbDtcbiAgICAgIHZhciBzdWJwYXRoWSA9IG51bGw7XG5cbiAgICAgIHBhdGhEYXRhLmZvckVhY2goIGZ1bmN0aW9uKHNlZykge1xuICAgICAgICB2YXIgdHlwZSA9IHNlZy50eXBlO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcIk1cIikge1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeSA9IHNlZy52YWx1ZXNbMV07XG5cbiAgICAgICAgICBhYnNvbHV0aXplZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiTVwiLCB2YWx1ZXM6IFt4LCB5XX0pO1xuXG4gICAgICAgICAgc3VicGF0aFggPSB4O1xuICAgICAgICAgIHN1YnBhdGhZID0geTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIm1cIikge1xuICAgICAgICAgIHZhciB4ID0gY3VycmVudFggKyBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5ID0gY3VycmVudFkgKyBzZWcudmFsdWVzWzFdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIk1cIiwgdmFsdWVzOiBbeCwgeV19KTtcblxuICAgICAgICAgIHN1YnBhdGhYID0geDtcbiAgICAgICAgICBzdWJwYXRoWSA9IHk7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJMXCIpIHtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzFdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkxcIiwgdmFsdWVzOiBbeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcImxcIikge1xuICAgICAgICAgIHZhciB4ID0gY3VycmVudFggKyBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5ID0gY3VycmVudFkgKyBzZWcudmFsdWVzWzFdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkxcIiwgdmFsdWVzOiBbeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIkNcIikge1xuICAgICAgICAgIHZhciB4MSA9IHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgdmFyIHkxID0gc2VnLnZhbHVlc1sxXTtcbiAgICAgICAgICB2YXIgeDIgPSBzZWcudmFsdWVzWzJdO1xuICAgICAgICAgIHZhciB5MiA9IHNlZy52YWx1ZXNbM107XG4gICAgICAgICAgdmFyIHggPSBzZWcudmFsdWVzWzRdO1xuICAgICAgICAgIHZhciB5ID0gc2VnLnZhbHVlc1s1XTtcblxuICAgICAgICAgIGFic29sdXRpemVkUGF0aERhdGEucHVzaCh7dHlwZTogXCJDXCIsIHZhbHVlczogW3gxLCB5MSwgeDIsIHkyLCB4LCB5XX0pO1xuXG4gICAgICAgICAgY3VycmVudFggPSB4O1xuICAgICAgICAgIGN1cnJlbnRZID0geTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwiY1wiKSB7XG4gICAgICAgICAgdmFyIHgxID0gY3VycmVudFggKyBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5MSA9IGN1cnJlbnRZICsgc2VnLnZhbHVlc1sxXTtcbiAgICAgICAgICB2YXIgeDIgPSBjdXJyZW50WCArIHNlZy52YWx1ZXNbMl07XG4gICAgICAgICAgdmFyIHkyID0gY3VycmVudFkgKyBzZWcudmFsdWVzWzNdO1xuICAgICAgICAgIHZhciB4ID0gY3VycmVudFggKyBzZWcudmFsdWVzWzRdO1xuICAgICAgICAgIHZhciB5ID0gY3VycmVudFkgKyBzZWcudmFsdWVzWzVdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkNcIiwgdmFsdWVzOiBbeDEsIHkxLCB4MiwgeTIsIHgsIHldfSk7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJRXCIpIHtcbiAgICAgICAgICB2YXIgeDEgPSBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5MSA9IHNlZy52YWx1ZXNbMV07XG4gICAgICAgICAgdmFyIHggPSBzZWcudmFsdWVzWzJdO1xuICAgICAgICAgIHZhciB5ID0gc2VnLnZhbHVlc1szXTtcblxuICAgICAgICAgIGFic29sdXRpemVkUGF0aERhdGEucHVzaCh7dHlwZTogXCJRXCIsIHZhbHVlczogW3gxLCB5MSwgeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcInFcIikge1xuICAgICAgICAgIHZhciB4MSA9IGN1cnJlbnRYICsgc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeTEgPSBjdXJyZW50WSArIHNlZy52YWx1ZXNbMV07XG4gICAgICAgICAgdmFyIHggPSBjdXJyZW50WCArIHNlZy52YWx1ZXNbMl07XG4gICAgICAgICAgdmFyIHkgPSBjdXJyZW50WSArIHNlZy52YWx1ZXNbM107XG5cbiAgICAgICAgICBhYnNvbHV0aXplZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiUVwiLCB2YWx1ZXM6IFt4MSwgeTEsIHgsIHldfSk7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJBXCIpIHtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbNV07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzZdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IFwiQVwiLFxuICAgICAgICAgICAgdmFsdWVzOiBbc2VnLnZhbHVlc1swXSwgc2VnLnZhbHVlc1sxXSwgc2VnLnZhbHVlc1syXSwgc2VnLnZhbHVlc1szXSwgc2VnLnZhbHVlc1s0XSwgeCwgeV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcImFcIikge1xuICAgICAgICAgIHZhciB4ID0gY3VycmVudFggKyBzZWcudmFsdWVzWzVdO1xuICAgICAgICAgIHZhciB5ID0gY3VycmVudFkgKyBzZWcudmFsdWVzWzZdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6IFwiQVwiLFxuICAgICAgICAgICAgdmFsdWVzOiBbc2VnLnZhbHVlc1swXSwgc2VnLnZhbHVlc1sxXSwgc2VnLnZhbHVlc1syXSwgc2VnLnZhbHVlc1szXSwgc2VnLnZhbHVlc1s0XSwgeCwgeV1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIkhcIikge1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICBhYnNvbHV0aXplZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiSFwiLCB2YWx1ZXM6IFt4XX0pO1xuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwiaFwiKSB7XG4gICAgICAgICAgdmFyIHggPSBjdXJyZW50WCArIHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkhcIiwgdmFsdWVzOiBbeF19KTtcbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIlZcIikge1xuICAgICAgICAgIHZhciB5ID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICBhYnNvbHV0aXplZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiVlwiLCB2YWx1ZXM6IFt5XX0pO1xuICAgICAgICAgIGN1cnJlbnRZID0geTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwidlwiKSB7XG4gICAgICAgICAgdmFyIHkgPSBjdXJyZW50WSArIHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIlZcIiwgdmFsdWVzOiBbeV19KTtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIlNcIikge1xuICAgICAgICAgIHZhciB4MiA9IHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgdmFyIHkyID0gc2VnLnZhbHVlc1sxXTtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbMl07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzNdO1xuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIlNcIiwgdmFsdWVzOiBbeDIsIHkyLCB4LCB5XX0pO1xuXG4gICAgICAgICAgY3VycmVudFggPSB4O1xuICAgICAgICAgIGN1cnJlbnRZID0geTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHR5cGUgPT09IFwic1wiKSB7XG4gICAgICAgICAgdmFyIHgyID0gY3VycmVudFggKyBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5MiA9IGN1cnJlbnRZICsgc2VnLnZhbHVlc1sxXTtcbiAgICAgICAgICB2YXIgeCA9IGN1cnJlbnRYICsgc2VnLnZhbHVlc1syXTtcbiAgICAgICAgICB2YXIgeSA9IGN1cnJlbnRZICsgc2VnLnZhbHVlc1szXTtcblxuICAgICAgICAgIGFic29sdXRpemVkUGF0aERhdGEucHVzaCh7dHlwZTogXCJTXCIsIHZhbHVlczogW3gyLCB5MiwgeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIlRcIikge1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeSA9IHNlZy52YWx1ZXNbMV1cblxuICAgICAgICAgIGFic29sdXRpemVkUGF0aERhdGEucHVzaCh7dHlwZTogXCJUXCIsIHZhbHVlczogW3gsIHldfSk7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAodHlwZSA9PT0gXCJ0XCIpIHtcbiAgICAgICAgICB2YXIgeCA9IGN1cnJlbnRYICsgc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeSA9IGN1cnJlbnRZICsgc2VnLnZhbHVlc1sxXVxuXG4gICAgICAgICAgYWJzb2x1dGl6ZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIlRcIiwgdmFsdWVzOiBbeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmICh0eXBlID09PSBcIlpcIiB8fCB0eXBlID09PSBcInpcIikge1xuICAgICAgICAgIGFic29sdXRpemVkUGF0aERhdGEucHVzaCh7dHlwZTogXCJaXCIsIHZhbHVlczogW119KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0gc3VicGF0aFg7XG4gICAgICAgICAgY3VycmVudFkgPSBzdWJwYXRoWTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBhYnNvbHV0aXplZFBhdGhEYXRhO1xuICAgIH07XG5cbiAgICAvLyBAaW5mb1xuICAgIC8vICAgVGFrZXMgcGF0aCBkYXRhIHRoYXQgY29uc2lzdHMgb25seSBmcm9tIGFic29sdXRlIGNvbW1hbmRzLCByZXR1cm5zIHBhdGggZGF0YSB0aGF0IGNvbnNpc3RzIG9ubHkgZnJvbVxuICAgIC8vICAgXCJNXCIsIFwiTFwiLCBcIkNcIiBhbmQgXCJaXCIgY29tbWFuZHMuXG4gICAgdmFyIHJlZHVjZVBhdGhEYXRhID0gZnVuY3Rpb24ocGF0aERhdGEpIHtcbiAgICAgIHZhciByZWR1Y2VkUGF0aERhdGEgPSBbXTtcbiAgICAgIHZhciBsYXN0VHlwZSA9IG51bGw7XG5cbiAgICAgIHZhciBsYXN0Q29udHJvbFggPSBudWxsO1xuICAgICAgdmFyIGxhc3RDb250cm9sWSA9IG51bGw7XG5cbiAgICAgIHZhciBjdXJyZW50WCA9IG51bGw7XG4gICAgICB2YXIgY3VycmVudFkgPSBudWxsO1xuXG4gICAgICB2YXIgc3VicGF0aFggPSBudWxsO1xuICAgICAgdmFyIHN1YnBhdGhZID0gbnVsbDtcblxuICAgICAgcGF0aERhdGEuZm9yRWFjaCggZnVuY3Rpb24oc2VnKSB7XG4gICAgICAgIGlmIChzZWcudHlwZSA9PT0gXCJNXCIpIHtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzFdO1xuXG4gICAgICAgICAgcmVkdWNlZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiTVwiLCB2YWx1ZXM6IFt4LCB5XX0pO1xuXG4gICAgICAgICAgc3VicGF0aFggPSB4O1xuICAgICAgICAgIHN1YnBhdGhZID0geTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChzZWcudHlwZSA9PT0gXCJDXCIpIHtcbiAgICAgICAgICB2YXIgeDEgPSBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5MSA9IHNlZy52YWx1ZXNbMV07XG4gICAgICAgICAgdmFyIHgyID0gc2VnLnZhbHVlc1syXTtcbiAgICAgICAgICB2YXIgeTIgPSBzZWcudmFsdWVzWzNdO1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1s0XTtcbiAgICAgICAgICB2YXIgeSA9IHNlZy52YWx1ZXNbNV07XG5cbiAgICAgICAgICByZWR1Y2VkUGF0aERhdGEucHVzaCh7dHlwZTogXCJDXCIsIHZhbHVlczogW3gxLCB5MSwgeDIsIHkyLCB4LCB5XX0pO1xuXG4gICAgICAgICAgbGFzdENvbnRyb2xYID0geDI7XG4gICAgICAgICAgbGFzdENvbnRyb2xZID0geTI7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoc2VnLnR5cGUgPT09IFwiTFwiKSB7XG4gICAgICAgICAgdmFyIHggPSBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciB5ID0gc2VnLnZhbHVlc1sxXTtcblxuICAgICAgICAgIHJlZHVjZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkxcIiwgdmFsdWVzOiBbeCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChzZWcudHlwZSA9PT0gXCJIXCIpIHtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbMF07XG5cbiAgICAgICAgICByZWR1Y2VkUGF0aERhdGEucHVzaCh7dHlwZTogXCJMXCIsIHZhbHVlczogW3gsIGN1cnJlbnRZXX0pO1xuXG4gICAgICAgICAgY3VycmVudFggPSB4O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoc2VnLnR5cGUgPT09IFwiVlwiKSB7XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzBdO1xuXG4gICAgICAgICAgcmVkdWNlZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiTFwiLCB2YWx1ZXM6IFtjdXJyZW50WCwgeV19KTtcblxuICAgICAgICAgIGN1cnJlbnRZID0geTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHNlZy50eXBlID09PSBcIlNcIikge1xuICAgICAgICAgIHZhciB4MiA9IHNlZy52YWx1ZXNbMF07XG4gICAgICAgICAgdmFyIHkyID0gc2VnLnZhbHVlc1sxXTtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbMl07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzNdO1xuXG4gICAgICAgICAgdmFyIGN4MSwgY3kxO1xuXG4gICAgICAgICAgaWYgKGxhc3RUeXBlID09PSBcIkNcIiB8fCBsYXN0VHlwZSA9PT0gXCJTXCIpIHtcbiAgICAgICAgICAgIGN4MSA9IGN1cnJlbnRYICsgKGN1cnJlbnRYIC0gbGFzdENvbnRyb2xYKTtcbiAgICAgICAgICAgIGN5MSA9IGN1cnJlbnRZICsgKGN1cnJlbnRZIC0gbGFzdENvbnRyb2xZKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjeDEgPSBjdXJyZW50WDtcbiAgICAgICAgICAgIGN5MSA9IGN1cnJlbnRZO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlZHVjZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkNcIiwgdmFsdWVzOiBbY3gxLCBjeTEsIHgyLCB5MiwgeCwgeV19KTtcblxuICAgICAgICAgIGxhc3RDb250cm9sWCA9IHgyO1xuICAgICAgICAgIGxhc3RDb250cm9sWSA9IHkyO1xuXG4gICAgICAgICAgY3VycmVudFggPSB4O1xuICAgICAgICAgIGN1cnJlbnRZID0geTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHNlZy50eXBlID09PSBcIlRcIikge1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeSA9IHNlZy52YWx1ZXNbMV07XG5cbiAgICAgICAgICB2YXIgeDEsIHkxO1xuXG4gICAgICAgICAgaWYgKGxhc3RUeXBlID09PSBcIlFcIiB8fCBsYXN0VHlwZSA9PT0gXCJUXCIpIHtcbiAgICAgICAgICAgIHgxID0gY3VycmVudFggKyAoY3VycmVudFggLSBsYXN0Q29udHJvbFgpO1xuICAgICAgICAgICAgeTEgPSBjdXJyZW50WSArIChjdXJyZW50WSAtIGxhc3RDb250cm9sWSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgeDEgPSBjdXJyZW50WDtcbiAgICAgICAgICAgIHkxID0gY3VycmVudFk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGN4MSA9IGN1cnJlbnRYICsgMiAqICh4MSAtIGN1cnJlbnRYKSAvIDM7XG4gICAgICAgICAgdmFyIGN5MSA9IGN1cnJlbnRZICsgMiAqICh5MSAtIGN1cnJlbnRZKSAvIDM7XG4gICAgICAgICAgdmFyIGN4MiA9IHggKyAyICogKHgxIC0geCkgLyAzO1xuICAgICAgICAgIHZhciBjeTIgPSB5ICsgMiAqICh5MSAtIHkpIC8gMztcblxuICAgICAgICAgIHJlZHVjZWRQYXRoRGF0YS5wdXNoKHt0eXBlOiBcIkNcIiwgdmFsdWVzOiBbY3gxLCBjeTEsIGN4MiwgY3kyLCB4LCB5XX0pO1xuXG4gICAgICAgICAgbGFzdENvbnRyb2xYID0geDE7XG4gICAgICAgICAgbGFzdENvbnRyb2xZID0geTE7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHg7XG4gICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICB9XG5cbiAgICAgICAgZWxzZSBpZiAoc2VnLnR5cGUgPT09IFwiUVwiKSB7XG4gICAgICAgICAgdmFyIHgxID0gc2VnLnZhbHVlc1swXTtcbiAgICAgICAgICB2YXIgeTEgPSBzZWcudmFsdWVzWzFdO1xuICAgICAgICAgIHZhciB4ID0gc2VnLnZhbHVlc1syXTtcbiAgICAgICAgICB2YXIgeSA9IHNlZy52YWx1ZXNbM107XG5cbiAgICAgICAgICB2YXIgY3gxID0gY3VycmVudFggKyAyICogKHgxIC0gY3VycmVudFgpIC8gMztcbiAgICAgICAgICB2YXIgY3kxID0gY3VycmVudFkgKyAyICogKHkxIC0gY3VycmVudFkpIC8gMztcbiAgICAgICAgICB2YXIgY3gyID0geCArIDIgKiAoeDEgLSB4KSAvIDM7XG4gICAgICAgICAgdmFyIGN5MiA9IHkgKyAyICogKHkxIC0geSkgLyAzO1xuXG4gICAgICAgICAgcmVkdWNlZFBhdGhEYXRhLnB1c2goe3R5cGU6IFwiQ1wiLCB2YWx1ZXM6IFtjeDEsIGN5MSwgY3gyLCBjeTIsIHgsIHldfSk7XG5cbiAgICAgICAgICBsYXN0Q29udHJvbFggPSB4MTtcbiAgICAgICAgICBsYXN0Q29udHJvbFkgPSB5MTtcblxuICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChzZWcudHlwZSA9PT0gXCJBXCIpIHtcbiAgICAgICAgICB2YXIgcjEgPSBzZWcudmFsdWVzWzBdO1xuICAgICAgICAgIHZhciByMiA9IHNlZy52YWx1ZXNbMV07XG4gICAgICAgICAgdmFyIGFuZ2xlID0gc2VnLnZhbHVlc1syXTtcbiAgICAgICAgICB2YXIgbGFyZ2VBcmNGbGFnID0gc2VnLnZhbHVlc1szXTtcbiAgICAgICAgICB2YXIgc3dlZXBGbGFnID0gc2VnLnZhbHVlc1s0XTtcbiAgICAgICAgICB2YXIgeCA9IHNlZy52YWx1ZXNbNV07XG4gICAgICAgICAgdmFyIHkgPSBzZWcudmFsdWVzWzZdO1xuXG4gICAgICAgICAgaWYgKHIxID09PSAwIHx8IHIyID09PSAwKSB7XG4gICAgICAgICAgICByZWR1Y2VkUGF0aERhdGEucHVzaCh7dHlwZTogXCJDXCIsIHZhbHVlczogW2N1cnJlbnRYLCBjdXJyZW50WSwgeCwgeSwgeCwgeV19KTtcblxuICAgICAgICAgICAgY3VycmVudFggPSB4O1xuICAgICAgICAgICAgY3VycmVudFkgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50WCAhPT0geCB8fCBjdXJyZW50WSAhPT0geSkge1xuICAgICAgICAgICAgICB2YXIgY3VydmVzID0gYXJjVG9DdWJpY0N1cnZlcyhjdXJyZW50WCwgY3VycmVudFksIHgsIHksIHIxLCByMiwgYW5nbGUsIGxhcmdlQXJjRmxhZywgc3dlZXBGbGFnKTtcblxuICAgICAgICAgICAgICBjdXJ2ZXMuZm9yRWFjaCggZnVuY3Rpb24oY3VydmUpIHtcbiAgICAgICAgICAgICAgICByZWR1Y2VkUGF0aERhdGEucHVzaCh7dHlwZTogXCJDXCIsIHZhbHVlczogY3VydmV9KTtcblxuICAgICAgICAgICAgICAgIGN1cnJlbnRYID0geDtcbiAgICAgICAgICAgICAgICBjdXJyZW50WSA9IHk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHNlZy50eXBlID09PSBcIlpcIikge1xuICAgICAgICAgIHJlZHVjZWRQYXRoRGF0YS5wdXNoKHNlZyk7XG5cbiAgICAgICAgICBjdXJyZW50WCA9IHN1YnBhdGhYO1xuICAgICAgICAgIGN1cnJlbnRZID0gc3VicGF0aFk7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0VHlwZSA9IHNlZy50eXBlO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiByZWR1Y2VkUGF0aERhdGE7XG4gICAgfTtcblxuICAgIFNWR1BhdGhFbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiZFwiKSB7XG4gICAgICAgIHRoaXNbJGNhY2hlZFBhdGhEYXRhXSA9IG51bGw7XG4gICAgICAgIHRoaXNbJGNhY2hlZE5vcm1hbGl6ZWRQYXRoRGF0YV0gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICBzZXRBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lLCB2YWx1ZSk7XG4gICAgfTtcblxuICAgIFNWR1BhdGhFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgaWYgKG5hbWUgPT09IFwiZFwiKSB7XG4gICAgICAgIHRoaXNbJGNhY2hlZFBhdGhEYXRhXSA9IG51bGw7XG4gICAgICAgIHRoaXNbJGNhY2hlZE5vcm1hbGl6ZWRQYXRoRGF0YV0gPSBudWxsO1xuICAgICAgfVxuXG4gICAgICByZW1vdmVBdHRyaWJ1dGUuY2FsbCh0aGlzLCBuYW1lKTtcbiAgICB9O1xuXG4gICAgU1ZHUGF0aEVsZW1lbnQucHJvdG90eXBlLmdldFBhdGhEYXRhID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5ub3JtYWxpemUpIHtcbiAgICAgICAgaWYgKHRoaXNbJGNhY2hlZE5vcm1hbGl6ZWRQYXRoRGF0YV0pIHtcbiAgICAgICAgICByZXR1cm4gY2xvbmVQYXRoRGF0YSh0aGlzWyRjYWNoZWROb3JtYWxpemVkUGF0aERhdGFdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB2YXIgcGF0aERhdGE7XG5cbiAgICAgICAgICBpZiAodGhpc1skY2FjaGVkUGF0aERhdGFdKSB7XG4gICAgICAgICAgICBwYXRoRGF0YSA9IGNsb25lUGF0aERhdGEodGhpc1skY2FjaGVkUGF0aERhdGFdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXRoRGF0YSA9IHBhcnNlUGF0aERhdGFTdHJpbmcodGhpcy5nZXRBdHRyaWJ1dGUoXCJkXCIpIHx8IFwiXCIpO1xuICAgICAgICAgICAgdGhpc1skY2FjaGVkUGF0aERhdGFdID0gY2xvbmVQYXRoRGF0YShwYXRoRGF0YSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIG5vcm1hbGl6ZWRQYXRoRGF0YSA9IHJlZHVjZVBhdGhEYXRhKGFic29sdXRpemVQYXRoRGF0YShwYXRoRGF0YSkpO1xuICAgICAgICAgIHRoaXNbJGNhY2hlZE5vcm1hbGl6ZWRQYXRoRGF0YV0gPSBjbG9uZVBhdGhEYXRhKG5vcm1hbGl6ZWRQYXRoRGF0YSk7XG4gICAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZWRQYXRoRGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGlmICh0aGlzWyRjYWNoZWRQYXRoRGF0YV0pIHtcbiAgICAgICAgICByZXR1cm4gY2xvbmVQYXRoRGF0YSh0aGlzWyRjYWNoZWRQYXRoRGF0YV0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHZhciBwYXRoRGF0YSA9IHBhcnNlUGF0aERhdGFTdHJpbmcodGhpcy5nZXRBdHRyaWJ1dGUoXCJkXCIpIHx8IFwiXCIpO1xuICAgICAgICAgIHRoaXNbJGNhY2hlZFBhdGhEYXRhXSA9IGNsb25lUGF0aERhdGEocGF0aERhdGEpO1xuICAgICAgICAgIHJldHVybiBwYXRoRGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBTVkdQYXRoRWxlbWVudC5wcm90b3R5cGUuc2V0UGF0aERhdGEgPSBmdW5jdGlvbihwYXRoRGF0YSkge1xuICAgICAgaWYgKHBhdGhEYXRhLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBpZiAoaXNJRSkge1xuICAgICAgICAgIC8vIEBidWdmaXggaHR0cHM6Ly9naXRodWIuY29tL21ib3N0b2NrL2QzL2lzc3Vlcy8xNzM3XG4gICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJkXCIsIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKFwiZFwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBkID0gXCJcIjtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBhdGhEYXRhLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgIHZhciBzZWcgPSBwYXRoRGF0YVtpXTtcblxuICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgZCArPSBcIiBcIjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkICs9IHNlZy50eXBlO1xuXG4gICAgICAgICAgaWYgKHNlZy52YWx1ZXMgJiYgc2VnLnZhbHVlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBkICs9IFwiIFwiICsgc2VnLnZhbHVlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImRcIiwgZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFNWR1JlY3RFbGVtZW50LnByb3RvdHlwZS5nZXRQYXRoRGF0YSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHZhciB4ID0gdGhpcy54LmJhc2VWYWwudmFsdWU7XG4gICAgICB2YXIgeSA9IHRoaXMueS5iYXNlVmFsLnZhbHVlO1xuICAgICAgdmFyIHdpZHRoID0gdGhpcy53aWR0aC5iYXNlVmFsLnZhbHVlO1xuICAgICAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0LmJhc2VWYWwudmFsdWU7XG4gICAgICB2YXIgcnggPSB0aGlzLmhhc0F0dHJpYnV0ZShcInJ4XCIpID8gdGhpcy5yeC5iYXNlVmFsLnZhbHVlIDogdGhpcy5yeS5iYXNlVmFsLnZhbHVlO1xuICAgICAgdmFyIHJ5ID0gdGhpcy5oYXNBdHRyaWJ1dGUoXCJyeVwiKSA/IHRoaXMucnkuYmFzZVZhbC52YWx1ZSA6IHRoaXMucnguYmFzZVZhbC52YWx1ZTtcblxuICAgICAgaWYgKHJ4ID4gd2lkdGggLyAyKSB7XG4gICAgICAgIHJ4ID0gd2lkdGggLyAyO1xuICAgICAgfVxuXG4gICAgICBpZiAocnkgPiBoZWlnaHQgLyAyKSB7XG4gICAgICAgIHJ5ID0gaGVpZ2h0IC8gMjtcbiAgICAgIH1cblxuICAgICAgdmFyIHBhdGhEYXRhID0gW1xuICAgICAgICB7dHlwZTogXCJNXCIsIHZhbHVlczogW3grcngsIHldfSxcbiAgICAgICAge3R5cGU6IFwiSFwiLCB2YWx1ZXM6IFt4K3dpZHRoLXJ4XX0sXG4gICAgICAgIHt0eXBlOiBcIkFcIiwgdmFsdWVzOiBbcngsIHJ5LCAwLCAwLCAxLCB4K3dpZHRoLCB5K3J5XX0sXG4gICAgICAgIHt0eXBlOiBcIlZcIiwgdmFsdWVzOiBbeStoZWlnaHQtcnldfSxcbiAgICAgICAge3R5cGU6IFwiQVwiLCB2YWx1ZXM6IFtyeCwgcnksIDAsIDAsIDEsIHgrd2lkdGgtcngsIHkraGVpZ2h0XX0sXG4gICAgICAgIHt0eXBlOiBcIkhcIiwgdmFsdWVzOiBbeCtyeF19LFxuICAgICAgICB7dHlwZTogXCJBXCIsIHZhbHVlczogW3J4LCByeSwgMCwgMCwgMSwgeCwgeStoZWlnaHQtcnldfSxcbiAgICAgICAge3R5cGU6IFwiVlwiLCB2YWx1ZXM6IFt5K3J5XX0sXG4gICAgICAgIHt0eXBlOiBcIkFcIiwgdmFsdWVzOiBbcngsIHJ5LCAwLCAwLCAxLCB4K3J4LCB5XX0sXG4gICAgICAgIHt0eXBlOiBcIlpcIiwgdmFsdWVzOiBbXX1cbiAgICAgIF07XG5cbiAgICAgIC8vIEdldCByaWQgb2YgcmVkdW5kYW50IFwiQVwiIHNlZ3Mgd2hlbiBlaXRoZXIgcnggb3IgcnkgaXMgMFxuICAgICAgcGF0aERhdGEgPSBwYXRoRGF0YS5maWx0ZXIoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gcy50eXBlID09PSBcIkFcIiAmJiAocy52YWx1ZXNbMF0gPT09IDAgfHwgcy52YWx1ZXNbMV0gPT09IDApID8gZmFsc2UgOiB0cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubm9ybWFsaXplID09PSB0cnVlKSB7XG4gICAgICAgIHBhdGhEYXRhID0gcmVkdWNlUGF0aERhdGEocGF0aERhdGEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGF0aERhdGE7XG4gICAgfTtcblxuICAgIFNWR0NpcmNsZUVsZW1lbnQucHJvdG90eXBlLmdldFBhdGhEYXRhID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdmFyIGN4ID0gdGhpcy5jeC5iYXNlVmFsLnZhbHVlO1xuICAgICAgdmFyIGN5ID0gdGhpcy5jeS5iYXNlVmFsLnZhbHVlO1xuICAgICAgdmFyIHIgPSB0aGlzLnIuYmFzZVZhbC52YWx1ZTtcblxuICAgICAgdmFyIHBhdGhEYXRhID0gW1xuICAgICAgICB7IHR5cGU6IFwiTVwiLCAgdmFsdWVzOiBbY3ggKyByLCBjeV0gfSxcbiAgICAgICAgeyB0eXBlOiBcIkFcIiwgIHZhbHVlczogW3IsIHIsIDAsIDAsIDEsIGN4LCBjeStyXSB9LFxuICAgICAgICB7IHR5cGU6IFwiQVwiLCAgdmFsdWVzOiBbciwgciwgMCwgMCwgMSwgY3gtciwgY3ldIH0sXG4gICAgICAgIHsgdHlwZTogXCJBXCIsICB2YWx1ZXM6IFtyLCByLCAwLCAwLCAxLCBjeCwgY3ktcl0gfSxcbiAgICAgICAgeyB0eXBlOiBcIkFcIiwgIHZhbHVlczogW3IsIHIsIDAsIDAsIDEsIGN4K3IsIGN5XSB9LFxuICAgICAgICB7IHR5cGU6IFwiWlwiLCAgdmFsdWVzOiBbXSB9XG4gICAgICBdO1xuXG4gICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5vcm1hbGl6ZSA9PT0gdHJ1ZSkge1xuICAgICAgICBwYXRoRGF0YSA9IHJlZHVjZVBhdGhEYXRhKHBhdGhEYXRhKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBhdGhEYXRhO1xuICAgIH07XG5cbiAgICBTVkdFbGxpcHNlRWxlbWVudC5wcm90b3R5cGUuZ2V0UGF0aERhdGEgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgY3ggPSB0aGlzLmN4LmJhc2VWYWwudmFsdWU7XG4gICAgICB2YXIgY3kgPSB0aGlzLmN5LmJhc2VWYWwudmFsdWU7XG4gICAgICB2YXIgcnggPSB0aGlzLnJ4LmJhc2VWYWwudmFsdWU7XG4gICAgICB2YXIgcnkgPSB0aGlzLnJ5LmJhc2VWYWwudmFsdWU7XG5cbiAgICAgIHZhciBwYXRoRGF0YSA9IFtcbiAgICAgICAgeyB0eXBlOiBcIk1cIiwgIHZhbHVlczogW2N4ICsgcngsIGN5XSB9LFxuICAgICAgICB7IHR5cGU6IFwiQVwiLCAgdmFsdWVzOiBbcngsIHJ5LCAwLCAwLCAxLCBjeCwgY3krcnldIH0sXG4gICAgICAgIHsgdHlwZTogXCJBXCIsICB2YWx1ZXM6IFtyeCwgcnksIDAsIDAsIDEsIGN4LXJ4LCBjeV0gfSxcbiAgICAgICAgeyB0eXBlOiBcIkFcIiwgIHZhbHVlczogW3J4LCByeSwgMCwgMCwgMSwgY3gsIGN5LXJ5XSB9LFxuICAgICAgICB7IHR5cGU6IFwiQVwiLCAgdmFsdWVzOiBbcngsIHJ5LCAwLCAwLCAxLCBjeCtyeCwgY3ldIH0sXG4gICAgICAgIHsgdHlwZTogXCJaXCIsICB2YWx1ZXM6IFtdIH1cbiAgICAgIF07XG5cbiAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubm9ybWFsaXplID09PSB0cnVlKSB7XG4gICAgICAgIHBhdGhEYXRhID0gcmVkdWNlUGF0aERhdGEocGF0aERhdGEpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGF0aERhdGE7XG4gICAgfTtcblxuICAgIFNWR0xpbmVFbGVtZW50LnByb3RvdHlwZS5nZXRQYXRoRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgeyB0eXBlOiBcIk1cIiwgdmFsdWVzOiBbdGhpcy54MS5iYXNlVmFsLnZhbHVlLCB0aGlzLnkxLmJhc2VWYWwudmFsdWVdIH0sXG4gICAgICAgIHsgdHlwZTogXCJMXCIsIHZhbHVlczogW3RoaXMueDIuYmFzZVZhbC52YWx1ZSwgdGhpcy55Mi5iYXNlVmFsLnZhbHVlXSB9XG4gICAgICBdO1xuICAgIH07XG5cbiAgICBTVkdQb2x5bGluZUVsZW1lbnQucHJvdG90eXBlLmdldFBhdGhEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGF0aERhdGEgPSBbXTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBvaW50cy5udW1iZXJPZkl0ZW1zOyBpICs9IDEpIHtcbiAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5wb2ludHMuZ2V0SXRlbShpKTtcblxuICAgICAgICBwYXRoRGF0YS5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAoaSA9PT0gMCA/IFwiTVwiIDogXCJMXCIpLFxuICAgICAgICAgIHZhbHVlczogW3BvaW50LngsIHBvaW50LnldXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGF0aERhdGE7XG4gICAgfTtcblxuICAgIFNWR1BvbHlnb25FbGVtZW50LnByb3RvdHlwZS5nZXRQYXRoRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBhdGhEYXRhID0gW107XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wb2ludHMubnVtYmVyT2ZJdGVtczsgaSArPSAxKSB7XG4gICAgICAgIHZhciBwb2ludCA9IHRoaXMucG9pbnRzLmdldEl0ZW0oaSk7XG5cbiAgICAgICAgcGF0aERhdGEucHVzaCh7XG4gICAgICAgICAgdHlwZTogKGkgPT09IDAgPyBcIk1cIiA6IFwiTFwiKSxcbiAgICAgICAgICB2YWx1ZXM6IFtwb2ludC54LCBwb2ludC55XVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcGF0aERhdGEucHVzaCh7XG4gICAgICAgIHR5cGU6IFwiWlwiLFxuICAgICAgICB2YWx1ZXM6IFtdXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHBhdGhEYXRhO1xuICAgIH07XG4gIH0pKCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGRyYXdMaW5lXG5cbi8vIGRyYXdMaW5lIDo6IChTdHlsZSwgRCwgcG9pbnRTZXEpIC0+IFNWR1BhdGhFbGVtZW50XG5cbmNvbnN0IHN2Z05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJ1xuLy8gY29uc3QgY29tbWFuZFNpemUgPSB7XG4vLyAgIE06IDIsICAgTDogMiwgICBROiA0LFxuLy8gICBUOiAyLCAgIEM6IDYsICAgUzogNCwgICBaOiAwXG4vLyAgIC8vIFRPRE8gbWlzc2luZyBBLCBILCBWXG4vLyB9XG5cbmZ1bmN0aW9uIGRyYXdMaW5lKHN0eWxlcywgZGF0YVBhaXJzLCBwRGF0YSkge1xuICBjb25zdCBkYXRhID0gZGF0YVBhaXJzLnJlZHVjZSgoYSwgeCkgPT4gKFxuICAgIFsuLi5hLCAuLi54XVxuICApLCBbXSlcbiAgY29uc3QgcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdOUywgJ3BhdGgnKVxuICBPYmplY3QuYXNzaWduKHAuc3R5bGUsIHN0eWxlcylcbiAgbGV0IGkgPSAwXG4gIGxldCBkYXRhSW5kZXggPSAwXG4gIHdoaWxlIChpIDwgcERhdGEubGVuZ3RoKSB7XG4gICAgY29uc3QgY29tbWFuZCA9IHBEYXRhW2ldXG4gICAgY29uc3Qgc2l6ZSA9IGNvbW1hbmQudmFsdWVzLmxlbmd0aCAvLyBjb21tYW5kU2l6ZVtjb21tYW5kLnR5cGVdXG4gICAgY29tbWFuZC52YWx1ZXMgPSBkYXRhLnNsaWNlKGRhdGFJbmRleCwgc2l6ZSArIGRhdGFJbmRleClcbiAgICBkYXRhSW5kZXggKz0gc2l6ZVxuICAgIGkrK1xuICB9XG4gIHAuc2V0UGF0aERhdGEocERhdGEpXG4gIHJldHVybiBwXG59XG4iLCJjb25zdCBzdmdOUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydcbmNvbnN0IHN2ZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3N2ZycpXG5jb25zdCBwaXBlID0gcmVxdWlyZSgnLi9waXBlJylcblxuXG5jb25zdCBkcmF3UG9pbnQgPSAocCwgY29sKSA9PiB7XG4gIGNvbnN0IGVsID0gY2lyY2xlQ3JlYXRvcihwKVxuICBlbC5zdHlsZS5maWxsID0gY29sXG4gIHN2Zy5hcHBlbmRDaGlsZChlbClcbn1cblxuZXhwb3J0cy5kcmF3UG9pbnQgPSBkcmF3UG9pbnRcblxuLy8gYXNzdW1pbmcgYSBwYXRoIG9mIG9ubHkgTSBhbmQgQyBUT0RPXG5jb25zdCBkaXZpZGVJblZlY3RvciA9IHBkID0+XG4gIHBkLnJlZHVjZSgoYWMsIHgpID0+IHtcbiAgICBpZiAoeC50eXBlID09PSAnTScpXG4gICAgICBhYy5wdXNoKHsgcG9pbnQ6IHgudmFsdWVzLCB2ZWN0b3I6IG51bGwgfSlcbiAgICBpZiAoeC50eXBlID09PSAnQycpIHtcbiAgICAgIGFjW2FjLmxlbmd0aCAtIDFdLnZlY3RvciA9IFt4LnZhbHVlc1swXSwgeC52YWx1ZXNbMV1dXG4gICAgICBhYy5wdXNoKHsgcG9pbnQ6IFt4LnZhbHVlc1syXSwgeC52YWx1ZXNbM11dLCB2ZWN0b3I6IFt4LnZhbHVlc1s0XSwgeC52YWx1ZXNbNV1dIH0pXG4gICAgfVxuICAgIHJldHVybiBhY1xuICB9LCBbXSlcblxuZXhwb3J0cy5kaXZpZGVJblZlY3RvciA9IGRpdmlkZUluVmVjdG9yXG5cblxuLy8gZ2V0UG9pbnRzIE9iamVjdCAtPiBbW051bWJlciwgTnVtYmVyXV1cbmNvbnN0IGdldFBvaW50cyA9IChwZCkgPT4gcGQucmVkdWNlKChhYywgeCkgPT4ge1xuICBsZXQgYXJyYXkgPSB4LnZhbHVlc1xuICB3aGlsZSAoYXJyYXkubGVuZ3RoID4gMCkge1xuICAgIGFjLnB1c2goW2FycmF5WzBdLCBhcnJheVsxXV0pXG4gICAgYXJyYXkgPSBhcnJheS5zbGljZSgyKVxuICB9XG4gIHJldHVybiBhY1xufSwgW10pXG4vLyBsaXN0T2ZDaXJjbGVzIDo6IFtbTnVtYmVyLCBOdW1iZXJdXSAtPiBbQ2lyY2xlTm9kZV1cbmNvbnN0IGxpc3RPZkNpcmNsZXMgPSAobGlzdCkgPT4gbGlzdC5tYXAoY2lyY2xlQ3JlYXRvcilcbmNvbnN0IGNpcmNsZUNyZWF0b3IgPSAoYSkgPT4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdOUywgJ2NpcmNsZScpXG4gIGVsLnNldEF0dHJpYnV0ZSgnY3gnLCBhWzBdKVxuICBlbC5zZXRBdHRyaWJ1dGUoJ2N5JywgYVsxXSlcbiAgcmV0dXJuIGVsXG59XG5cbmNvbnN0IGNvbG9yQXJyYXkgPSBbJ2dyZWVuJywgJ2JsdWUnLCAncmVkJywgJ3llbGxvdycsICdwdXJwbGUnXVxuY29uc3QgY29sb3JJdCA9IGNvbG9yQXJyYXlbU3ltYm9sLml0ZXJhdG9yXSgpXG4vLyBjb2xvcml6ZSA6OiBbQ2lyY2xlTm9kZV0gLT4gY29sb3JcbmNvbnN0IGNvbG9yaXplID0gbGlzdCA9PiB7XG4gIC8vIGNvbnN0IGNvbG9yID0gY29sb3JBcnJheS5zbGljZShjb3VudENvbCsrICVjb2xvckFycmF5Lmxlbmd0aClbMF1cbiAgY29uc3QgY29sb3IgPSBjb2xvckl0Lm5leHQoKS52YWx1ZVxuICByZXR1cm4gbGlzdC5tYXAoeCA9PiB7XG4gICAgeC5zdHlsZS5maWxsID0gY29sb3JcbiAgICByZXR1cm4geFxuICB9KVxufVxuXG5jb25zdCBwb2ludHNGcmFnbWVudCA9IHBvaW50cyA9PiBwb2ludHMucmVkdWNlKChhYywgeCkgPT4ge1xuICBhYy5hcHBlbmRDaGlsZCh4KVxuICByZXR1cm4gYWNcbn0sIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSlcblxuY29uc3QgcGF0aERhdGFUb0hhbmRsZXMgPSBwaXBlKFxuICBnZXRQb2ludHMsXG4gIGxpc3RPZkNpcmNsZXMsXG4gIGNvbG9yaXplLFxuICBwb2ludHNGcmFnbWVudFxuKVxuXG4vLyBjb25zdCBkYXRhcyA9IHBhdGhzLm1hcCh4ID0+IHguZ2V0UGF0aERhdGEoKSlcbi8vICAgICAgICAgICAgICAgICAgICAgICAubWFwKHBhdGhEYXRhVG9IYW5kbGVzKVxuLy8gZGF0YXMuZm9yRWFjaCh4ID0+IHtcbi8vICAgc3ZnLmFwcGVuZENoaWxkKHgpXG4vLyB9KVxuIiwiY29uc3QgcGlwZSA9IHJlcXVpcmUoJy4vcGlwZScpXG5jb25zdCBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQnKVxuY29uc3QgU2VnbWVudCA9IHJlcXVpcmUoJy4vc2VnbWVudCcpXG4vLyBkcmF3UG9pbnQgZm9yIHRlc3Rcbi8vIGNvbnN0IHsgZHJhd1BvaW50IH0gPSByZXF1aXJlKCcuL2RyYXcnKVxuXG4vLyBnZXRQb2ludHM6OiBwYXRoRGF0YSAtPiBbUG9pbnRdXG5jb25zdCBnZXRQb2ludHMgPSBwZCA9PlxuICBwZC5yZWR1Y2UoKGFjLCB4KSA9PiB7XG4gICAgbGV0IGkgPSAwXG4gICAgd2hpbGUgKGkgKyAyIDw9IHgudmFsdWVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgW2EsIGJdID0geC52YWx1ZXMuc2xpY2UoaSwgaSArIDIpXG4gICAgICBhYy5wdXNoKG5ldyBQb2ludChhLCBiKSlcbiAgICAgIGkgPSBpICsgMlxuICAgIH1cbiAgICByZXR1cm4gYWNcbiAgfSwgW10pXG5cbi8vIGNvbnRyb2xQb2x5Z29uU2VnbWVudHMgOjpcbi8vIFtQb2ludF0gLT4gW1NlZ21lbnRdXG4vLyBnaXZlbiBhbiBhcnJheSBvZiBwb2ludHMgaXQgZ2l2ZXMgYmFjayBhbiBhcnJheSBvZiBzZWdtZW50c1xuY29uc3QgY29udHJvbFBvbHlnb25TZWdtZW50cyA9IHBvaW50cyA9PlxuICBwb2ludHMucmVkdWNlKChhYywgeCwgaSwgYXJyKSA9PiB7XG4gICAgaWYgKGkgPT09IDApXG4gICAgICByZXR1cm4gYWNcbiAgICBhYy5wdXNoKG5ldyBTZWdtZW50KGFycltpIC0gMV0sIHgpKVxuICAgIHJldHVybiBhY1xuICB9LCBbXSlcblxuLy8gW1NlZ21lbnRdIC0+IFtTZWdtZW50LCBOdWxsXVxuY29uc3Qgb2Zmc2V0U2VnbWVudHMgPSBvZmYgPT4gc2VnbWVudHMgPT4gc2VnbWVudHMubWFwKHMgPT4ge1xuICBpZiAocy56ZXJvTGVuZ3RoKCkpXG4gICAgcmV0dXJuIG51bGxcblxuICBjb25zdCBvZmZzZXRMaW5lID0gcy5saW5lKCkub2Zmc2V0KG9mZilcbiAgY29uc3Qgb2Zmc2V0UG9pbnRzID0gbmV3IFNlZ21lbnQoXG4gICAgb2Zmc2V0TGluZS5wcm9qZWN0aW9uKHMucDEpLFxuICAgIG9mZnNldExpbmUucHJvamVjdGlvbihzLnAyKVxuICApXG4gIHJldHVybiBvZmZzZXRQb2ludHNcbn0pXG4vLyBbU2VnbWVudF0gLT4gW1BvaW50LCBOdWxsXVxuY29uc3Qgb2Zmc2V0U2VnbWVudHNDb250cm9sUG9pbnRzID0gb2ZmID0+IHNlZ21lbnRzID0+IHNlZ21lbnRzLnJlZHVjZSgoYWMsIHMsIGksIGFycikgPT4ge1xuICBjb25zdCBvZmZzZXRMaW5lID0gcy56ZXJvTGVuZ3RoKCkgPyBudWxsIDogcy5saW5lKCkub2Zmc2V0KG9mZilcblxuICBpZiAoaSA9PT0gMCkge1xuICAgIGlmICghb2Zmc2V0TGluZSlcbiAgICAgIGFjLnB1c2gobnVsbClcbiAgICBlbHNlIHtcbiAgICAgIGFjLnB1c2gob2Zmc2V0TGluZS5wcm9qZWN0aW9uKHMucDEpKVxuICAgIH1cbiAgfVxuXG4gIGlmIChpIDwgYXJyLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAoIW9mZnNldExpbmUpXG4gICAgICBhYy5wdXNoKG51bGwpXG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBmb2xsb3dpbmdWYWxpZFNlZyA9IG5vblplcm9sZW5ndGhmYWxsRnJvbnQoYXJyLCBpKVxuICAgICAgYWMucHVzaChcbiAgICAgICAgZm9sbG93aW5nVmFsaWRTZWcgP1xuICAgICAgICBvZmZzZXRMaW5lLmludGVyc2VjdGlvbihmb2xsb3dpbmdWYWxpZFNlZy5saW5lKCkub2Zmc2V0KG9mZikpIDpcbiAgICAgICAgb2Zmc2V0TGluZS5wcm9qZWN0aW9uKHMucDIpXG4gICAgICApXG4gICAgfVxuICB9XG4gIGVsc2UgeyAvLyBsYXN0IHBvaW50XG4gICAgaWYgKCFvZmZzZXRMaW5lKVxuICAgICAgYWMucHVzaChudWxsKVxuICAgIGVsc2VcbiAgICAgIGFjLnB1c2gob2Zmc2V0TGluZS5wcm9qZWN0aW9uKHMucDIpKVxuICB9XG4gIHJldHVybiBhY1xufSwgW10pXG4vLyB1dGlsaXR5IG9mIG9mZnNldFNlZ21lbnRzQ29udHJvbFBvaW50c1xuZnVuY3Rpb24gbm9uWmVyb2xlbmd0aGZhbGxGcm9udChhcnIsIGkpIHtcbiAgd2hpbGUgKCsraSA8IGFyci5sZW5ndGgpIHtcbiAgICBpZiAoISBhcnJbaV0uemVyb0xlbmd0aCgpKVxuICAgICAgcmV0dXJuIGFycltpXVxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbi8vIFtTZWdtZW50LCBOdWxsXSAtPiBbU2VnbWVudF1cbmNvbnN0IGZhbGxiYWNrRm9yWmVyb0xlbmd0aCA9IHNlZ1BvaW50cyA9PiBzZWdQb2ludHMubWFwKChjcCwgaSwgYXJyKSA9PiAoXG4gIGNwICE9PSBudWxsID9cbiAgY3AgOlxuICBmYWxsYmFja0NwKGFyciwgaSlcbikpXG5cbmZ1bmN0aW9uIGZhbGxiYWNrQ3AoYXJyLCBpKSB7XG4gIGxldCBiaSA9IGlcbiAgd2hpbGUgKC0tYmkgPiAtMSkge1xuICAgIGlmIChhcnJbYmldKSByZXR1cm4gYXJyW2JpXVxuICB9XG4gIGxldCBmaSA9IGlcbiAgd2hpbGUgKCsrZmkgPCBhcnIubGVuZ3RoKSB7XG4gICAgaWYgKGFycltmaV0pIHJldHVybiBhcnJbZmldXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdhbGwgemVyb0xlbmd0aCBzZWdtZW50cycpXG59XG5cbi8vIHV0aWxpdHkgb2YgZmFsbGJhY2tGb3JaZXJvTGVuZ3RoXG4vLyBmdW5jdGlvbiBsb29rRm9yMlBvaW50cyhhcnIsIGkpIHtcbi8vICAgY29uc3QgcDIgPSBwb2ludFdpdGhGYWxsQmFja0Zyb250d2FyZChhcnIsIGkpXG4vLyAgIGNvbnN0IHAxID0gaSA9PT0gMCA/IHAyIDogYXJyW2kgLSAxXS5wMlxuLy8gICBpZiAoIXAxICYmICFwMikgdGhyb3cgbmV3IEVycm9yKCdhbGwgemVyb0xlbmd0aCBzZWdtZW50cycpXG4vLyAgIHJldHVybiAoXG4vLyAgICAgcDEgJiYgcDIgP1xuLy8gICAgIG5ldyBTZWdtZW50KHAxLCBwMikgOlxuLy8gICAgIG5ldyBTZWdtZW50KHAxLCBwMSkgLy8gaWYgYXQgdGhlIGVuZCB0aGVyZSdzIG5vIHZhbGlkIHBvaW50IHJlcGVhdCBwMVxuLy8gICApXG4vLyB9XG4vLyAvLyB1dGlsaXR5IG9mIGxvb2tGb3IyUG9pbnRzXG4vLyBmdW5jdGlvbiBwb2ludFdpdGhGYWxsQmFja0Zyb250d2FyZChhcnIsIGluZGV4KSB7XG4vLyAgIGxldCBpID0gaW5kZXggLSAxXG4vLyAgIHdoaWxlICgrK2kgPCBhcnIubGVuZ3RoKSB7XG4vLyAgICAgaWYgKGFycltpXSlcbi8vICAgICAgIHJldHVybiBhcnJbaV0ucDFcbi8vICAgfVxuLy8gICByZXR1cm4gbnVsbFxuLy8gfVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9mZiA9PiBwaXBlKFxuICAgIGdldFBvaW50cyxcbiAgICBjb250cm9sUG9seWdvblNlZ21lbnRzLFxuICAgIG9mZnNldFNlZ21lbnRzQ29udHJvbFBvaW50cyhvZmYpLFxuICAgICh4ID0+IHgubWFwKHMgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ3MnLCBzKVxuICAgICAgcmV0dXJuIHNcbiAgICB9KSksXG4gICAgZmFsbGJhY2tGb3JaZXJvTGVuZ3RoLFxuICAgICh4ID0+IHgubWFwKHMgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ2ZhbGxiYWNrZWQnLCBzKVxuICAgICAgcmV0dXJuIHNcbiAgICB9KSlcbiAgKVxuXG5cbiAgLy8gY29uc3Qgc2VnbWVudHNUb0xpbmVQb2ludHMgPSBzZWdtZW50cyA9PiBzZWdtZW50cy5yZWR1Y2UoKGFjLCBzLCBpLCBhcnIpID0+IHtcbiAgLy8gICBpZiAoaSA9PT0gMCkge1xuICAvLyAgICAgY29uc3QgZmlyc3QgPSBsaW5lV2l0aEZhbGxCYWNrRnJvbnR3YXJkKHMucDEsIGFyciwgaSlcbiAgLy8gICAgIGFjLnB1c2goZmlyc3QpXG4gIC8vICAgfVxuICAvLyAgIGNvbnN0IGJlZm9yZSA9IGFjLnNsaWNlKC0xKVswXVxuICAvLyAgIGlmIChzLnplcm9MZW5ndGgoKSkge1xuICAvLyAgICAgYWMucHVzaChiZWZvcmUpXG4gIC8vICAgfVxuICAvLyAgIGVsc2UgaWYgKGkgPCBhcnIubGVuZ3RoIC0gMSkge1xuICAvLyAgICAgY29uc3QgYWZ0ZXIgPSBsaW5lV2l0aEZhbGxCYWNrRnJvbnR3YXJkKHMucDIsIGFyciwgaSArIDEpXG4gIC8vICAgICBjb25zdCBsaW5lID0gYmVmb3JlICYmIGFmdGVyID9cbiAgLy8gICAgICAgbGluZXNSb3RhdGlvbkxlcnAocy5wMiwgYmVmb3JlLCBhZnRlcikgOlxuICAvLyAgICAgICBiZWZvcmVcbiAgLy8gICAgIGFjLnB1c2gobGluZSlcbiAgLy8gICB9XG4gIC8vICAgZWxzZSB7XG4gIC8vICAgICBhYy5wdXNoKHMubGluZShzLnAyKSlcbiAgLy8gICB9XG4gIC8vICAgcmV0dXJuIGFjXG4gIC8vIH0sIFtdKVxuICAvLyBmdW5jdGlvbiBsaW5lc1JvdGF0aW9uTGVycChjZW50ZXIsIHNlZ0Zyb20sIHNlZ1RvKSB7XG4gIC8vICAgY29uc3QgYmVmb3JlUmFkID0gTWF0aC5hdGFuKHNlZ0Zyb20ubSlcbiAgLy8gICBjb25zdCBhZnRlclJhZCA9IE1hdGguYXRhbihzZWdUby5tKVxuICAvLyAgIGNvbnN0IGluY3JlbWVudCA9IChhZnRlclJhZCAtIGJlZm9yZVJhZCkgLyAyXG4gIC8vICAgY29uc3QgbSA9IE1hdGgudGFuKGJlZm9yZVJhZCArIGluY3JlbWVudClcbiAgLy8gICBjb25zdCBpbnRlciA9IGlzRmluaXRlKG0pID9cbiAgLy8gICBjZW50ZXIueSArIG0gKiAtY2VudGVyLnggOlxuICAvLyAgIGNlbnRlci54XG4gIC8vICAgcmV0dXJuIG5ldyBMaW5lKG0sIGludGVyLCBjZW50ZXIpXG4gIC8vIH1cbiAgLy8gZnVuY3Rpb24gbGluZVdpdGhGYWxsQmFja0Zyb250d2FyZChwLCBhcnIsIGluZGV4KSB7XG4gIC8vICAgbGV0IGkgPSBpbmRleCAtIDFcbiAgLy8gICB3aGlsZSAoKytpIDwgYXJyLmxlbmd0aCkge1xuICAvLyAgICAgaWYgKCEgYXJyW2ldLnplcm9MZW5ndGgoKSlcbiAgLy8gICAgICAgcmV0dXJuIGFycltpXS5saW5lKHApXG4gIC8vICAgfVxuICAvLyB9XG4iLCJjb25zdCBQb2ludCA9IHJlcXVpcmUoJy4vcG9pbnQnKVxuXG5cbmNsYXNzIExpbmUge1xuICBjb25zdHJ1Y3RvcihtLCBpbnRlciwgY2VudGVyKSB7XG4gICAgdGhpcy5tID0gbVxuICAgIHRoaXMuaW50ZXIgPSBpbnRlclxuICAgIHRoaXMudmVydGljYWwgPSAhIGlzRmluaXRlKHRoaXMubSlcbiAgICB0aGlzLmhvcml6b250YWwgPSB0aGlzLm0gPT09IDBcbiAgICB0aGlzLmNlbnRlciA9IGNlbnRlclxuICB9XG4gIGZ1bmMoeCkge1xuICAgIHJldHVybiAoXG4gICAgICBpc0Zpbml0ZSh0aGlzLm0pID9cbiAgICAgIHRoaXMubSAqIHggKyB0aGlzLmludGVyIDpcbiAgICAgIHRoaXMuaW50ZXJcbiAgICApXG4gIH1cbiAgb2Zmc2V0KG4pIHtcbiAgICBpZiAoISBpc0Zpbml0ZSh0aGlzLm0pKVxuICAgICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMubSwgdGhpcy5pbnRlciAtIG4pXG5cbiAgICBjb25zdCB2ZXJ0RGlzcGxhY2VtZW50ID0gbiAqIE1hdGguc3FydCgxICsgTWF0aC5wb3codGhpcy5tLCAyKSkgKyB0aGlzLmludGVyXG4gICAgLy8gbiAvIE1hdGguY29zKE1hdGguYXRhbih0aGlzLm0pKSArIHRoaXMuaW50ZXIgVE9ETyBjaGVjayB3aHkgdGhpcyBkb24ndCB3b3JrXG4gICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMubSwgdmVydERpc3BsYWNlbWVudClcbiAgfVxuICBpbnRlcnNlY3Rpb24ob3RoZXIpIHtcbiAgICAvLyByZXR1cm4gZWl0aGVyIGEgUG9pbnQgOiBbTnVtYmVyLCBOdW1iZXJdXG4gICAgLy8gdHJ1ZSBpbiBjYXNlIGl0J3MgdGhlIHNhbWUgbGluZVxuICAgIC8vIGZhbHNlIGluIGNhc2UgcGFyYWxsZWxcbiAgICBpZiAodGhpcy52ZXJ0aWNhbCAmJiBvdGhlci52ZXJ0aWNhbClcbiAgICAgIHJldHVybiB0aGlzLmludGVyID09PSBvdGhlci5pbnRlclxuICAgIGlmICh0aGlzLnZlcnRpY2FsKSByZXR1cm4gbmV3IFBvaW50KHRoaXMuaW50ZXIsIG90aGVyLmZ1bmModGhpcy5pbnRlcikpXG4gICAgaWYgKG90aGVyLnZlcnRpY2FsKSB7XG4gICAgICByZXR1cm4gbmV3IFBvaW50KG90aGVyLmludGVyLCB0aGlzLmZ1bmMob3RoZXIuaW50ZXIpKVxuICAgIH1cbiAgICBjb25zdCBjcm9zc2luZ1ggPSAodGhpcy5pbnRlciAtIG90aGVyLmludGVyKSAvIChvdGhlci5tIC0gdGhpcy5tKVxuICAgIHJldHVybiAoXG4gICAgICBpc05hTihjcm9zc2luZ1gpID8gdHJ1ZSA6IC8vIHNhbWUgbSBzYW1lIGludGVyXG4gICAgICAhIGlzRmluaXRlKGNyb3NzaW5nWCkgPyBmYWxzZSA6IC8vIHNhbWUgbSBkaWZmZXJlbnQgaW50ZXJcbiAgICAgIG5ldyBQb2ludChjcm9zc2luZ1gsIHRoaXMuZnVuYyhjcm9zc2luZ1gpKVxuICAgIClcbiAgfVxuICBwcm9qZWN0aW9uKHApIHtcbiAgICBjb25zdCBtMiA9IC0xIC8gdGhpcy5tXG4gICAgY29uc3QgaW50ZXIyID0gaXNGaW5pdGUobTIpID8gcC55IC0gbTIgKiBwLnggOiBwLnhcbiAgICBjb25zdCBsMiA9IG5ldyBMaW5lKG0yLCBpbnRlcjIpXG4gICAgcmV0dXJuIHRoaXMuaW50ZXJzZWN0aW9uKGwyKVxuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICguLi5hcnIpID0+IGFyZyA9PlxuICBhcnIucmVkdWNlKChhYywgZikgPT4gZihhYyksIGFyZylcbiIsIlxuY2xhc3MgUG9pbnQge1xuICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgdGhpcy54ID0geFxuICAgIHRoaXMueSA9IHlcbiAgfVxuICBpc0VxdWFsKG90aGVyKSB7XG4gICAgcmV0dXJuIHRoaXMueCA9PT0gb3RoZXIueCAmJiB0aGlzLnkgPT09IG90aGVyLnlcbiAgfVxufVxuXG5Qb2ludC5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKiAoKSB7XG4gIHlpZWxkIHRoaXMueFxuICB5aWVsZCB0aGlzLnlcbn1cbm1vZHVsZS5leHBvcnRzID0gUG9pbnRcbiIsImNvbnN0IFBvaW50ID0gcmVxdWlyZSgnLi9wb2ludCcpXG5jb25zdCBMaW5lID0gcmVxdWlyZSgnLi9saW5lJylcblxuXG5jbGFzcyBTZWdtZW50IHtcbiAgY29uc3RydWN0b3IocDEsIHAyKSB7XG4gICAgdGhpcy5wMSA9IHAxIGluc3RhbmNlb2YgUG9pbnQgPyBwMSA6IG5ldyBQb2ludChwMVswXSwgcDFbMV0pXG4gICAgdGhpcy5wMiA9IHAyIGluc3RhbmNlb2YgUG9pbnQgPyBwMiA6IG5ldyBQb2ludChwMlswXSwgcDJbMV0pXG4gICAgdGhpcy5tID0gKHRoaXMucDEueSAtIHRoaXMucDIueSkgLyAodGhpcy5wMS54IC0gdGhpcy5wMi54KVxuICB9XG4gIGdldExpbmVPclBvaW50KCkge1xuICAgIHJldHVybiAoXG4gICAgICBpc05hTih0aGlzLm0pID9cbiAgICAgIHRoaXMucDEgOlxuICAgICAgdGhpcy5saW5lKClcbiAgICApXG4gIH1cbiAgbGluZShjZW50ZXIpIHtcbiAgICBpZiAodGhpcy56ZXJvTGVuZ3RoKCkpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHNpbmdsZSBsaW5lIGF2YWlsYWJsZSBmb3IgemVybyBsZW5ndGggc2VnbWVudCcpXG5cbiAgICBjb25zdCBpbnRlciA9IGlzRmluaXRlKHRoaXMubSkgP1xuICAgIHRoaXMucDEueSArIHRoaXMubSAqIC10aGlzLnAxLnggOlxuICAgIHRoaXMucDEueFxuXG4gICAgcmV0dXJuIG5ldyBMaW5lKHRoaXMubSwgaW50ZXIsIGNlbnRlcilcbiAgfVxuICB6ZXJvTGVuZ3RoKCkge1xuICAgIHJldHVybiB0aGlzLnAxLmlzRXF1YWwodGhpcy5wMilcbiAgfVxufVxuXG5TZWdtZW50LnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24qICgpIHtcbiAgeWllbGQgdGhpcy5wMS54XG4gIHlpZWxkIHRoaXMucDEueVxuICB5aWVsZCB0aGlzLnAyLnhcbiAgeWllbGQgdGhpcy5wMi55XG4gIHJldHVyblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNlZ21lbnRcbiJdfQ==
