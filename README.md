Svg Contour
===

Function for creating the outline path of any SVGGeometryElement:

```javascript
svgContour(elem, offset);
svgContour(elem, config);
```

The second parameter to the function can either be a number or a configuration object,  
in case the config form is used the offset must specified in the object.

The options available for the configuration are:
 - `offset: Number` *required*  
 Sets the offset in the elements svg units.
 - `append: [Bool]`  
 by default it is set to true, and the new path is automatically appended to the element's parent node,  
 if set to false the newly created element won't be attached.
 - `style: [Object]`  
 this object is merged into the new element's style object (the properties must be in camel case format),  
 if not specified the style object of the originating element are used.


 The function returns the outline path element.

 Example
 ------
 ```javascript
const path = document.querySelector('path')

svgContour(path, 10)

const ellipse = document.querySelector('ellipse')
svgContour(ellipse, {
  offset: -5,
  style: { strokeWidth: 1, strokeDasharray: '1,3', stroke: '#00ff00', fill: 'none' }
})
```

Svg contour relies on [**getPathData() and setPathData() polyfill**](https://github.com/jarek-foksa/path-data-polyfill.js) for polyfilling and normalizing pathData.

TODO
---
 - Decide how to ship the svgContour feature (prototype, function , ...)
 - ~~Breakup curve into smaller curve when too steep~~
 - Find ratio between steepness and offset size
 - Define a [fill modes, and regions options](https://svgwg.org/specs/strokes/#SpecifyingStrokeAlignment)
