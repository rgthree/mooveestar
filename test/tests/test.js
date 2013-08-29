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

    // A test model, a Zebra
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


  describe('MooVeeStar.Collection', function(){

    var Animal = new Class({
      Extends: MooVeeStar.Model
    });

    var Zoo = new Class({
      Extends: MooVeeStar.Collection,
      model: Animal
    });

    var collection = new Zoo([new Animal({ id:145, type:'monkey' }), { id:146, type:'zebra' }]);

    it('should be instantiated w/ Events & Options', function(){
      assert.instanceOf(collection, MooVeeStar.Collection);
      assert.typeOf(collection.addEvent, 'function');
      assert.typeOf(collection.setOptions, 'function');
    });

    it('should accept models initially', function(){
      // New local collection to test this specifically
      assert.equal(collection.getLength(), 2);
      assert.equal(collection._models.length, 2);
      assert.equal(collection._models[0].get('type'), 'monkey');
      assert.equal(collection._models[1].get('type'), 'zebra');
    });


    describe('.add(...)', function(){
      it('should add single or array of and inflate items', function(){
        collection.add({ id:147, type:'monkey' });
        collection.add([{ id:148, type:'monkey' },{ id:149, type:'gorilla' },{ id:150, type:'zebra' }]);
        assert.equal(collection.getLength(), 6);
        assert.equal(collection._models.length, 6);
        assert.equal(collection._models[0].get('type'), 'monkey');
        assert.equal(collection._models[1].get('type'), 'zebra');
        assert.equal(collection._models[2].get('type'), 'monkey');
        assert.equal(collection._models[3].get('type'), 'monkey');
        assert.equal(collection._models[4].get('type'), 'gorilla');
        assert.equal(collection._models[5].get('type'), 'zebra');
      });

      it('should accept an options.at to splice', function(){
        collection.add([{ id:600, type:'parrot' },{ id:601, type:'panda' }], { at:3 });
        assert.equal(collection._models[3].get('type'), 'parrot');
        assert.equal(collection._models[4].get('type'), 'panda');
      });
    });

    describe('.at(index)', function(){
      it('should return the model at the index', function(){
        assert.equal(collection.at(0), collection._models[0]);
        assert.equal(collection.at(1), collection._models[1]);
      });
    });

    describe('.get(...)', function(){
      it('should return all models if no arguments', function(){
        assert.equal(collection.get(), collection._models);
        assert.equal(collection.get(), collection.getAll());
      });

      it('should findFirst(key) if exists', function(){
        assert.equal(collection.get(145), collection.get(0));
        assert.equal(collection.get(146), collection.get(1));
      });

      it('should at(int) if a number that is not found by findFirst', function(){
        assert.equal(collection.at(0), collection.get(0));
        assert.equal(collection.at(1), collection.get(1));
      });

      it('should at(int) if a number that is not found by findFirst', function(){
        assert.equal(collection.at(0), collection.get(0));
        assert.equal(collection.at(1), collection.get(1));
      });
    });

    describe('.find(...)', function(){
      it('should find specific items by the model\'s id', function(){
        assert.equal(collection.find(148)[0].get('type'), 'monkey');
        assert.equal(collection.find(149)[0].get('type'), 'gorilla');
        assert.equal(collection.find(150)[0].get('type'), 'zebra');
      });

      it('should find specific items by a filter by a certain key', function(){
        assert.equal(collection.find('monkey', 'type').length, 3);
        assert.equal(collection.find('zebra', 'type').length, 2);
        assert.equal(collection.find('gorilla', 'type').length, 1);
      });

      it('should return an empty array when not found', function(){
        assert.equal(collection.find('peacock', 'type').length, 0);
      });
    });

    describe('.findFirst(...)', function(){
      it('should return the first item from a .find()', function(){
        assert.equal(collection.findFirst('monkey', 'type'), collection.find('monkey', 'type')[0]);
        assert.equal(collection.findFirst(148), collection.find(148)[0]);
      });

      it('should return null when not found', function(){
        assert.equal(collection.findFirst('peacock', 'type'), null);
      });
    });

    describe('.move(...)', function(){
      it('should move the model passed to the index passed', function(){
        var first, second, third, fourth, fifth;
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.move(fourth, 1);
        assert.equal(collection.indexOf(first), 0);
        assert.equal(collection.indexOf(second), 2);
        assert.equal(collection.indexOf(third), 3);
        assert.equal(collection.indexOf(fourth), 1);
        assert.equal(collection.indexOf(fifth), 4);
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.move(first, 3);
        assert.equal(collection.indexOf(first), 3);
        assert.equal(collection.indexOf(second), 0);
        assert.equal(collection.indexOf(third), 1);
        assert.equal(collection.indexOf(fourth), 2);
        assert.equal(collection.indexOf(fifth), 4);
      });

    });

    describe('.remove(...)', function(){
      it('should remove the model passed', function(){
        var first, second, third;
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        collection.remove(second); 
        assert.equal(collection.indexOf(first), 0);
        assert.equal(collection.indexOf(second), -1);
        assert.equal(collection.indexOf(third), 1);
      });

      it('should remove the models passed', function(){
        var first, second, third, fourth, fifth;
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.remove([second, fourth]);
        assert.equal(collection.indexOf(first), 0);
        assert.equal(collection.indexOf(second), -1);
        assert.equal(collection.indexOf(third), 1);
        assert.equal(collection.indexOf(fourth), -1);
        assert.equal(collection.indexOf(fifth), 2);
      });

      it('should remove the models passed', function(){
        var first, second, third, fourth, fifth;
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.remove([second, fourth]);
        assert.equal(collection.indexOf(first), 0);
        assert.equal(collection.indexOf(second), -1);
        assert.equal(collection.indexOf(third), 1);
        assert.equal(collection.indexOf(fourth), -1);
        assert.equal(collection.indexOf(fifth), 2);
      });
    });




  });

}).call(this);