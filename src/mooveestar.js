// MooVeeStar v0.0.1 #20131009 - https://rgthree.github.io/mooveestar/
// by Regis Gaughan, III <regis.gaughan@gmail.com>
// MooVeeStar may be freely distributed under the MIT license.

/* jshint mootools:true, expr:true, eqnull:true */
;(function(root){
  
  "use strict";

  var MooVeeStar = root.MooVeeStar = new Events();

  // An Event class that wraps objects called internally with fireEvent
  MooVeeStar.Events = new Class({
    Implements: [Events],

    fireEvent: function(type, message){
      Events.prototype.fireEvent.call(this, type, message);
      Events.prototype.fireEvent.call(this, '*', {'event':type, 'message':message});
    }

  });

  MooVeeStar.Model = new Class({

    Implements: [MooVeeStar.Events, Options],

    // The key to identify a passed-map by. If doesn't exist, creates one locally with String.uniqueID()
    idProperty:'id',

    // Define specific properties: 'initial' value, and 'get','set','sanitize','validate' methods
    properties:{},

    // Properties hash, accessed through get/set
    _props:{},

    options: {
      autoinit: true
    },

    // Recieves the Model, and clones it into properties
    initialize: function(model, options){
      this.setOptions(options);
      this.options.autoinit === true && this.init(model);
    },

    init: function(model, silent){
      model = model && typeOf(model) === 'object' ? model : {};

      // Set the properties taking any thing in the properties map for initials, defaults or the first possibles
      this.set(Object.merge(Object.map(this.properties, function(p){
        if(p.initial != null)
          return p.initial;
        if(p['default'] != null)
          return p['default'];
        if(p.possible && p.possible.length)
          return p.possible[0];
        return null;
      }), model), silent);
      this.changed = [];
      !silent && this.fireEvent('ready', { model:this });
      return this;
    },

    // Overloaded set method. Will accept: (key, value[, silent]), or ({k:v,...}[, silent])
    set: function(){
      var silent;
      this.changed = [];
      this.errors = [];
      // If the first argument is an object, iterate over passing silent along
      if(typeof(arguments[0]) === 'object'){
        silent = !!arguments[1];
        Object.forEach(arguments[0], function(v,k){ this._set(k,v,silent); }.bind(this));
      }else{
        silent = !!arguments[2];
        this._set.apply(this, arguments);
      }
      if(!silent){
        this.changed.length && this.fireEvent('change', { model: this, changed: this.changed.associate(this.changed.map(function(change){ return change.key; })) });
        this.errors.length && this.fireEvent('error', { model: this, errors: this.errors.associate(this.errors.map(function(error){ return error.key; })) });
      }

      return this;
    },

    _set: function(key, value, silent){
      // needs to be bound the the instance.
      if(!key || typeof(value) === 'undefined')
        return this;
      
      // Get the raw from value
      var from = this._props[key];

      // Sanitize the value, if so
      if(value !== null && this.properties[key] && this.properties[key].sanitize)
        value = this.properties[key].sanitize.call(this, value);     

      // If we have a custom setter, call it.
      if(this.properties[key] && this.properties[key].set){
        this.properties[key].set.call(this, value, key);
      }else{
        // No change? Then abandon
        if(this._props[key] && this._props[key] === value){
          return this;
        }

        // basic validator support
        var valid = this.validate(key, value);
        if(this.properties[key] && (this.properties[key].validate || this.properties[key].possible) && valid !== true){
          var error = {key:key, value:value, error:valid, from:from,};
          this.errors.push(error);
          this.fireEvent('error:'+key, Object.merge({ model:this }, error));
          return this;
        }

        if(value === null){
          delete this._props[key];
        }else{
          this._props[key] = value;
        }
      }

      var obj = { key:key, from:from, value:value };
      this.changed.push(obj);

      !silent && this.fireEvent('change:'+key, Object.merge({ model:this }, obj));
      return this;
    },

    get: function(key, raw) {
      if(typeOf(key) === 'array'){
        var self, gets;
        self = this;
        gets = {};
        Array.forEach(key, function(k){ gets[k] = self._get(k, raw); });
        return gets;
      }      
      return this._get(key, raw);
    },

    _get: function(key, raw) {
      if(!raw && this.properties[key] && this.properties[key].get){
        return this.properties[key].get.apply(this, arguments);
      }
      if(key === 'cid')
        return this.cid || this.getId();

      return (key && typeof(this._props[key]) !== 'undefined') ? this._props[key] : null;
    },

    // Lazily set the cid here
    getId: function(){
      var id = this.get(this.idProperty) || this.cid || String.uniqueID();
      !this.cid && (this.cid = id);
      return id;
    },

    unset: function(keys, silent){
      // Map of nulls to pass set()
      keys = Array.from(keys).clean();

      if(!keys.length)
        return this;

      var toUnset = {};
      keys.forEach(function(k){ toUnset[k] = null; });
      return this.set(toUnset);
    },

    destroy: function() {
      var props, id;
      id = this.getId();
      props = Object.clone(this.toJSON());
      this._props = {};
      this.fireEvent('destroy', { model:this, properties:props, id:id, cid:this.cid });
    },

    validate: function(key, value) {
      var prop = this.properties[key];
      if(prop){
        if(typeof prop.validate === 'function')
          return prop.validate.call(this, value);
        if(typeOf(prop.possible) === 'array')
          return prop.possible.contains(value) || ('"'+value+'" is not a valid value for "'+key+'"');
      }
      return true;
    },

    toJSON: function(){
      var data, recurse;
      recurse = function(v, k, obj){
        if(v){
          if(v.toJSON){
            obj[k] = v.toJSON();
          }else if(typeOf(v) === 'object'){
            Object.each(v, recurse);
          }else if(typeOf(v) === 'array'){
            Array.each(v, recurse);
          }
        }
      }.bind(this);
      data = Object.clone(this._props);
      recurse(data);
      return data;
    }

  });


  MooVeeStar.Collection = new Class({

    Implements: [MooVeeStar.Events, Options],

    model: MooVeeStar.Model, // The model class to define. Should define in Collection Class

    options: {
      allowDuplicates: false,  // Allow duplicates in the collection
      silent:false
    },

     // The models
    _models: [],

    initialize: function(items, options){
      options = options || {};
      // Bind the onModelEvent passthrough so it can be removed
      this._onModelEvent = this._onModelEvent.bind(this);
      this.cid = (options.id) || String.uniqueID();
      delete options.id;
      this.setOptions(options);
      this.silent = !!options.silent;
      if(items){
        this.add(items, { silent:true });
      }
    },

    _onModelEvent: function(e){
      if(e.event === 'destroy'){
        this.remove(e.message.model);
      }
      this.fireEvent('model:'+e.event, e.message);
    },

    // Call w/o arguments to set .silent true
    // Call w/ boolean to set .silent
    // Call w/ a synchronous fn to run while silent
    silence: function(){
      if(typeof arguments[0] === 'boolean'){
        this.silent = arguments[0];
      }else if(typeof arguments[0] === 'function'){
        this.silent = true;
        arguments[0]();
        this.silent = false;
      }else if(arguments.length === 0){
        this.silent = true;
      }
      return this;
    },

    add: function(items, options){
      var self, added, errors, addedCount;
      self = this;
      options = options || {};
      added = [];
      errors = [];
      addedCount = 0;
      // Prep and de-dupe existing models
      Array.forEach([items].flatten(), function(item){
        var model = self.model ? ((item instanceof self.model) ? item : new self.model(item)) : item;
        if(!self.findFirst(model.getId()) || self.options.allowDuplicates){
          model.addEvent('*', self._onModelEvent);
          added.push(model);
          if(options.at != null)
            self._models.splice(options.at+addedCount, 0, model);
          else
            self._models.push(model);
          addedCount++;
          if(model.errors.length)
            errors.push({ model:model, errors:model.errors });
        }
      });
      
      if(!self.silent && !options.silent){
        added.length && self.fireEvent('change', { event:'add', models:added, options:options });
        added.length && self.fireEvent('add', { models:added, options:options });
        errors.length && self.fireEvent('error', { data:errors, options:options });
      }
      return self;
    },

    remove: function(items, options){
      var self, i,l, models, model;
      self = this;
      options = options || {};
      models = [];
      if( /number|string/.test(typeof(items)) )
        items = this.get(items);
      items = Array.from(items);

      // Loop over inversely so we do not mess with order if items === this._model when removeAll()
      for(i = items.length-1, l = 0; i >= 0; i--){
        model = typeof(items[i]) !== 'object' ? self.findFirst(items[i]) : items[i];
        if(self._models.contains(model)){
          model.removeEvent('*', self._onModelEvent);
          models.include(model);
          // Array.erase removes all isntances of the object. Handy for allowDuplicates
          self._models.erase(model);
        }
      }
      if(!self.silent && !options.silent && models.length){
        self.fireEvent('change', { event:'remove', models:models, options:options });
        self.fireEvent('remove', { models:models, options:options });
      }
      return self;
    },

    // Empties the collection through remove()
    empty: function(options){
      options = options || {};
      this.remove(this.getAll(), options);
      if(!this.silent && !options.silent){
        this.fireEvent('change', { event:'empty', options:options });  
        this.fireEvent('empty', { options:options });
      }
      return this;
    },

    // Moves a model or number of models to a new index
    move: function(model, to, options){
      var index;
      options = options || {};
      model = (model instanceof this.model) ? model : this.get(model);
      index = this.indexOf(model);      

      if(to == null || to > this.getLength()){
        Array.push(this._models, Array.splice(this._models, index, 1)[0]);
      }else{
        Array.splice(this._models, to, 0, Array.splice(this._models, index, 1)[0]);
      }
      if(!this.silent && !options.silent){
        this.fireEvent('change', { event:'move', model:model, from:index, to:this.indexOf(model), options:options });
        this.fireEvent('move', { model:model, from:index, to:this.indexOf(model), options:options });
      }
      return this;
    },

    getId: function(){
      return this.cid;
    },

    getLength: function(){
      return this._models.length;
    },

    at: function(index){
      return this._models[index];
    },

    get: function(key){
      return key == null ? this.getAll() : (this.findFirst(key) || (typeof(key) === 'number' && this.at(key)));
    },

    getAll: function(){
      return this._models;
    },

    find: function(values, keyToFind){
      keyToFind = keyToFind || null;
      values = Array.from(values);
      return this._models.filter(function(model){ return values.contains(keyToFind ? model.get(keyToFind) : model.getId()); });
    },

    findFirst: function(value, keyToFind){
      var models = this.find(value, keyToFind);
      return models.length ? models[0] : null;
    },

    toJSON: function() {
      return Array.map(this._models, function(model){ return model.toJSON(); });
    },

    /**
     * Silently empties the list and fires a destroy message
     * @return {[type]} [description]
     */
    destroy: function(options){
      options = options || {};
      this.empty(Object.merge({}, options, { silent:true }));
      if(!this.silent && !options.silent){  
        this.fireEvent('destroy', { collection:this, options:options });
      }
      return this;
    },

    // Model Methods

    // Call set on all items in the collection
    set: function(){
      var args = arguments;
      Array.forEach(this._models, function(model){
        model.set.apply(model, args);
      });
      return this;
    }


  });

  // Implement Select Array methods
  Array.each(['forEach','each','every','invoke','filter','map','some','indexOf','contains','getRandom','getLast'], function(k){
    MooVeeStar.Collection.implement(k, function() {
      return Array.prototype[k].apply(this._models, arguments);
    });
  });


  MooVeeStar.View = new Class({

    Implements: [MooVeeStar.Events, Options],

    options:{
      autoattach: true,
      autorender: true,
      inflater: null,   // Lazily set in constructor
      binder: null      // Lazily set in constructor
    },
    events:{},

    template: null,
    element: null,
    elements: {},

    initialize: function(model, options){
      options = options || {};
      options.inflater = options.inflater || this.options.inflater || (MooVeeStar.templates && MooVeeStar.templates.inflate) || null;
      options.binder = options.binder || this.options.binder || (MooVeeStar.templates && MooVeeStar.templates.init) || null;
      this.setOptions(options);

      this.events = Object.clone(this.events || {});
      this.model = this.model || model || null;
      this.setElement();
      this.options.autoattach && this.attachEvents();
      this.options.autorender && this.render();
    },
    
    setElement: function(element){
      if(!this.element){
        this.element = $(element);
        if(!this.element && this.template && this.options.inflater)
          this.element = this.options.inflater(this.template, null, true);
      }
      if(this.element){
        this.element.set('data-autobind', 'false');
        this.element.set('data-has-view-controller', 'true');
        this.element.store('__view', this);
        this.elements.container = this.element;
      }
      return this;
    },

    toElement: function(){
      return this.element;
    },

    render: function(data){
      this.options.binder && this.options.binder(this.element, data || (this.model && this.model.toJSON()) || {});
      return this;
    },

    // Dispose of the View
    // Detach all events from itself and any children that have a view controller
    // Dispose/destroy itself
    _doDomManipulation: function(fn, el){
      fn = fn || 'dispose'; 
      el = el || this.element;
      // Dispose can be called through, but empty or destroy should call destroy through
      this._doNestedViewsCall(fn === 'empty' ? 'destroy' : fn, el);
      this.detach(el, fn === 'empty');
      el[fn]();
      this.fireEvent(fn, { view:this });
      return this;
    },

    dispose: function(el){
      return this._doDomManipulation('dispose', el);
    },

    destroy: function(el){
      return this._doDomManipulation('destroy', el);
    },

    empty: function(el){
      return this._doDomManipulation('empty', el);
    },

    // Finds all nested view controllers and calls a method on them
    _doNestedViewsCall: function(methods, element){
      var views;
      element = element || this.element;
      methods = Array.from(methods);
      views = element.getElements('*[data-has-view-controller]').clean().reverse();
      views.forEach(function(el){
        var controller = el.retrieve('__view');
        methods.forEach(function(method){
          if(controller && typeof(controller[method]) === 'function')
            controller[method]();
        });
      });
    },

    // Attaches or detach it's events and all children views as well as rendering
    _doAttachDetach: function(operation, element, excludeSelf){
      var self, methods;
      self = this;
      element = element || this.element;
      operation = (operation || 'attach');
      methods = [operation+'Events'];
      if(operation === 'attach')
        methods.push('render');

      this._doNestedViewsCall(methods, element);

      if(!excludeSelf){
        methods.forEach(function(method){
          self[method]();
        });
      }
      return this;
    },

    attach: function(element, excludeSelf){
      return this._doAttachDetach('attach', element, excludeSelf);
    },

    detach: function(element, excludeSelf){
      return this._doAttachDetach('detach', element, excludeSelf);
    },

    attachEvents: function(){
      // Keep track of attached events && bound functions (for detaching)
      this._attachedEvents = this._attachedEvents || {};
      this._boundEventFns = this._boundEventFns || {};

      Object.each(this.events, function(v, k){
        if(!this._attachedEvents[k]){
          if(k && k.length && typeOf(this[v]) === 'function'){
            // Break psuedo and check if it's in Element.NativeEvents
            var name, attach;
            if((!k.contains(':') || /\:relay\(/gi.test(k)) && Element.NativeEvents[k.substr(0, k.indexOf(':') > 0 ? k.indexOf(':') : k.length)] != null){
              // Simple dom event or relay
              attach = $(this.element);
              name = k;
            }else if(/attach\(([^\)]+)/gi.test(k)){
              // Attach as a css fn after the event (deprecate?)
              // click:attach(window) or click:relay():attach(this.views.evaledEl)
              attach = /attach\(([^\)]+)/gi.exec(k);
              name = k.replace(/:?attach\([^\)]+\)/i,'');
              attach = attach && attach[1];
              attach = this._getEventObj(attach) || this;
            }else{
              // toAttach as first : delimited list
              // window:scroll or collection:add or this.views.block:change
              attach = k.split(':')[0];
              name = k.replace(attach+':','');
              attach = this._getEventObj(attach) || this;
            }
            if(attach && name && attach.addEvent){
              this._boundEventFns[v] = this._boundEventFns[v] || this[v].bind(this);
              attach.addEvent(name, this._boundEventFns[v]);
              this._attachedEvents[k] = {'attach':attach, 'name':name, 'fn':this._boundEventFns[v]};
            }else{
              throw new Error('[VIEW ERROR] Could not attach event "'+k+'". Something went awry.');
            }
          }
        }
      }.bind(this));
      return this;
    },

    detachEvents: function(){
      Object.each(this._attachedEvents || {}, function(v){
        v.attach.removeEvent(v.name, v.fn);
      });
      this._attachedEvents = {};
      return this;
    },

    // Recurse the object via a dot-delimited string for the property that 
    // has an event to attach
    _getEventObj: function(name){
      var obj, names;
      if(name === 'this')
        return this;
      if(name === 'window')
        return $(window);
      if(name === 'document')
        return $(document);
      if(name === 'MooVeeStar')
        return MooVeeStar;
      if($(name))
        return $(name);
      if(root[name] && typeOf(root[name].addEvent) === 'function')
        return root[name];

      names = (name||'').replace(/^this\./gi, '').split('.');
      obj = this;
      for(var i = 0, l = names.length; i < l; i++){
        if(typeof(obj[names[i]]) !== 'undefined'){
          obj = obj[names[i]];
        }else{
          throw new Error('[VIEW ERROR] Could not attach event to this["'+name.replace('.','"]["')+'"]. "'+names[i]+'" is undefined.');
        }
      }
      if(obj && typeOf(obj.addEvent) === 'function'){
        return obj;
      }else if(!obj || typeOf(obj.addEvent) !== 'function'){
        throw new Error('[VIEW ERROR] Could not attach event to this['+name.replace('.','][')+'], it does not have an addEvent method.');
      }
      return null;
    }

  });


  MooVeeStar.Storage = new Class({

    store: function(){
      try{
        root.localStorage.setItem(this.getId(), JSON.encode(this.toJSON()));
        this.fireEvent('store');
      }catch(e){}
    },

    retrieve: function(){
      try{
        var model = root.localStorage.getItem(this.getId());
        this.fireEvent('retrieve');
        return JSON.decode(model);
      }catch(e){}
    },

    eliminate: function() {
      root.localStorage.removeItem(this.getId());
      return this.fireEvent('eliminate');
    }

  });


  var mvstpl = {

    templates: {},

    cleanKey: function(key){
      return key.toLowerCase().trim().replace(/\s/g,'');
    },

    // Register a template to an html string and create a dom from it
    // Overloaded to accept a register a script as second param
    register: function(key, html){
      if(typeof(html) === 'function'){
        mvstpl.registerScript(key, html);
        return;
      }
      key = mvstpl.cleanKey(key);
      html = html.replace(/<\!\-\-.*?\-\->/g, '').trim().replace(/\n/g,' ').replace(/\s+/g,' '); // Strip out comments

      mvstpl.templates[key] = mvstpl.templates[key] || {};
      mvstpl.templates[key].dom = new Element('markup[html="'+html+'"]');
      mvstpl.templates[key].markup = html;
    },

    // Register a script to be called when a template is bind
    registerScript: function(key, fn){
      key = mvstpl.cleanKey(key);
      mvstpl.templates[key] = mvstpl.templates[key] || {};
      mvstpl.templates[key].script = fn;
    },

    // Return the script associated with a key
    getScript: function(key){
      key = mvstpl.cleanKey(key);
      if(mvstpl.templates[key] && mvstpl.templates[key].script){
        return mvstpl.templates[key].script;
      }else{
        throw new Error('Ain\'t no script for the template called '+key+' ('+typeOf(mvstpl.templates[key].script)+')');
      }
    },

    // check for the existance of a template key
    check: function(key){
      return !!mvstpl.templates[mvstpl.cleanKey(key)];
    },

    // Return the dom of a template
    get: function(key){
      var data, markupEl, els, childrenTemplates;
      key = mvstpl.cleanKey(key);
      data = mvstpl.templates[key];
      if(data){
        // If html5Shiv is installed, and we need to go around cloneNode for HTML5 elements
        if(window.html5 && window.html5.supportsUnknownElements === false){
          var node = html5.createElement('markup');
          node.innerHTML = data.markup;
          return $(node).set('data-templateid', key);  
        }else{
          return data.dom.clone().set('data-templateid', key);
        }       
      }else{
        throw new Error('Ain\'t no template called '+key+' ('+typeOf(mvstpl.templates[key])+')');
      }
      return null;
    },

    // Same as inflate, but removes bindings after inflating
    inflateOnce: function(dom, scriptData, skipInit){
      var r = mvstpl.inflate(dom, scriptData, skipInit);
      [(r || [])].flatten().each(function(el){
        el.removeProperty('data-bind');
        el.getElements('[data-bind]').removeProperty('data-bind');
      });
      return r;
    },
    
    // Inflate a template
    inflate: function(dom, scriptData, skipInit){
      if(typeOf(dom) === 'string'){
        // Assume a key was passed in
        dom = mvstpl.get(dom);
      }
      if(dom){
        var markups, children, script;
        // Attach any markup templates
        (dom.getElements('markup')).each(function(child){
          var tpls, markupClass;
          // If there's a class name specified on the <markup> tag, add it to the children
          markupClass = child.get('class') || null;
          // If we passed in skipInit, use it, otherwise set to true assuming this pass is initializing final markup
          tpls = mvstpl.inflate(child.get('template'), scriptData, skipInit != null ? skipInit : true);
          tpls = typeOf(tpls) !== 'array' ? [tpls] : tpls;
          tpls.reverse().each(function(tplChild){
            tplChild.inject(child, 'after');
            markupClass && tplChild.addClass(markupClass);
          });    
          child.destroy();
        });
        children = dom.getChildren();
        children.each(function(child){
          child.set('data-tpl', (child.get('data-tpl') || '').split(' ').include(dom.get('data-templateid')).join(' ').clean());
        });
        children = children.length === 1 ? children[0] : children;
        !skipInit && mvstpl.init(children, scriptData);
        return children;
      }
      return null;
    },

    // Inflate a template and pass it's elements to another.
    // Useful when wanting to inflate a template inside another
    // generic template (like a dialog/popup/etc).
    inflateSurround: function(template, surround, scriptData, skipInit){
      var tpl, surroundData;
      scriptData = scriptData || {};
      tpl = typeOf(template) === 'element' || typeOf(template) === 'elements'  || typeOf(template) === 'array' ? template : mvstpl.inflate(template, scriptData, skipInit);
      if(tpl){
        if(surround && mvstpl.check(surround)){
          surroundData = (scriptData || {})[surround] || (scriptData || {}).surround || {};
          surroundData.els = tpl;
          return mvstpl.inflate(surround, surroundData);
        }else{
          throw new Error('Could not find the surround template: '+surround);
        }
      }
    },

    // Initialize a template and bind to it's data
    // Different than bind in that it will check for a registered script
    // and call that (bind simply binds the data to data-bind fields)
    init: function(els, data){
      (!els ? [] : (typeOf(els) === 'element' ? [els] : els)).each(function(el){
        if(el.get('data-tpl')){
          var tpls = el.get('data-tpl').split(' ');
          tpls.each(function(tpl){
            if(mvstpl.templates[tpl].script){
              mvstpl.templates[tpl].script(el, (data && (data[tpl] || data[tpl.replace('tpl:','')])) || data);
            }else{
              mvstpl.bind(el, data);
            }
          });
        }else{
          mvstpl.bind(el, data);
        }
      });
    },

    // Bind a template to a data object
    // This does NOT call a registered script
    bind: function(els, data){
      data = data || {};
      // If we only have one empty element, no data-bind set, and out passed data was a string, set it to the el
      if(typeOf(data) === 'string' && typeOf(els) === 'element' && els.getChildren().length === 0 && !els.get('data-bind')){
        els.set('data-bind','value');
        data = {'value':data};
      }
      // Get all children to be bind that are not inner binds
      (!els ? [] : (typeOf(els) === 'element' ? [els] : els)).each(function(el){
        var toBindEls, innerBinds;
        toBindEls = el.getElements('[data-bind]');
        if(el.get('data-bind')){
          toBindEls.unshift(el);
        }
        if(toBindEls.length){
          // Exclude any els that are in their own data-tpl (which will follow)
          innerBinds = el.getElements('*[data-tpl] *[data-bind]');
          toBindEls = toBindEls.filter(function(maybeBind){ return !innerBinds.contains(maybeBind); });
          toBindEls.each(function(child){
            var bindings;
            // Get the bindings this elements wants
            bindings = child.get('data-bind').replace(/\s+/,' ').trim().split(' ') || [];
            bindings.each(function(binding){
              var fields, value;
              // Get the fields for this binding
              value = data[binding];
              if(value === undefined)
                value = null;
              fields = child.get('data-bind-'+binding) ? child.get('data-bind-'+binding).split(' ') : ['default'];
              fields.each(function bindField(field){
                // If it's a style binding
                if(field.indexOf('style:') === 0){
                  value = value && value.indexOf('http') === 0 ? 'url('+value+')' : value;
                  child.setStyle(field.replace('style:',''), value);

                // tpl:[array] will inflate the specified template for each item
                }else if(field.indexOf('tpl:') === 0 && mvstpl.check(field.replace('tpl:',''))){
                  child.empty();
                  if(typeOf(value) === 'array'){
                    var frag = document.createDocumentFragment();
                    value.each(function(item){
                      // Inflate each template passing in item and have them init (force false skipInit)
                      // Then, remove data-tpl b/c we just inflated it (and, presumably, it's data is
                      // already set so we don't want to set it again below).
                      var tpl = mvstpl.inflate(field.replace('tpl:',''), item, false);
                      tpl.removeProperty('data-tpl').getElements('*[data-tpl]').removeProperty('data-tpl');
                      frag.appendChild(tpl);
                    });
                    child.empty().appendChild(frag);
                  }else if(value){
                    child.grab(mvstpl.inflate(field.replace('tpl:',''), value));
                  }

                // TODO: Revert previously bound classes?
                }else if(field === 'class' || (binding === 'class' && field === 'default')){
                  value && child.addClass(value);

                }else if((field === 'html' || field === 'default') && /^element/.test(typeOf(value))) {
                  child.empty();
                  Array.from(value).forEach(function(val){
                    child.grab(val);
                  });
                   
                }else if(field === 'default'){
                  field = /input|textarea|select/.test(child.get('tag')) ? 'value' : 'html';
                  child.set(field, value !== null ? value : '');
                }else if(value !== null){
                  child.set(field, value);
                }else{
                  child.removeProperty(field, value);
                }
              });
            });
          });
        }

        // Now loop over children w/ "data-tpl" and init them, unless they have an "data-autobind" set to "false"
        // (as in, they have a separate View Controller rendering their data)
        var toInitEls, innerInits;
        toInitEls = el.getElements('*[data-tpl]');
        if(toInitEls.length){
          innerInits = el.getElements('*[data-tpl] *[data-tpl]');
          toInitEls = toInitEls.filter(function(maybeInitEl){
            // If the el is inside another [data-tpl] don't init now (it will recursively next time)
            if(innerInits.contains(maybeInitEl))
              return false;

            // If we passed in a specific map in data for this, then init
            var tplKey = maybeInitEl.get('data-tpl');
            if(data && (data[tplKey] || data[tplKey.replace('tpl:','')]))
              return true;

            // Only init cascadingly if autobind is not "false" (as in, a separate controller handles it's own rendering)
            return maybeInitEl.get('data-autobind') !== 'false';

          }); 
          toInitEls.each(function(tplEl){
            var tplKey = tplEl.get('data-tpl');
            mvstpl.init(tplEl, (data && (data[tplKey] || data[tplKey.replace('tpl:','')])) || data);
          });
        }
      });
    },

    // Scrape the dom and register any templates
    scrape: function(){
      $$('script[type="text/x-tpl"]').each(function(tpl){
        mvstpl.register(tpl.get('id'), tpl.get('text'));
        tpl.destroy();
      });
    }
  };

  MooVeeStar.templates = mvstpl;

  // If html5 shiv, then let's shiv in <markup> (IE8- support)
  if(window && window.html5 && window.html5.supportsUnknownElements === false){
    window.html5.elements += ' markup';
    html5.shivDocument(document);
  }
  document.createElement('markup');
  MooVeeStar.templates.scrape();

})(this);
