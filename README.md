Svg Contour
===

Function for creating the outline path of any SVGGeometryElement:

```javascript
svgContour(elem, offset);
svgContour(elem, config);
```

The second parameter to the function can either be a number or a configuration object,  
in case the config form is used the offset must be specified in the object.

The options available for the configuration are:
 - `offset: Number` *required*  
 Sets the offset in the elements svg units.
 - `append: [Bool]`  
 by default it is set to true, and the new path is automatically appended to the element's parent node,  
 if set to false the newly created element won't be attached.
 - `style: [Object]`  
 this object is merged into the new element's style object (the properties must be in camel case format),  
 if not specified the style object of the originating element is used and common path attributes are copied if defined.


The function returns the outline path element.

Example
------
 ```javascript
const path = document.querySelector('path')
svgContour(path, 10)

const ellipse = document.querySelector('ellipse')
svgContour(ellipse, {
      offset: -5,
      style: {
        strokeWidth: 1,
        strokeDasharray: '1,3',
        stroke: '#00ff00',
        fill: 'none'
      }
})
```

Svg contour relies on [**getPathData() and setPathData() polyfill**](https://github.com/jarek-foksa/path-data-polyfill.js) for polyfilling and normalizing pathData. Currently the polyfill is provided directly in the build but in the next releases it will be most probably moved out.

TODO
---
 - Decide how/if to ship the svgContour outside browser  
 (currently the function is attached on window object)
 - ~~Breakup curve into smaller curve when too steep~~
 - Find reasonable ratio between steepness and offset size
 - Define a [fill modes, and regions option](https://svgwg.org/specs/strokes/#SpecifyingStrokeAlignment)
 - Define behaviour on closed paths
 - Transpilling is yet to be defined



#### Npm scripts

 Running `npm start` an example build (`src/example-app.js > example/bundle.js`) will be built (and watched on)
 & the example folder will be served through http-server (http://127.0.0.1:7777/).


 The dist folder contains a distribution build ready for in browser use.
