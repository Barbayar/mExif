## mExif

mExif is a memory efficient TIFF, Exif and GPS tags scanner. You can use it for retrieving photo information before upload on client side.

usage:
```
mExif.debugMode = true;
mExif.scan(e.target.files[0], function(result) {
  $('#photoInfo').text(JSON.stringify(result, null, '\t'));
});
```
