//  MooVeeStar 0.1
//  (c) 2012-2013 Regis Gaughan, III
//  MooVeeStar may be freely distributed under the MIT license.
 
;(function(root){
  
  "use strict";

  var MooVeeStar = root.MooVeeStar = {};

  MooVeeStar.Model = new Class({

    Implements: [Events],

    // The key to identify a passed-map by. If doesn't exist, creates one locally with String.uniqueID()
    idProperty:'id',

    // Define specific properties: 'initial' value, and 'get','set','sanitize','validate' methods
    properties:{},

    // Properties hash, accessed through get/set
    _props:{},

    // Recieves the Model, and clones it into properties
    // Gives it a unique key, if it does not exist
    initialize: function(model, options){
      model && this.init(model);
    },

    fireEvent: function(type, message){
      Events.prototype.fireEvent.call(this, type, message);
      Events.prototype.fireEvent.call(this, '*', {'event':type, 'message':message});
    },

    init: function(model, silent){
      model = model && typeOf(model) === 'object' ? model : {};
      this.set(Object.merge(Object.map(this.properties, function(p){ return p.initial != null ? p.initial : (p['default'] != null ? p['default'] : null); }), model), silent);
      !silent && this.fireEvent('init');
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
      !silent && this.changed.length && this.fireEvent('change', this.get(this.changed));
      !silent && this.errors.length && this.fireEvent('error', this.errors);

      return this;
    },

    _set: function(key, value, silent){
      // needs to be bound the the instance.
      if(!key || typeof(value) === 'undefined'){
        return this;
      }

      // Sanitize the value, if so
      if(value !== null && this.properties[key] && this.properties[key]['sanitize']){
        value = this.properties[key]['sanitize'](value);
      }

      // If we have a custom setter, call it.
      if(this.properties[key] && this.properties[key]['set']){
        this.properties[key]['set'].call(this, value, key);
      }else{
        // No change? Then abandon
        if(this._props[key] && this._props[key] === value){
          return this;
        }

        // basic validator support
        var valid = this.validate(key, value);
        if(this.properties[key] && this.properties[key]['validate'] && valid !== true){
          var error = {key:key, value:value, error:valid};
          this.errors.push(error);
          this.fireEvent('error:'+key, error);
          return this;
        }

        if(value === null){
          delete this._props[key];
        }else{
          this._props[key] = value;
        }
      }

      this.changed.push(key);

      !silent && this.fireEvent('change:'+key, value);
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
      if(!raw && this.properties[key] && this.properties[key]['get']){
        return this.properties[key]['get'].apply(this, arguments);
      }
      if(key === 'cid'){
        return this.cid || this.getId();
      }

      return (key && typeof(this._props[key]) !== 'undefined') ? this._props[key] : null;
    },

    // Lazily set the cid here
    getId: function(){
      var id = this.get(this.idProperty, true) || this.cid || String.uniqueID();
      !this.cid && (this.cid = id);
      return id;
    },

    unset: function(keys, silent){
      // Map of nulls to pass set()
      keys = [keys].flatten().clean();

      if(!keys.length)
        return this;

      var toUnset = {};
      keys.forEach(function(k){ toUnset[k] = null; });
      return this.set(toUnset);
    },

    destroy: function() {
      var id = this.getId();
      this._props = {};
      this.fireEvent('destroy', this);
    },

    validate: function(key, value) {
      return (this.properties[key] && this.properties[key]['validate']) ? this.properties[key]['validate'].call(this, value) : true;
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

    Implements: [Events],

    model: null, // The model class to define. Should define in Collection Class

     // The models
    _models: [],

    initialize: function(items, options){
      // Bind the onModelEvent passthrough so it can be removed
      this._onModelEvent = this._onModelEvent.bind(this);
      this.cid = (options && options.id) || String.uniqueID();
      if(items){
        this.add(items, true);
      }
    },

    _onModelEvent: function(e){
      if(e.event === 'destroy'){
        this.remove(e.message);
      }
      this.fireEvent(e.event, e.message);
    },

    add: function(items, silent){
      var models;
      models = [];
      items = [items].flatten();
      items.each(function(item){
        var model = this.model ? ((item instanceof this.model) ? item : new this.model(item)) : item;
        if(!this.findFirst(model.getId())){
          this._models.include(model);
          models.include(model);
          model.addEvent('*', this._onModelEvent);
        }
      }.bind(this));
      !silent && models.length && this.fireEvent('add', {'models':models});
    },

    remove: function(items, silent){
      var models = [];
      if( /number|string/.test(typeof(items)) )
        items = this.get(items);
      items = [items].flatten();
      items.each(function(model){
        model = typeof(model) === 'string' ? this.findFirst(model) : model;
        if(this._models.contains(model)){
          model.removeEvent('*', this._onModelEvent);
          models.include(model);
          this._models.erase(model);
        }
      }.bind(this));
      !silent && models.length && this.fireEvent('remove', {'models':models});
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
      return key == null ? this._models : (typeof(key) === 'number' ? this.at(key) : this.findById(key));
    },

    getModels: function(){
      return this.get();
    },

    find: function(values, keyToFind){
      keyToFind = keyToFind || this.idProperty;
      values = [values].flatten();
      return this._models.filter(function(model){ return values.contains(model.get(keyToFind)); });
    },

    findFirst: function(value){
      var models = this.find(value);
      return models.length ? models[0] : null;
    },

    toJSON: function() {
      return Array.map(this._models, function(model){ return model.toJSON(); });
    },

    // Model Methods

    // Call set on all items in the collection
    set: function(){
      var args = arguments;
      Array.forEach(this._models, function(model){
        model.set.apply(model, args);
      });
    }


  });

  // Implement Select Array methods
  Array.each(['forEach','each','every','invoke','filter','map','some','indexOf','contains','getRandom','getLast'], function(k){
    MooVeeStar.Collection.implement(k, function() {
      return Array.prototype[k].apply(this._models, arguments);
    });
  });


  MooVeeStar.View = new Class({
    Implements: [Events,Options],
    events:{},
    options:{
      'autorender':true,  // call render when set
      'skipInit':false    // Skip initialization of template on inflate
    },
    template:null,
    initialize: function(model, options){
      this.setOptions(options);
      this.events = Object.clone(this.events || {});
      this.model = this.model || model;
      this.element = this.element || MooVeeStar.templates.inflate(this.template, null, true);
      this.element.set('data-autobind', 'false');
      this.element.set('data-has-view-controller', true);
      this.element.store('__view', this);
      this.elements = this.elements || {};
      this.elements.container = this.element;
      this.attachEvents();
      this.options.autorender && this.render();
    },

    // Dispose of the View
    // Detach all events from itself and any children that have a view controller
    // Dispose/destroy itself
    _doDomManipulation: function(fn, el){
      var fn = fn || 'dispose'; 
      this.detach(el, fn === 'empty');
      (el || this.element)[fn]();
      this.fireEvent(fn);
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

    // Attaches or detach it's events and all children views as well as rendering
    _doAttachDetach: function(operation, element, excludeSelf){
      element = element || this.element;
      operation = (operation || 'attach');
      Array.each(Array.combine([excludeSelf === true ? null : element], element.getElements('*[data-has-view-controller]')).clean(), function(el){
        var controller = el.retrieve('__view');
        if(controller){
          controller[operation+'Events']();
          operation === 'attach' && controller.render();
        }
      });
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
      if($(name))
        return $(name);

      names = (name||'').replace(/^this\./gi, '').split('.');
      obj = this;
      for(var i = 0, l = names.length; i < l; i++){
        if(typeof(obj[names[i]]) !== 'undefined'){
          obj = obj[names[i]];
        }else{
          throw new Error('[VIEW ERROR] Could not attach event to this["'+name.replace('.','"]["')+'"]. "'+names[i]+'" is undefined.');
          return null;
        }
      };
      if(obj && typeOf(obj.addEvent) === 'function'){
        return obj;
      }else if(!obj || typeOf(obj.addEvent) !== 'function'){
        throw new Error('[VIEW ERROR] Could not attach event to this['+name.replace('.','][')+'], it does not have an addEvent method.');
      }
      return null;
    },

    render: function(data){
      MooVeeStar.templates.init(this.element, data || (this.model && this.model.toJSON()) || {});
      return this;
    },

    toElement: function(){
      return this.element;
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


  MooVeeStar.Templates = new Class({

    // Initialize the Template System
    initialize: function(){
      // If html5 shiv, then let's shiv in <markup> (IE8- support)
      if(window.html5 && window.html5.supportsUnknownElements === false){
        window.html5.elements += ' markup';
        html5.shivDocument(document);
      }
      document.createElement('markup');
      this.templates = {};
      this.scrape();
    },

    cleanKey: function(key){
      return key.toLowerCase().trim().replace(/\s/g,'');
    },

    // Register a template to an html string and create a dom from it
    // Overloaded to accept a register a script as second param
    register: function(key, html){
      if(typeof(html) === 'function'){
        this.registerScript(key, html);
        return
      }
      key = this.cleanKey(key);
      html = html.replace(/<\!\-\-.*?\-\->/g, '').trim().replace(/\n/g,' ').replace(/\s+/g,' '); // Strip out comments

      this.templates[key] = this.templates[key] || {};
      this.templates[key].dom = new Element('markup[html="'+html+'"]');
      this.templates[key].markup = html;
    },

    // Register a script to be called when a template is bind
    registerScript: function(key, fn){
      key = this.cleanKey(key);
      this.templates[key] = this.templates[key] || {};
      this.templates[key].script = fn;
    },

    // Return the script associated with a key
    getScript: function(key){
      key = this.cleanKey(key);
      if(this.templates[key] && this.templates[key].script){
          return this.templates[key].script;
      }else{
        throw new Error('Ain\'t no script for the template called '+key+' ('+typeOf(this.templates[key].script)+')');
        return null;
      }
    },

    // check for the existance of a template key
    check: function(key){
      return !!this.templates[this.cleanKey(key)];
    },

    // Return the dom of a template
    get: function(key){
      var data, markupEl, els, childrenTemplates;
      key = this.cleanKey(key);
      data = this.templates[key];
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
        throw new Error('Ain\'t no template called '+key+' ('+typeOf(this.templates[key])+')');
        return null;
      }
    },

    // Inflate a template
    inflate: function(dom, scriptData, skipInit){
      if(typeOf(dom) === 'string'){
        // Assume a key was passed in
        dom = this.get(dom);
      }
      if(dom){
        var markups, children, script;
        // Attach any markup templates
        (dom.getElements('markup')).each(function(child){
          var tpls, markupClass;
          // If there's a class name specified on the <markup> tag, add it to the children
          markupClass = child.get('class') || null;
          // If we passed in skipInit, use it, otherwise set to true assuming this pass is initializing final markup
          tpls = this.inflate(child.get('template'), scriptData, skipInit != null ? skipInit : true);
          tpls = typeOf(tpls) !== 'array' ? [tpls] : tpls;
          tpls.reverse().each(function(tplChild){
            tplChild.inject(child, 'after');
            markupClass && tplChild.addClass(markupClass);
          }.bind(this));    
          child.destroy();
        }.bind(this));
        children = dom.getChildren();
        children.each(function(child){
          child.set('data-tpl', (child.get('data-tpl') || '').split(' ').include(dom.get('data-templateid')).join(' ').clean());
        }.bind(this));
        children = children.length === 1 ? children[0] : children;
        !skipInit && this.init(children, scriptData);
        return children;
      }
      return null;
    },

    // Inflate a template and pass it's elements to another.
    // Usefule when wanting to inflate a template inside another
    // generic template (like a dialog/popup/etc).
    inflateSurround: function(template, surround, scriptData, skipInit){
      var tpl, surroundData;
      scriptData = scriptData || {};
      tpl = typeOf(template) === 'element' || typeOf(template) === 'elements'  || typeOf(template) === 'array' ? template : this.inflate(template, scriptData, skipInit);
      if(tpl){
        if(surround && this.check(surround)){
          surroundData = (scriptData || {})[surround] || (scriptData || {}).surround || {};
          surroundData.els = tpl;
          return this.inflate(surround, surroundData);
        }else{
          throw new Error('Could not find the surround template: '+surround);
          return tpl;
        }
      }
    },

    // Initialize a template and bind to it's data
    // Different than bind in that it will check for a registered script
    // and call that (bind simply binds the data to data-bind fields)
    init: function(els, data){
      var self = this;
      (!els ? [] : (typeOf(els) === 'element' ? [els] : els)).each(function(el){
        if(el.get('data-tpl')){
          var tpls = el.get('data-tpl').split(' ');
          tpls.each(function(tpl){
            if(self.templates[tpl].script){
              self.templates[tpl].script(el, (data && (data[tpl] || data[tpl.replace('tpl:','')])) || data);
            }else{
              self.bind(el, data);
            }
          });
        }else{
          self.bind(el, data);
        }
      });
    },

    // Bind a template to an data object
    // This does NOT call a registered script
    bind: function(els, data){
      var self = this;
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
          var innerBinds = el.getElements('*[data-tpl] *[data-bind]');
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
                }else if(field.indexOf('tpl:') === 0 && self.check(field.replace('tpl:',''))){
                  child.empty();
                  if(typeOf(value) === 'array'){
                    var frag = document.createDocumentFragment();
                    value.each(function(item){
                      // Inflate each template passing in item and have them init (force false skipInit)
                      // Then, remove data-tpl b/c we just inflated it (and, presumably, it's data is
                      // already set so we don't want to set it again below).
                      var tpl = self.inflate(field.replace('tpl:',''), item, false);
                      tpl.removeProperty('data-tpl').getElements('*[data-tpl]').removeProperty('data-tpl');
                      frag.appendChild(tpl);
                    });
                    child.empty().appendChild(frag);
                  }else if(value){
                    child.grab(self.inflate(field.replace('tpl:',''), value));
                  }

                // TODO: Revert previously bound classes?
                }else if(field === 'class' || (binding === 'class' && field === 'default')){
                  value && child.addClass(value);

                }else if((field === 'html' || field === 'default') && typeOf(value) === 'element'){
                  child.empty().grab(value);
                }else if(field === 'default'){
                  field = /input|textarea|select/.test(child.get('tag')) ? 'value' : 'html';
                  child.set(field, value != null ? value : '');
                }else if(value != null){
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
            self.init(tplEl, (data && (data[tplKey] || data[tplKey.replace('tpl:','')])) || data);
          });
        }
      });
    },

    // Scrape the dom and register any templates
    scrape: function(){
      $$('script[type="text/x-tpl"]').each(function(tpl){
        this.register(tpl.get('id'), tpl.get('text'));
        tpl.destroy();
      }.bind(this));
    }
  });

  MooVeeStar.templates = new MooVeeStar.Templates();

})(this);
