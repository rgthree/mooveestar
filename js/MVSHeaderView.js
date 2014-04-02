define(['Modernizr', 'MooVeeStar'], function(Modernizr, MooVeeStar){

  // We need to keep track of what name to use for animation
  // events per browser with this IIFE
  (function addAnimationEventNames(){
    var animEndEventNames, animEndEventName, evtObj;
    animEndEventNames = {
        'WebkitAnimation' : 'webkitAnimationEnd',
        'MozAnimation'    : 'animationend',
        'OAnimation'      : 'oanimationend',
        'msAnimation'     : 'MSAnimationEnd',
        'animation'       : 'animationend'
    },
    Modernizr._animation = Modernizr.prefixed('animation');
    animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];
    evtObj = {};
    evtObj[animEndEventName] = 2
    Element.NativeEvents = Object.merge(Element.NativeEvents, evtObj);
    Modernizr._animationend = animEndEventName;
  })();


  MooVeeStar.templates.register('star', '<span class="star"><span><span></span></span></span>');
  var MVSHeaderView = new Class({
    Extends: MooVeeStar.View,
    events: {
      'click':'shoot'
    },
    initialize: function(element, options){
      this.element = element;
      this.parent(null, options);
    },
    render: function(){ return this; },
    shoot: function(e){
      var styles = {};
      if(!this.element.getFirst('.star')){
        // Randomize some values
        styles.top = Number.random(10, 50);
        styles.left = Number.random(50, window.getSize().x-50);
        styles[Modernizr.prefixed('transform')] = 'rotate('+((Number.random(1,2) % 2 === 0 ? 180 : 0) - Number.random(-10,10))+'deg)';

        // Attach the star
        this.element.grab(MooVeeStar.templates.inflate('star').setStyles(styles).addEvent(Modernizr._animationend, function(e){ this.destroy(); }));
        this.fireEvent('shoot'); 
      }
    }
  });

  return MVSHeaderView;

});