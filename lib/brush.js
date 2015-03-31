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

var Enums = require("./enums");
var Utils = require("./utils");

// default pad colour
var transparentBlack = {
    r: 0, g: 0, b: 0, a: 0
};

var SolidBrush = function(options) {
    this.color = options.color;
};

SolidBrush.prototype = {
    getColor: function(x,y, left, top, color) {
        color = color || {};
        color.r = this.color.r;
        color.g = this.color.g;
        color.b = this.color.b;
        color.a = this.color.a;
        return color;
    }
};

var GradientBrush = function(options) {
    switch (options.gradient) {
        case "direction":
            this.type = 1;
            var angle = options.radians !== undefined ? options.radians : 3.141592653589793 * options.degrees / 180;
            this.sin = Math.sin(angle);
            this.cos = Math.cos(angle);
            this.
            break;
        case "radial":
            this.type = 2;
            this.center = options.center;
            this.radius = this._calculateRadius(this.center.x,this.center.y)
            break;
    }
    this.path = options.path;
};

GradientBrush.prototype = {
    
    getColor: function(x,y, left, top, color) {
        color = color || {};
        switch (this.type) {
            case 1:
                var x2 = x - 0.5;
                var y2 = y - 0.5;
                var x3 = this.cos * x2 - this.sin * y2;
                //var y3 = this.sin * x2 + this.cos * y2;
                return this._interpolateColor(x3, color);
            case 2:
                var dx = x - this.center.x;
                var dy = y - this.center.y;
                var d = Math.sqrt(dx*dx+dy*dy);
                return this._interpolateColor(d, color);
            default:
                return transparentBlack;
        }
    },
    
    _calculateRadius: function(x,y) {
        var maxX = Math.max(x, 1-x);
        var maxY = Math.max(y, 1-y);
        return Math.sqrt(maxX*maxX + maxY*maxY);
    },
    
    _interpolateColor: function(d, color) {
        // expecting this.path to have steps from 0 to 1
        var index = 0;
        while ((index < this.path.length-1) && (d >= this.path[index+1].position)) {
            index++;
        }
        var step1 = this.path[index];
        var step2 = this.path[index+1];
        var coeff1 = step2.position - d;
        var coeff2 = d - step1.position;
        var divisor = step2.position - step1.position;
        color.r = (coeff1 * step1.color.r + coeff2 * step2.color.r) / divisor;
        color.g = (coeff1 * step1.color.g + coeff2 * step2.color.g) / divisor;
        color.b = (coeff1 * step1.color.b + coeff2 * step2.color.b) / divisor;
        color.a = (coeff1 * step1.color.a + coeff2 * step2.color.a) / divisor;
        return color;
    }
};

module.exports = {
    Solid: SolidBrush,
    Gradient: GradientBrush
}