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
    nearestNeighbor: function(src, dst) {
        var wSrc = src.width;
        var hSrc = src.height;
        var wDst = dst.width;
        var hDst = dst.height;
        var bufSrc = src._data.data;
        var bufDst = dst._data.data;
        for (var i = 0; i < hDst; i++) {
            for (var j = 0; j < wDst; j++) {
                var pos = (i * wDst + j) * 4;
                var nni = Math.round(i * hSrc / hDst);
                var nnj = Math.round(j * wSrc / wDst);
                var nnPos = (nni * wSrc + nnj) * 4;
                
                bufDst[pos++] = bufSrc[nnPos++];
                bufDst[pos++] = bufSrc[nnPos++];
                bufDst[pos++] = bufSrc[nnPos++];
                bufDst[pos++] = bufSrc[nnPos++];
            }
        }
    },
    bilinearInterpolation: function(src, dst) {
        var wSrc = src.width;
        var hSrc = src.height;
        var wDst = dst.width;
        var hDst = dst.height;
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
            var posMin = (yMin * wSrc + xMin) * 4 + offset;
            var posMax = (yMin * wSrc + xMax) * 4 + offset;
            var vMin = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
            
            // special case, y is integer
            if (yMax === yMin) {
                bufDst[pos+offset] = vMin;
            } else {
                posMin = (yMax * wSrc + xMin) * 4 + offset;
                posMax = (yMax * wSrc + xMax) * 4 + offset;
                var vMax = interpolate(x, xMin, bufSrc[posMin], xMax, bufSrc[posMax]);
                
                bufDst[pos+offset] = interpolate(y, yMin, vMin, yMax, vMax);
            }
        }
        
        for (var i = 0; i < hDst; i++) {
            for (var j = 0; j < wDst; j++) {
                var pos = (i * wDst + j) * 4;
                
                // x & y in src coordinates
                var x = j * wSrc / wDst;
                var xMin = Math.floor(x);
                var xMax = Math.min(Math.ceil(x), wSrc);
                
                var y = i * hSrc / hDst;
                var yMin = Math.floor(y);
                var yMax = Math.min(Math.ceil(y), hSrc);
                
                assign(pos, 0, x, xMin, xMax, y, yMin, yMax);
                assign(pos, 1, x, xMin, xMax, y, yMin, yMax);
                assign(pos, 2, x, xMin, xMax, y, yMin, yMax);
                assign(pos, 3, x, xMin, xMax, y, yMin, yMax);
            }
        }
    }
}