window.jQuery = $ = require("jquery");
require("popper.js");
require('bootstrap');
require('tarteaucitronjs/tarteaucitron');

console.log('Can you read this? If so then JS is being bundled. What about some bootstrap stuff to show that Browserify has worked?')

if (typeof $.fn.popover == 'function') {
    console.log('popover loaded. Hooray!');
}else{
    console.log('popover failed to load. Boohoo :|');
}
