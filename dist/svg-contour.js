(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

        f1 = Math.asin(parseFloat(((y1 - cy) / r2).toFixed(9)));
        f2 = Math.asin(parseFloat(((y2 - cy) / r2).toFixed(9)));

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

},{}],2:[function(require,module,exports){
const redrawSteep = require('./utils/redraw-steep-curve')
const contourPathData = require('./utils/contour-path-data')
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
  if (!op.style) { // if using default style object let's copy most used attributes for path ..
    const common = ['fill', 'stroke', 'stoke-width', 'stoke-dasharray', 'stroke-linecap', 'stroke-linejoin']
    common.reduce((ac, x) => (
      el.getAttribute(x) ?
      Object.assign(ac, { [x]: el.getAttribute(x) }) :
      ac
    ), style)
  }
  if (typeof style !== 'object')
    throw Error('svgContour append option must be a object')

  // we always use getPathData({normalized:true})
  const pathData = el.getPathData({ normalize: true })

  // before processing the path data increase the control points if needed
  const flattenedPathData = redrawSteep(0.3)(pathData) // TODO steepness should be somehow related to offness

  // contourPathData creates the offset path data
  const contourD = contourPathData(offset)(flattenedPathData)

  // drawLine draws a new path retracing the offset path data on top of flattened path data
  const contourPath = drawLine(style, contourD, flattenedPathData)

  if (append)
    el.parentElement.appendChild(contourPath)

  return contourPath
}

module.exports = svgContour

},{"./utils/contour-path-data":3,"./utils/draw-line":4,"./utils/redraw-steep-curve":9}],3:[function(require,module,exports){
const pipe = require('./pipe')
const Point = require('./point')
const Segment = require('./segment')
// drawPoint for test
const { drawSeg } = require('./draw')

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


// [Segment] -> [Point, Null]
const offsetControlSegments = off => segments => segments.reduce((ac, s, i, arr) => {
  // keep track of slope changes through reverse property
  const offsetLine = s.zeroLength() ? null : s.line(s.p2).offset(off, s.reverse)

  if (i === 0) {
    if (!offsetLine) {
      const followingValidSeg = nonZerolengthfallFront(arr, i)
      const rev = followingValidSeg.reverse
      const offsetFirstPoint = followingValidSeg.line().offset(off, rev).projection(s.p1)
      ac.push(new Segment(s.p1, offsetFirstPoint))
    }
    else {
      ac.push(new Segment(s.p1, offsetLine.projection(s.p1)))
    }
  }
  if (i < arr.length - 1) {
    if (!offsetLine)
      ac.push(null)
    else {
      const followingValidSeg = nonZerolengthfallFront(arr, i)
      const rev = followingValidSeg.reverse
      ac.push(
        followingValidSeg ?
        new Segment(s.p2, offsetLine.intersection(followingValidSeg.line(s.p2).offset(off, rev))) :
        new Segment(s.p2, offsetLine.projection(s.p2))
      )
    }
  }
  else { // last point
    if (!offsetLine)
      ac.push(null)
    else
      ac.push(new Segment(s.p2, offsetLine.projection(s.p2)))
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

const mapToPointOfSeg = segments => segments.map(x => x.p2)
module.exports = off => pipe(
    getPoints,
    controlPolygonSegments,
    offsetControlSegments(off),
    fallbackForZeroLength,
    // (x => {
    //   x.forEach(s => {
    //     drawSeg(s.p1, s.p2)
    //   })
    //   return x
    // }),
    mapToPointOfSeg
  )

},{"./draw":5,"./pipe":7,"./point":8,"./segment":10}],4:[function(require,module,exports){
module.exports = drawLine

// drawLine :: (Style, D, pointSeq) -> SVGPathElement

const svgNS = 'http://www.w3.org/2000/svg'
// const commandSize = {
//   M: 2,   L: 2,   Q: 4,
//   T: 2,   C: 6,   S: 4,   Z: 0
//   // TODO missing A, H, V
// }

function drawLine(styles, dataPairs, pData) {
  const data = dataPairs.reduce((a, s) => (
    [...a, ...s]
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
/**
 * this file has some testing functions that can draw
 * segments points etc.
 * NB not used in production
 */

const svgNS = 'http://www.w3.org/2000/svg'
const svg = document.querySelector('svg')

exports.drawPath = (pd, c) => {
  const el = document.createElementNS(svgNS, 'path')
  el.setPathData(pd)
  el.style.stroke = c
  el.style.strokeWidth = 4
  svg.appendChild(el)
}
const drawPoint = (p, col) => {
  const el = circleCreator(p)
  el.style.fill = col
  svg.appendChild(el)
}
exports.drawPoint = drawPoint

const drawSeg = (from, to) => {
  const f = circleCreator(from)
  f.style.fill = 'lime'
  const t = circleCreator(to)
  t.style.fill = 'magenta'
  const l = lineCreator(from, to)
  const els = [f, t, l]
  els.forEach(x => svg.appendChild(x))
}
exports.drawSeg = drawSeg

function lineCreator(from, to) {
  const [x1, y1] = from
  const [x2, y2] = to
  const el = document.createElementNS(svgNS, 'line')
  el.setAttribute('x1', x1)
  el.setAttribute('y1', y1)
  el.setAttribute('y2', y2)
  el.setAttribute('x2', x2)
  return el
}
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

exports.drawCubic = function drawCubic(data, c) {
  const el = createCubic(data)
  el.style.stroke = c
  svg.appendChild(el)
}
function createCubic(data) {
  const [p1, c1, c2, p2] = data
  const el = document.createElementNS(svgNS, 'path')
  el.setPathData([
    { type: 'M', values: [...p1] },
    { type: 'C', values: [...c1, ...c2, ...p2] }
  ])
  return el
}

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
  el.setAttribute('cx', a.x)
  el.setAttribute('cy', a.y)
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


// const datas = paths.map(x => x.getPathData())
//                       .map(pathDataToHandles)
// datas.forEach(x => {
//   svg.appendChild(x)
// })

},{}],6:[function(require,module,exports){
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
  offset(n, reverse) {
    if (reverse)
      n = -n

    if (! isFinite(this.m)) {
      const vert = new Line(this.m, this.inter - n)
      vert.center = this.center ? vert.projection(this.center) : null
      return vert
    }

    const vertDisplacement = n * Math.sqrt(1 + Math.pow(this.m, 2)) + this.inter
    // n / Math.cos(Math.atan(this.m)) + this.inter TODO check why this don't work
    const line = new Line(this.m, vertDisplacement)
    line.center = this.center ? line.projection(this.center) : null
    return line
  }
  intersection(other) {
    // return either a Point : [Number, Number]
    // or throw

    if (this.vertical && other.vertical) {
      if (this.inter !== other.inter) {
        throw new Error('parallel vertical lines don\'t intersect')
      }
      return other.center || this.center
    }
    if (this.vertical)
      return new Point(this.inter, other.func(this.inter))
    if (other.vertical)
      return new Point(other.inter, this.func(other.inter))

    const crossingX = (this.inter - other.inter) / (other.m - this.m)

    if (Math.abs(crossingX) === Infinity)
      throw new Error('parallel lines don\'t intersect')
    if (isNaN(crossingX) && !other.center && !this.center) // same m different inter (parallel)
      throw new Error('same lines don\'t intersect - if center is set it will be used as fallback')

    return (
      isNaN(crossingX) && other.center ? other.center :
      isNaN(crossingX) && this.center ? this.center : // if we're dealing with same line we fallback on a center property if present
      isFinite(crossingX) ? new Point(crossingX, this.func(crossingX)) : // standard case
      null
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

},{"./point":8}],7:[function(require,module,exports){
module.exports = (...arr) => arg =>
  arr.reduce((ac, f) => f(ac), arg)

},{}],8:[function(require,module,exports){

class Point {
  constructor(x, y) {
    this.x = Number(x.toPrecision(5))
    this.y = Number(y.toPrecision(5))
  }
  isEqual(other) {
    return this.x === other.x && this.y === other.y
  }
  lerp(other, t) {
    const x = this.x + (other.x - this.x) * t
    const y = this.y + (other.y - this.y) * t
    return new Point(x, y)
  }
  avg(other) {
    return this.lerp(other, 0.5)
  }
  dist(other) {
    return Math.hypot(this.x - other.x, this.y - other.y)
  }
}

Point.prototype[Symbol.iterator] = function* () {
  yield this.x
  yield this.y
}

module.exports = Point

},{}],9:[function(require,module,exports){

const Point = require('./point')
const pipe = require('./pipe')

// recursive utility for checking and dividing curve
const splitIfSteep = fr => (curve) => {
  const [p1, c1, c2, p2] = curve
  const mid = (c1.avg(c2).avg(p1.avg(c1))).avg(c1.avg(c2).avg(p2.avg(c1)))
  const h = mid.dist(p1.avg(p2))

  if (fr * p1.dist(p2) > h)
    return inflateCurveToPathSegments(curve) // base case

  const curve1 = [p1, p1.avg(c1), c1.avg(c2).avg(p1.avg(c1)), mid]
  const curve2 = [mid, c1.avg(c2).avg(p2.avg(c2)), p2.avg(c2), p2]
  return [...splitIfSteep(fr)(curve1), ...splitIfSteep(fr)(curve2)]
}

// PathSeg -> [Point]
const flattenPathSeg = ps => {
  const ac = []
  let i = 0
  while (i + 2 <= ps.values.length) {
    const [a, b] = ps.values.slice(i, i + 2)
    ac.push(new Point(a, b))
    i = i + 2
  }
  return ac
}
// [Point] -> [PathSeg]
const inflateCurveToPathSegments = ([p1, c1, c2, p2]) => ([
  { type: 'L', values: [...p1] },
  { type: 'C', values: [...c1, ...c2, ...p2] }
])

// goes throug the points and checks curve steepness,
// in case it's too steep it splits recursevily until flat enough
const redrawSteepCurve = flatRatio => pd =>
  pd.reduce((ac, ps, i, arr) => {
    if (ps.type !== 'C')
      return [...ac, ps]

    const p1 = new Point(...arr[i - 1].values.slice(-2))
    const rest = flattenPathSeg(ps)
    return [
      ...ac,
      ...splitIfSteep(flatRatio)([p1, ...rest])]
  }, [])

const simplifyPoints = pathdata =>
  pathdata.reduce((ac, ps, i, arr) => {
    if (ps.type === 'L' && i < arr.length - 1) { // we suppose L will never be first point..
      const current = new Point(...ps.values)
      const leading = new Point(...arr[i - 1].values.slice(-2))
      if (current.isEqual(leading))
        return ac
    }
    return [...ac, ps]
  }, [])

module.exports = off => pipe(
  redrawSteepCurve(off),
  simplifyPoints
)

},{"./pipe":7,"./point":8}],10:[function(require,module,exports){
const Point = require('./point')
const Line = require('./line')


class Segment {
  constructor(p1, p2) {
    this.p1 = p1 instanceof Point ? p1 : new Point(p1[0], p1[1])
    this.p2 = p2 instanceof Point ? p2 : new Point(p2[0], p2[1])
    this.m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x)
    this.reverse = this.p2.x < this.p1.x || (!isFinite(this.m) && this.p1.y > this.p2.y)
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


module.exports = Segment

},{"./line":6,"./point":8}],11:[function(require,module,exports){
require('./path-data-polyfill')
const svgContour = require('./svg-contour')

if (typeof window === 'undefined')
  throw new Error('svgContour is developed for browser only, \n' +
  'if you want to create an offset pathData from an SVG path data outside the DOM\n' +
  'take look at src/utils/{redraw-steep-curve.js, contour-path-data.js} files')

window.svgContour = svgContour

},{"./path-data-polyfill":1,"./svg-contour":2}]},{},[11]);
