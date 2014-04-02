// Load highlight.js and find all highlightable code blocks.
// Also, see if they are eval'able and hook that in as well

define(['Highlight'], function(hljs){
  'use strict';

  // Highlighting
  return {
    run: function(){
      var i, l, codeBlocks, code;
      codeBlocks = document.querySelectorAll('code.block');
      for(i = 0, l = codeBlocks.length; i < l; i++){
        code = codeBlocks[i].textContent || codeBlocks[i].innerText;
        codeBlocks[i].innerHTML = hljs.highlight('javascript', code).value;
        if(codeBlocks[i].className.indexOf('-evalable') && Element.prototype.addEventListener){
          (function(code){
            var btn = document.createElement('button');
            btn.className = 'evaler';
            btn.innerHTML = 'Run';
            btn.addEventListener('click', function(){
              eval(code);
            });
            codeBlocks[i].parentNode.insertBefore(btn, codeBlocks[i]);
          })(code)
        }
      }
    }
  };
});




 