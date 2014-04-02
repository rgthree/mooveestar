// ConsoleLogoAnimation
// Animates a logo in the console using a tieout and console.clear

define([], function(){

  'use strict';

  var mvs = [
    '┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐',
    '│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │',
    '│ · ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ · │',
    '│ · │    ___  ___   _____   _____   __   __   ______   ______   ______   ________    ___     _______    │ · │',
    '│ · │   |   ?/   | |     | |     | |  | |  | |   ___| |   ___| |      | |        |  /   ?   |   _   |   │ · │',
    '│ · │   |        | |  |  | |  |  | |  | |  | |  |__   |  |__    ?  ?__|  ‾‾|  |‾‾  /  |  ?  |   |   |   │ · │',
    '│ · │   |        | |  |  | |  |  | |  | |  | |   __|  |   __|    ?  ?      |  |   |   ‾   | |   ‾  <    │ · │',
    '│ · │   |  |?/|  | |  |  | |  |  |  ?  ‾  /  |  |___  |  |___  |‾‾?  ?     |  |   |  |‾|  | |  |‾|  |   │ · │',
    '│ · │   |  |  |  | |     | |     |   ?   /   |      | |      | |      |    |  |   |  | |  | |  | |  |   │ · │',
    '│ · │    ‾‾    ‾‾   ‾‾‾‾‾   ‾‾‾‾‾     ‾‾‾     ‾‾‾‾‾‾   ‾‾‾‾‾‾   ‾‾‾‾‾‾      ‾‾     ‾‾   ‾‾   ‾‾   ‾‾    │ · │',
    '│ · │                                                                   Put Your App in the Spotlight   │ · │',
    '│ · └───────────────────────────────────────────────────────────────────────────────────────────────────┘ · │',
    '│ · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · │',
    '└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘'
  ];


  function run(frame){
    var logoWidth, logoHeight, col, row, output, chars;
    if(window.console && console.log){
      if(console.clear){
        logoWidth = mvs[0].length;
        logoHeight = mvs.length;
        output = [];
        for(col = 0; col < logoHeight; col++){
          chars = '';
          for(row = 0; row < logoWidth+logoHeight+1; row++){
            if((col + row) === frame && row < logoWidth){
              chars += '/';
            }else if((col + row) < frame && row <= frame){
              chars += mvs[col][row] || '';
            }else{
              chars += '';
            }
          }
          output.push(chars.replace(/\?/g, '\\'));
        }

        console.clear();
        console.log(output.join('\n'));
        if(frame < logoWidth+logoHeight+1)
          setTimeout(function(){ run(++frame); }, 8);
      }else{
        console.log(mvs.join('\n'));
      }
    }
  }
  
  return {
    run: function(){ run(0); }
  };

});


