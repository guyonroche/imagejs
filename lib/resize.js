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
    }
}