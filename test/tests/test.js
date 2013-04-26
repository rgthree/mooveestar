(function() {
  var expect;

  var assert = chai.assert;

  describe('MooVeeStar', function(){
    it('should have addEvent', function(){
      assert.typeOf(MooVeeStar, 'object');
      assert.typeOf(MooVeeStar.addEvent, 'function');
    });

    it('should fire arbitrary event', function(){
      var t;
      MooVeeStar.addEvent('arbitrary', function(e){
        t = e.t;
      });
      MooVeeStar.fireEvent('arbitrary', {t:1});
      assert.equal(t, 1);
    });
  });


  describe('MooVeeStar.Model', function(){

    var Zebra = new Class({
      Extends: MooVeeStar.Model,

      properties: {
        bgColor: {
          initial: 'white',
          sanitize: function(value){
            return value && value.toLowerCase();
          }
        },
        fgColor: {
          initial: 'black',
          sanitize: function(value){
            return value && value.toLowerCase();
          },
          validate: function(value){
            return value !== this.get('bgColor') ? true : 'Foreground color cannot match background color (or else you would have a horse)!';
          }
        },
        color: {
          set: function(){},
          get: function(){
            return this.get('fgColor')+' and '+this.get('bgColor');
          }
        }

      }

    });

    it('should be instantiated w/ Events & Options', function(){
      var model = new Zebra();
      assert.instanceOf(model, MooVeeStar.Model);
      assert.typeOf(model.addEvent, 'function');
      assert.typeOf(model.setOptions, 'function');
    });

    describe('.properties', function(){
      it('should have initial values', function(){
        var model = new Zebra();
        assert.equal(model._props.bgColor, 'white');
        assert.equal(model._props.fgColor, 'black');
        assert.equal(model.get('bgColor'), 'white');
        assert.equal(model.get('fgColor'), 'black');
      });

      it('should have passed values (new & overriding)', function(){
        var model = new Zebra({ fgColor:'red', age:13 });
        assert.equal(model._props.fgColor, 'red');
        assert.equal(model._props.age, 13);
        assert.equal(model.get('fgColor'), 'red');
        assert.equal(model.get('age'), 13);
      });

      it('should validate properties', function(){
        var model = new Zebra({ bgColor:'brown' });
        var error, errorFgColor;
        error = errorFgColor = false;
        model.addEvent('error', function(e){
          if(e.key === 'fgColor'){
            error = true;
          }
        });
        model.addEvent('error:fgColor', function(e){
          errorFgColor = true;
        });

        // Try setting our fgColor to the background color
        model.set('fgColor', 'brown');
        assert.equal(error, true);
        assert.equal(errorFgColor, true);
        assert.equal(model.get('fgColor'), 'black');

        // Try setting bgColor, then fgColor to the same color
        error = errorFgColor = false;
        model.set({ bgColor:'red', fgColor:'red' });
        assert.equal(error, true);
        assert.equal(errorFgColor, true);
        assert.equal(model.get('bgColor'), 'red');
        assert.equal(model.get('fgColor'), 'black');

        // Uncaught here, the bg color _can_ be set to the
        // foreground according to our model's validate
        error = errorFgColor = false;
        model.set({ fgColor:'green', bgColor:'green' });
        assert.equal(error, false);
        assert.equal(errorFgColor, false);
        assert.equal(model.get('bgColor'), 'green');
        assert.equal(model.get('fgColor'), 'green');
      });

      it('should call overriden sanitize correctly', function(){
        var model = new Zebra();
        model.set('fgColor', 'GREEN');
        model.set('bgColor', 'bLUe');
        model.set('bgColor', 'bLUe');
        assert.equal(model.get('bgColor'), 'blue');
        assert.equal(model.get('fgColor'), 'green');
      });

      it('should call overriden get/set correctly', function(){
        var model = new Zebra();
        model.set('color', 'red');
        assert.equal(model._props.color, undefined);
        assert.equal(model.get('color'), 'black and white');
      });

    });


  });

}).call(this);