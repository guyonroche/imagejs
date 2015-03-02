/**
 * Copyright (c) 2015 Guyon Roche
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:</p>
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
"use strict";

var _ = require("underscore");
var Promise = require("bluebird");


module.exports = {
    _pad: function(dst, options) {
        var top = options.bounds.top;
        var left = options.bounds.left;
        var bottom = top + options.bounds.height;
        var right = left + options.bounds.width;
        
        // optimization - quit now if top and left are zero
        if (!top && !left) {
            return;
        }
        
        var width = dst.width;
        var height = dst.height;

        var data = dst._data.data;
        var r = options.padColor.r;
        var g = options.padColor.g;
        var b = options.padColor.b;
        var a = options.padColor.a;
        var i, j, pos;
        
        // top margin
        for (i = 0; i < top; i++) {
            for (j = 0; j < width; j++) {
                pos = (i * width + j) * 4;
                data[pos++] = r;
                data[pos++] = g;
                data[pos++] = b;
                data[pos++] = a;                
            }
        }
        // bottom margin
        for (i = bottom; i < height; i++) {
            for (j = 0; j < width; j++) {
                pos = (i * width + j) * 4;
                data[pos++] = r;
                data[pos++] = g;
                data[pos++] = b;
                data[pos++] = a;                
            }
        }
        // left margin
        for (i = 0; i < height; i++) {
            for (j = 0; j < left; j++) {
                pos = (i * width + j) * 4;
                data[pos++] = r;
                data[pos++] = g;
                data[pos++] = b;
                data[pos++] = a;                
            }
        }
        // right margin
        for (i = 0; i < height; i++) {
            for (j = right; j < width; j++) {
                pos = (i * width + j) * 4;
                data[pos++] = r;
                data[pos++] = g;
                data[pos++] = b;
                data[pos++] = a;                
            }
        }
    },
    
    nearestNeighbor: function(src, dst, options) {
        this._pad(dst, options);
        
        var srcWidth = src.width;
        var srcHeight = src.height;
        var dstWidth = dst.width;
        var dstHeight = dst.height;
        
        var tSrc = options.crop.top;
        var lSrc = options.crop.left;
        var wSrc = options.crop.width;
        var hSrc = options.crop.height;
        var bSrc = tSrc + hSrc;
        var rSrc = lSrc + wSrc;
        //console.log("tSrc="+tSrc + ", lSrc="+lSrc + ", wSrc="+wSrc + ", hSrc="+hSrc + ", bSrc="+bSrc + ", rSrc="+rSrc);        
        
        var tDst = options.bounds.top;
        var lDst = options.bounds.left;
        var wDst = options.bounds.width;
        var hDst = options.bounds.height;
        var bDst = tDst + hDst;
        var rDst = lDst + wDst;
        //console.log("tDst="+tDst + ", lDst="+lDst + ", wDst="+wDst + ", hDst="+hDst + ", bDst="+bDst + ", rDst="+rDst);
        
        var bufSrc = src._data.data;
        var bufDst = dst._data.data;

        for (var i = tDst; i < bDst; i++) {
            for (var j = lDst; j < rDst; j++) {
                var posDst = (i * dstWidth + j) * 4;

                var iSrc = tSrc + Math.round((i-tDst) * hSrc / hDst);
                var jSrc = lSrc + Math.round((j-lDst) * wSrc / wDst);
                var posSrc = (iSrc * srcWidth + jSrc) * 4;
                
                bufDst[posDst++] = bufSrc[posSrc++];
                bufDst[posDst++] = bufSrc[posSrc++];
                bufDst[posDst++] = bufSrc[posSrc++];
                bufDst[posDst++] = bufSrc[posSrc++];
            }
        }
    },
    bilinearInterpolation: function(src, dst, options) {
        this._pad(dst, options);
        
        var srcWidth = src.width;
        var srcHeight = src.height;
        var dstWidth = dst.width;
        var dstHeight = dst.height;
        
        var tSrc = options.crop.top;
        var lSrc = options.crop.left;
        var wSrc = options.crop.width;
        var hSrc = options.crop.height;
        var bSrc = tSrc + hSrc;
        var rSrc = lSrc + wSrc;
        //console.log("tSrc="+tSrc + ", lSrc="+lSrc + ", wSrc="+wSrc + ", hSrc="+hSrc + ", bSrc="+bSrc + ", rSrc="+rSrc);        
        
        var tDst = options.bounds.top;
        var lDst = options.bounds.left;
        var wDst = options.bounds.width;
        var hDst = options.bounds.height;
        var bDst = tDst + hDst;
        var rDst = lDst + wDst;
        //console.log("tDst="+tDst + ", lDst="+lDst + ", wDst="+wDst + ", hDst="+hDst + ", bDst="+bDst + ", rDst="+rDst);
        
        var bufSrc = src._data.data;
        var bufDst = dst._data.data;
        
        var interpolate = function(k, kMin, vMin, kMax, vMax) {
            // special case - k is integer
            if (kMin === kMax) {
                return vMin;
            }
            
            return Math.round((k - kMin) * vMax + (kMax - k) * vMin);
        };
        var assign = function(pos, offset, x, xMin, xMax, y, yMin, yMax) {
            var posMin = (yMin * srcWidth + xMin) * 4 + offset;
            var posMax = (yMin * srcWidth + xMax) * 4 + offset;
            var vMin = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
            
            // special case, y is integer
            if (yMax === yMin) {
                bufDst[pos+offset] = vMin;
            } else {
                posMin = (yMax * srcWidth + xMin) * 4 + offset;
                posMax = (yMax * srcWidth + xMax) * 4 + offset;
                var vMax = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
                
                bufDst[pos+offset] = interpolate(y, yMin, vMin, yMax, vMax);
            }
        }
        
        for (var i = tDst; i < bDst; i++) {
            for (var j = lDst; j < rDst; j++) {
                var posDst = (i * dstWidth + j) * 4;
                
                // x & y in src coordinates
                var x = lSrc + (j-lDst) * wSrc / wDst;
                var xMin = Math.floor(x);
                var xMax = Math.min(Math.ceil(x), rSrc-1);
                
                var y = tSrc + (i-tDst) * hSrc / hDst;
                var yMin = Math.floor(y);
                var yMax = Math.min(Math.ceil(y), bSrc-1);
                
                assign(posDst, 0, x, xMin, xMax, y, yMin, yMax);
                assign(posDst, 1, x, xMin, xMax, y, yMin, yMax);
                assign(posDst, 2, x, xMin, xMax, y, yMin, yMax);
                assign(posDst, 3, x, xMin, xMax, y, yMin, yMax);
            }
        }
    },

    _bicubicInterpolation: function(src, dst, options, interpolate) {
        this._pad(dst, options);
        
        var srcWidth = src.width;
        var srcHeight = src.height;
        var dstWidth = dst.width;
        var dstHeight = dst.height;
        
        var tSrc = options.crop.top;
        var lSrc = options.crop.left;
        var wSrc = options.crop.width;
        var hSrc = options.crop.height;
        var bSrc = tSrc + hSrc;
        var rSrc = lSrc + wSrc;
        //console.log("tSrc="+tSrc + ", lSrc="+lSrc + ", wSrc="+wSrc + ", hSrc="+hSrc + ", bSrc="+bSrc + ", rSrc="+rSrc);        
        
        var tDst = options.bounds.top;
        var lDst = options.bounds.left;
        var wDst = options.bounds.width;
        var hDst = options.bounds.height;
        var bDst = tDst + hDst;
        var rDst = lDst + wDst;
        //console.log("tDst="+tDst + ", lDst="+lDst + ", wDst="+wDst + ", hDst="+hDst + ", bDst="+bDst + ", rDst="+rDst);
        
        var bufSrc = src._data.data;
        var bufDst = dst._data.data;
        
        // ===========================================================
        // Pass 1 - interpolate scanlines
        
        // buf1 has width of dst and height of src
        var buf1 = new Buffer(wDst * hSrc * 4);
        for (var i = 0; i < hSrc; i++) {
            for (var j = 0; j < wDst; j++) {
                // i in src coords, j in dst coords
                
                // calculate x in src crop coords
                var x = j * wSrc / wDst;
                var xPos = Math.floor(x);
                var t = x - xPos;
                var srcPos = ((i + tSrc) * srcWidth + xPos + lSrc) * 4;
                
                var buf1Pos = (i * wDst + j) * 4;
                for (var k = 0; k < 4; k++) {
                    var kPos = srcPos + k;
                    var x0 = (xPos + lSrc > 0) ? bufSrc[kPos - 4] : bufSrc[kPos];
                    var x1 = bufSrc[kPos];
                    var x2 = bufSrc[kPos + 4];
                    var x3 = (xPos + lSrc < srcWidth - 1) ? bufSrc[kPos + 8] : bufSrc[kPos + 4];
                    buf1[buf1Pos+k] = interpolate(x0,x1,x2,x3,t);
                }
            }
        }
        //var Bitmap = require("./bitmap");
        //var tmp = new Bitmap({
        //    width: wDst, height: hSrc,
        //    data: buf1
        //});
        //tmp.writeFile("out/tmp.jpg");
        
        // ===========================================================
        // Pass 2 - interpolate columns
        
        for (var i = 0; i < hDst; i++) {
            for (var j = 0; j < wDst; j++) {
                // i&j in dst coords
                
                // calculate y in buf1 coords
                var y = i * hSrc / hDst;
                var yPos = Math.floor(y);
                var t = y - yPos;
                var buf1Pos = (yPos * wDst + j) * 4;
                var dstPos = ((i+tDst) * dstWidth + j + lDst) * 4;
                for (var k = 0; k < 4; k++) {
                    var kPos = buf1Pos + k;
                    var y0 = (yPos > 0) ? buf1[kPos - wDst*4] : buf1[kPos];
                    var y1 = buf1[kPos];
                    var y2 = buf1[kPos + wDst*4];
                    var y3 = (yPos < hSrc) ? buf1[kPos + wDst*8] : buf1[kPos + wDst*4];
                    
                    bufDst[dstPos + k] = interpolate(y0,y1,y2,y3,t);
                }
            }
        }
    },
    
    bicubicInterpolation: function(src, dst, options) {
        var interpolateCubic = function(x0, x1, x2, x3, t) {
            var a0 = x3 - x2 - x0 + x1;
            var a1 = x0 - x1 - a0;
            var a2 = x2 - x0;
            var a3 = x1;
            return Math.max(0,Math.min(255,(a0 * (t * t * t)) + (a1 * (t * t)) + (a2 * t) + (a3)));
        }
        return this._bicubicInterpolation(src, dst, options, interpolateCubic);
    },
    
    hermiteInterpolation: function(src, dst, options) {
        var interpolateHermite = function(x0, x1, x2, x3, t)
        {
            var c0 = x1;
            var c1 = 0.5 * (x2 - x0);
            var c2 = x0 - (2.5 * x1) + (2 * x2) - (0.5 * x3);
            var c3 = (0.5 * (x3 - x0)) + (1.5 * (x1 - x2));
            return  Math.max(0,Math.min(255,Math.round((((((c3 * t) + c2) * t) + c1) * t) + c0)));
        }
        return this._bicubicInterpolation(src, dst, options, interpolateHermite);
    },
    
    bezierInterpolation: function(src, dst, options) {
        // between 2 points y(n), y(n+1), use next points out, y(n-1), y(n+2)
        // to predict control points (a & b) to be placed at n+0.5
        //  ya(n) = y(n) + (y(n+1)-y(n-1))/4
        //  yb(n) = y(n+1) - (y(n+2)-y(n))/4
        // then use std bezier to interpolate [n,n+1)
        //  y(n+t) = y(n)*(1-t)^3 + 3 * ya(n)*(1-t)^2*t + 3 * yb(n)*(1-t)*t^2 + y(n+1)*t^3
        //  note the 3* factor for the two control points
        // for edge cases, can choose:
        //  y(-1) = y(0) - 2*(y(1)-y(0))
        //  y(w) = y(w-1) + 2*(y(w-1)-y(w-2))
        // but can go with y(-1) = y(0) and y(w) = y(w-1)
        
    }
}