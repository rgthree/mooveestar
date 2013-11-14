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
          if(e.model === model && e.errors.fgColor && e.errors.fgColor.value && e.errors.fgColor.from && e.errors.fgColor.error)
            error = true;
        });
        model.addEvent('error:fgColor', function(e){
          if(e.model === model && e.key === 'fgColor' && e.value && e.from && e.error)
            errorFgColor = true;
        });

        // Try setting our fgColor to the background color
        model.set('fgColor', 'brown');
        assert.isTrue(error);
        assert.isTrue(errorFgColor);
        assert.equal(model.get('fgColor'), 'black');

        // Try setting bgColor, then fgColor to the same color
        error = errorFgColor = false;
        model.set({ bgColor:'red', fgColor:'red' });
        assert.isTrue(error);
        assert.isTrue(errorFgColor);
        assert.equal(model.get('bgColor'), 'red');
        assert.equal(model.get('fgColor'), 'black');

        // Uncaught here, the bg color _can_ be set to the
        // foreground according to our model's validate
        error = errorFgColor = false;
        model.set({ fgColor:'green', bgColor:'green' });
        assert.isFalse(error);
        assert.isFalse(errorFgColor);
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

      it('should not allow duplicates', function(){
        var m1, m2, m3;
        m1 = new Animal({ id:148, type:'monkey' });
        m2 = new Animal({ id:149, type:'gorilla' });
        m3 = new Animal({ id:150, type:'zebra' });
        var c = new Zoo([m1,m2,m3,m1,m2,m3]);
        assert.equal(c.getLength(), 3);
        assert.equal(c.at(0).get('type'), 'monkey');
        assert.equal(c.at(1).get('type'), 'gorilla');
        assert.equal(c.at(2).get('type'), 'zebra');
        assert.equal(c.at(3), null);
        assert.equal(c.at(4), null);
        assert.equal(c.at(5), null);
        c.remove([149,150]);
        assert.equal(c.getLength(), 1);
        c.empty();
        assert.equal(c.getLength(), 0);
      });

      it('should allow duplicates', function(){
        var m1, m2, m3;
        m1 = new Animal({ id:148, type:'monkey' });
        m2 = new Animal({ id:149, type:'gorilla' });
        m3 = new Animal({ id:150, type:'zebra' });
        var c = new Zoo([m1,m2,m3,m1,m2,m3], { allowDuplicates:true });
        assert.equal(c.getLength(), 6);
        assert.equal(c.at(0).get('type'), 'monkey');
        assert.equal(c.at(1).get('type'), 'gorilla');
        assert.equal(c.at(2).get('type'), 'zebra');
        assert.equal(c.at(3).get('type'), 'monkey');
        assert.equal(c.at(4).get('type'), 'gorilla');
        assert.equal(c.at(5).get('type'), 'zebra');
        assert.equal(c.at(0), c.at(3));
        assert.equal(c.at(1), c.at(4));
        assert.equal(c.at(2), c.at(5));
        c.remove([149,150]);
        assert.equal(c.getLength(), 2);
        c.empty();
        assert.equal(c.getLength(), 0);
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
      it('should move the model passed backward', function(){
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

      it('should move the model passed forward', function(){
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
      });

      it('should move the model at an index passed backward', function(){
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.move(0, 3);
        assert.equal(collection.indexOf(first), 3);
        assert.equal(collection.indexOf(second), 0);
        assert.equal(collection.indexOf(third), 1);
        assert.equal(collection.indexOf(fourth), 2);
        assert.equal(collection.indexOf(fifth), 4);
      });

      it('should move the model at an index passed forward', function(){
        var first, second, third, fourth, fifth;
        first = collection.at(0);
        second = collection.at(1);
        third = collection.at(2);
        fourth = collection.at(3);
        fifth = collection.at(4);
        collection.move(3, 1);
        assert.equal(collection.indexOf(first), 0);
        assert.equal(collection.indexOf(second), 2);
        assert.equal(collection.indexOf(third), 3);
        assert.equal(collection.indexOf(fourth), 1);
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


      it('should remove just the model at the index', function(){
        var m1, m2, m3;
        m1 = new Animal({ id:148, type:'monkey' });
        m2 = new Animal({ id:149, type:'gorilla' });
        m3 = new Animal({ id:150, type:'zebra' });
        var collection = new Zoo([m1,m2,m3,m1,m2,m3], { allowDuplicates:true });
        assert.equal(collection.getLength(), 6);
        collection.remove(1);
        assert.equal(collection.getLength(), 5);
        assert.equal(collection.indexOf(m1), 0);
        assert.equal(collection.indexOf(m2), 3);
        assert.equal(collection.indexOf(m3), 1);
        assert.equal(collection.indexOf(m1, 1), 2);
        assert.equal(collection.indexOf(m3, 2), 4);
      });

    });

    describe('.empty()', function(){
      it('should remove all the models', function(){
        var i,l, collection;
        collection = new MooVeeStar.Collection();
        for(i = 0; i < 50; i++)
          collection.add(new MooVeeStar.Model({ id:i }));
        assert.equal(collection.getLength(), 50);
        collection.empty();
        assert.equal(collection.getLength(), 0);
      });
    });

    describe('.destroy()', function(){
      it('should silenty remove all the models fire a destroy', function(){
        var i,l, collection, firedChange, firedRemove, firedEmpty, firedDestroy;
        collection = new MooVeeStar.Collection();
        for(i = 0; i < 50; i++)
          collection.add(new MooVeeStar.Model({ id:i }));

        firedChange = firedRemove = firedDestroy = firedEmpty = false;
        collection.addEvent('change', function(){ firedChange = true; });
        collection.addEvent('remove', function(){ firedRemove = true; });
        collection.addEvent('empty', function(){ firedEmpty = true; });
        collection.addEvent('destroy', function(){ firedDestroy = true; });

        assert.equal(collection.getLength(), 50);
        collection.destroy();
        assert.equal(collection.getLength(), 0);
        assert.isFalse(firedChange);
        assert.isFalse(firedRemove);
        assert.isFalse(firedEmpty);
        assert.isTrue(firedDestroy);
      });
    });

    describe('.addEvent()', function(){
      var i, l, collection, Model, firedChange, firedAdd, firedRemove, firedModelChange, firedModelChangeId, firedModelDestroy, firedModelError, firedModelErrorId, firedModelArbitrary, firedModelArbitraryRemove;
      collection = new MooVeeStar.Collection();
      Model = new Class({
        Extends: MooVeeStar.Model,
        properties: {
          id: {
            validate: function(value){
              if(typeof(value) === 'number')
                return true;
              return 'Error: id must be numeric';
            }
          }
        },
        remove: function(){
          this.fireEvent('remove');
        }
      });

      for(i = 0; i < 10; i++)
        collection.add(new Model({ id:i }));

      collection.addEvent('add', function(){ firedAdd = true; });
      collection.addEvent('remove', function(){ firedRemove = true; });
      collection.addEvent('change', function(){ firedChange = true; });

      collection.addEvent('model:change', function(){ firedModelChange = true; });
      collection.addEvent('model:change:id', function(){ firedModelChangeId = true; });
      collection.addEvent('model:destroy', function(){ firedModelDestroy = true; });
      collection.addEvent('model:error', function(){ firedModelError = true; });
      collection.addEvent('model:error:id', function(){ firedModelErrorId = true; });
      collection.addEvent('model:arbitrary', function(){ firedModelArbitrary = true; });
      collection.addEvent('model:remove', function(){ firedModelArbitraryRemove = true; });

      it('should fire events add & change events for adding', function(){
        // Fire Collection Add & Change
        firedChange = firedAdd = false;
        collection.add(new MooVeeStar.Model({ id:11 }));
        assert.isTrue(firedAdd);
        assert.isTrue(firedChange);
      });

      it('should fire events remove & change events for removing', function(){
        // Fire Collection Add & Remove
        firedChange = firedRemove = false;
        collection.remove(10);
        assert.isTrue(firedRemove);
        assert.isTrue(firedChange);
      });

      it('should fire events model change events for adding', function(){
        // Fire Model Change, Change:Id, Destroy, Collection:Remove
        firedModelChange = firedModelChangeId = firedChange = false;
        collection.at(8).set('id', 500);
        assert.isTrue(firedModelChange);
        assert.isTrue(firedModelChangeId);
        assert.isFalse(firedChange);
      });

      it('should fire model events for destroy, as well as removing from collection', function(){
        firedModelDestroy = firedRemove = firedChange = false;
        collection.at(8).destroy();
        assert.isTrue(firedModelDestroy);
        assert.isTrue(firedRemove);
        assert.isTrue(firedChange);
      });

      it('should fire model error events', function(){
        // Fire Model Change, Change:Id, Destroy, Collection:Remove
        firedChange = firedModelChange = firedModelChangeId = firedModelError = firedModelErrorId = false;
        collection.at(1).set('id', '501');
        assert.isTrue(firedModelError);
        assert.isTrue(firedModelErrorId);
        assert.isFalse(firedChange);
        assert.isFalse(firedModelChange);
        assert.isFalse(firedModelChangeId);
      });

      it('should fire arbitrary model events', function(){
        // Fire Model Change, Change:Id, Destroy, Collection:Remove
        firedModelArbitrary = firedModelArbitraryRemove = false;
        collection.at(1).fireEvent('arbitrary');
        assert.isTrue(firedModelArbitrary);
        collection.at(1).remove();
        assert.isTrue(firedModelArbitraryRemove);
      });

    });

  });



  describe('MooVeeStar.templates', function(){
    
    var sectionHtml = '<section data-bind="class id" data-bind-id="data-id" data-bind-class="class"><h1 data-bind="title"></h1><ul data-bind="items" data-bind-items="tpl:item"></ul></section>';
    var listHtml = '<ul data-bind="items" data-bind-items="tpl:item"></ul>';
    var itemHtml = '  <li>  <!-- cool list item! --> \n\n    </li> \n\t ';

    describe('.register()', function(){
      it('should register a template html to a key', function(){

        MooVeeStar.templates.register('section-tpl', sectionHtml);
        MooVeeStar.templates.register('list-tpl', listHtml);

        assert.isNotNull(MooVeeStar.templates.templates['section-tpl']);
        assert.equal(MooVeeStar.templates.templates['section-tpl'].markup, sectionHtml);

        assert.isNotNull(MooVeeStar.templates.templates['list-tpl']);
        assert.equal(MooVeeStar.templates.templates['list-tpl'].markup, listHtml);

      });

      it('should strip out comment, newlines, and excess whitespace', function(){

        MooVeeStar.templates.register('item-tpl', itemHtml);

        assert.isNotNull(MooVeeStar.templates.templates['item-tpl']);
        assert.equal(MooVeeStar.templates.templates['item-tpl'].markup, '<li> </li>');
      });

    });



    describe('.inflate()', function(){

      it('should bind the data correctly', function(){

        var el = MooVeeStar.templates.inflate('section-tpl', { id:123, 'class':'box red', title:'My Title' });

        assert.equal(el.get('data-id'), '123');
        assert.equal(el.get('class'), 'box red');
        assert.equal(el.getElement('[data-bind*="title"]').get('text'), 'My Title');

      });

      it('should set html as default, or when set to html', function(){

        MooVeeStar.templates.register('test-inflate-html', '<h1 data-bind="title"></h1>');
        var el = MooVeeStar.templates.inflate('test-inflate-html', { title:'<strong>My Title</strong>' });

        assert.equal(el.getChildren().length, 1);
        assert.equal(el.getFirst().get('tag'), 'strong');
        assert.equal(el.getFirst().get('text'), 'My Title');

        MooVeeStar.templates.register('test-inflate-html2', '<h1 data-bind="title" data-bind-title="html"></h1>');
        var el2 = MooVeeStar.templates.inflate('test-inflate-html2', { title:'<strong>My Title</strong>' });

        assert.equal(el2.getChildren().length, 1);
        assert.equal(el2.getFirst().get('tag'), 'strong');
        assert.equal(el2.getFirst().get('text'), 'My Title');
        
      });

      it('should strip text when value is text', function(){

        MooVeeStar.templates.register('test-inflate-text', '<h1 data-bind="title" data-bind-title="text"></h1>');
        var el = MooVeeStar.templates.inflate('test-inflate-text', { title:'<strong>My Title</strong>' });

        assert.equal(el.getChildren().length, 0);
        assert.equal(el.get('text'), '<strong>My Title</strong>');
        assert.equal(el.get('html'), '&lt;strong&gt;My Title&lt;/strong&gt;');
        
      });

      it('should empty and grab an element', function(){

        MooVeeStar.templates.register('test-inflate-text2', '<h1 data-bind="title"><span>gone</span></h1>');
        var el = MooVeeStar.templates.inflate('test-inflate-text2', { title:new Element('strong[text="My Title"]') });

        assert.equal(el.getChildren().length, 1);
        assert.equal(el.getFirst().get('tag'), 'strong');
        assert.equal(el.getFirst().get('text'), 'My Title');
        
      });

      it('should empty and grab all Elements collection', function(){

        MooVeeStar.templates.register('test-inflate-html3', '<h1 data-bind="title"><span>gone</span></h1>');
        var els, el;
        els = new Elements();
        els.include(new Element('strong[text="My Title"]'));
        els.include(new Element('aside[text="Subtitle"]'));

        el = MooVeeStar.templates.inflate('test-inflate-html3', { title:els });

        assert.equal(el.getChildren().length, 2);
        assert.equal(el.getFirst().get('tag'), 'strong');
        assert.equal(el.getFirst().get('text'), 'My Title');
        assert.equal(el.getLast().get('tag'), 'aside');
        assert.equal(el.getLast().get('text'), 'Subtitle');
        
      });

    });

  });

}).call(this);
