// MooVeeStar v0.0.1 #20131014 - https://rgthree.github.io/mooveestar/
// by Regis Gaughan, III <regis.gaughan@gmail.com>
// MooVeeStar may be freely distributed under the MIT license.

!function(a){"use strict";var b=a.MooVeeStar=new Events;b.Events=new Class({Implements:[Events],fireEvent:function(a,b){Events.prototype.fireEvent.call(this,a,b),Events.prototype.fireEvent.call(this,"*",{event:a,message:b})}}),b.Model=new Class({Implements:[b.Events,Options],idProperty:"id",properties:{},_props:{},options:{autoinit:!0},initialize:function(a,b){this.setOptions(b),this.options.autoinit===!0&&this.init(a)},init:function(a,b){return a=a&&"object"===typeOf(a)?a:{},this.set(Object.merge(Object.map(this.properties,function(a){return null!=a.initial?a.initial:null!=a["default"]?a["default"]:a.possible&&a.possible.length?a.possible[0]:null}),a),b),this.changed=[],!b&&this.fireEvent("ready",{model:this}),this},set:function(){var a;return this.changed=[],this.errors=[],"object"==typeof arguments[0]?(a=!!arguments[1],Object.forEach(arguments[0],function(b,c){this._set(c,b,a)}.bind(this))):(a=!!arguments[2],this._set.apply(this,arguments)),a||(this.changed.length&&this.fireEvent("change",{model:this,changed:this.changed.associate(this.changed.map(function(a){return a.key}))}),this.errors.length&&this.fireEvent("error",{model:this,errors:this.errors.associate(this.errors.map(function(a){return a.key}))})),this},_set:function(a,b,c){if(!a||"undefined"==typeof b)return this;var d=this._props[a];if(null!==b&&this.properties[a]&&this.properties[a].sanitize&&(b=this.properties[a].sanitize.call(this,b)),this.properties[a]&&this.properties[a].set)this.properties[a].set.call(this,b,a);else{if(this._props[a]&&this._props[a]===b)return this;var e=this.validate(a,b);if(this.properties[a]&&(this.properties[a].validate||this.properties[a].possible)&&e!==!0){var f={key:a,value:b,error:e,from:d};return this.errors.push(f),this.fireEvent("error:"+a,Object.merge({model:this},f)),this}null===b?delete this._props[a]:this._props[a]=b}var g={key:a,from:d,value:b};return this.changed.push(g),!c&&this.fireEvent("change:"+a,Object.merge({model:this},g)),this},get:function(a,b){if("array"===typeOf(a)){var c,d;return c=this,d={},Array.forEach(a,function(a){d[a]=c._get(a,b)}),d}return this._get(a,b)},_get:function(a,b){return!b&&this.properties[a]&&this.properties[a].get?this.properties[a].get.apply(this,arguments):"cid"===a?this.cid||this.getId():a&&"undefined"!=typeof this._props[a]?this._props[a]:null},getId:function(){var a=this.get(this.idProperty)||this.cid||String.uniqueID();return!this.cid&&(this.cid=a),a},unset:function(a){if(a=Array.from(a).clean(),!a.length)return this;var b={};return a.forEach(function(a){b[a]=null}),this.set(b)},destroy:function(){var a,b;b=this.getId(),a=Object.clone(this.toJSON()),this._props={},this.fireEvent("destroy",{model:this,properties:a,id:b,cid:this.cid})},validate:function(a,b){var c=this.properties[a];if(c){if("function"==typeof c.validate)return c.validate.call(this,b);if("array"===typeOf(c.possible))return c.possible.contains(b)||'"'+b+'" is not a valid value for "'+a+'"'}return!0},toJSON:function(){var a,b;return b=function(a,c,d){a&&(a.toJSON?d[c]=a.toJSON():"object"===typeOf(a)?Object.each(a,b):"array"===typeOf(a)&&Array.each(a,b))}.bind(this),a=Object.clone(this._props),b(a),a}}),b.Collection=new Class({Implements:[b.Events,Options],model:b.Model,options:{allowDuplicates:!1,silent:!1},_models:[],initialize:function(a,b){b=b||{},this._onModelEvent=this._onModelEvent.bind(this),this.cid=b.id||String.uniqueID(),delete b.id,this.setOptions(b),this.silent=!!b.silent,a&&this.add(a,{silent:!0})},_onModelEvent:function(a){"destroy"===a.event&&this.remove(a.message.model),this.fireEvent("model:"+a.event,a.message)},silence:function(){return"boolean"==typeof arguments[0]?this.silent=arguments[0]:"function"==typeof arguments[0]?(this.silent=!0,arguments[0](),this.silent=!1):0===arguments.length&&(this.silent=!0),this},add:function(a,b){var c,d,e,f;return c=this,b=b||{},d=[],e=[],f=0,Array.forEach([a].flatten(),function(a){var g=c.model?a instanceof c.model?a:new c.model(a):a;(!c.findFirst(g.getId())||c.options.allowDuplicates)&&(g.addEvent("*",c._onModelEvent),d.push(g),null!=b.at?c._models.splice(b.at+f,0,g):c._models.push(g),f++,g.errors.length&&e.push({model:g,errors:g.errors}))}),c.silent||b.silent||(d.length&&c.fireEvent("change",{event:"add",models:d,options:b}),d.length&&c.fireEvent("add",{models:d,options:b}),e.length&&c.fireEvent("error",{data:e,options:b})),c},remove:function(a,b){var c,d,e,f,g;for(c=this,b=b||{},f=[],/number|string/.test(typeof a)&&(a=this.get(a)),a=Array.from(a),d=a.length-1,e=0;d>=0;d--)g="object"!=typeof a[d]?c.findFirst(a[d]):a[d],c._models.contains(g)&&(g.removeEvent("*",c._onModelEvent),f.include(g),c._models.erase(g));return c.silent||b.silent||!f.length||(c.fireEvent("change",{event:"remove",models:f,options:b}),c.fireEvent("remove",{models:f,options:b})),c},empty:function(a){return a=a||{},this.remove(this.getAll(),a),this.silent||a.silent||(this.fireEvent("change",{event:"empty",options:a}),this.fireEvent("empty",{options:a})),this},move:function(a,b,c){var d;return c=c||{},a=a instanceof this.model?a:this.get(a),d=this.indexOf(a),null==b||b>this.getLength()?Array.push(this._models,Array.splice(this._models,d,1)[0]):Array.splice(this._models,b,0,Array.splice(this._models,d,1)[0]),this.silent||c.silent||(this.fireEvent("change",{event:"move",model:a,from:d,to:this.indexOf(a),options:c}),this.fireEvent("move",{model:a,from:d,to:this.indexOf(a),options:c})),this},getId:function(){return this.cid},getLength:function(){return this._models.length},at:function(a){return this._models[a]},get:function(a){return null==a?this.getAll():this.findFirst(a)||"number"==typeof a&&this.at(a)},getAll:function(){return this._models},find:function(a,b){return b=b||null,a=Array.from(a),this._models.filter(function(c){return a.contains(b?c.get(b):c.getId())})},findFirst:function(a,b){var c=this.find(a,b);return c.length?c[0]:null},toJSON:function(){return Array.map(this._models,function(a){return a.toJSON()})},destroy:function(a){return a=a||{},this.empty(Object.merge({},a,{silent:!0})),this.silent||a.silent||this.fireEvent("destroy",{collection:this,options:a}),this},set:function(){var a=arguments;return Array.forEach(this._models,function(b){b.set.apply(b,a)}),this}}),Array.each(["forEach","each","every","invoke","filter","map","some","indexOf","contains","getRandom","getLast"],function(a){b.Collection.implement(a,function(){return Array.prototype[a].apply(this._models,arguments)})}),b.View=new Class({Implements:[b.Events,Options],options:{autoattach:!0,autorender:!0,inflater:null,binder:null},events:{},template:null,element:null,elements:{},initialize:function(a,c){c=c||{},c.inflater=c.inflater||this.options.inflater||b.templates&&b.templates.inflate||null,c.binder=c.binder||this.options.binder||b.templates&&b.templates.init||null,this.setOptions(c),this.events=Object.clone(this.events||{}),this.model=this.model||a||null,this.setElement(),this.options.autoattach&&this.attachEvents(),this.options.autorender&&this.render()},setElement:function(a){return this.element||(this.element=$(a),!this.element&&this.template&&this.options.inflater&&(this.element=this.options.inflater(this.template,null,!0))),this.element&&(this.element.set("data-autobind","false"),this.element.set("data-has-view-controller","true"),this.element.store("__view",this),this.elements.container=this.element),this},toElement:function(){return this.element},render:function(a){return this.options.binder&&this.options.binder(this.element,a||this.model&&this.model.toJSON()||{}),this},_doDomManipulation:function(a,b){return a=a||"dispose",b=b||this.element,("destroy"===a||"empty"==a)&&this._doNestedViewsCall("destroy",b),this.detach(b,"empty"===a),b[a](),this.fireEvent(a,{view:this}),this},dispose:function(a){return this._doDomManipulation("dispose",a)},destroy:function(a){return this._doDomManipulation("destroy",a)},empty:function(a){return this._doDomManipulation("empty",a)},_doNestedViewsCall:function(a,b){var c;b=b||this.element,a=Array.from(a),c=b.getElements("*[data-has-view-controller]").clean().reverse(),c.forEach(function(b){var c=b.retrieve("__view");a.forEach(function(a){c&&"function"==typeof c[a]&&c[a]()})})},_doAttachDetach:function(a,b,c){var d,e;return d=this,b=b||this.element,a=a||"attach",e=[a+"Events"],"attach"===a&&e.push("render"),this._doNestedViewsCall(e,b),c||e.forEach(function(a){d[a]()}),this},attach:function(a,b){return this._doAttachDetach("attach",a,b)},detach:function(a,b){return this._doAttachDetach("detach",a,b)},attachEvents:function(){return this._attachedEvents=this._attachedEvents||{},this._boundEventFns=this._boundEventFns||{},Object.each(this.events,function(a,b){if(!this._attachedEvents[b]&&b&&b.length&&"function"===typeOf(this[a])){var c,d;if(b.contains(":")&&!/\:relay\(/gi.test(b)||null==Element.NativeEvents[b.substr(0,b.indexOf(":")>0?b.indexOf(":"):b.length)]?/attach\(([^\)]+)/gi.test(b)?(d=/attach\(([^\)]+)/gi.exec(b),c=b.replace(/:?attach\([^\)]+\)/i,""),d=d&&d[1],d=this._getEventObj(d)||this):(d=b.split(":")[0],c=b.replace(d+":",""),d=this._getEventObj(d)||this):(d=$(this.element),c=b),!(d&&c&&d.addEvent))throw new Error('[VIEW ERROR] Could not attach event "'+b+'". Something went awry.');this._boundEventFns[a]=this._boundEventFns[a]||this[a].bind(this),d.addEvent(c,this._boundEventFns[a]),this._attachedEvents[b]={attach:d,name:c,fn:this._boundEventFns[a]}}}.bind(this)),this},detachEvents:function(){return Object.each(this._attachedEvents||{},function(a){a.attach.removeEvent(a.name,a.fn)}),this._attachedEvents={},this},_getEventObj:function(c){var d,e;if("this"===c)return this;if("window"===c)return $(window);if("document"===c)return $(document);if("MooVeeStar"===c)return b;if($(c))return $(c);if(a[c]&&"function"===typeOf(a[c].addEvent))return a[c];e=(c||"").replace(/^this\./gi,"").split("."),d=this;for(var f=0,g=e.length;g>f;f++){if("undefined"==typeof d[e[f]])throw new Error('[VIEW ERROR] Could not attach event to this["'+c.replace(".",'"]["')+'"]. "'+e[f]+'" is undefined.');d=d[e[f]]}if(d&&"function"===typeOf(d.addEvent))return d;if(!d||"function"!==typeOf(d.addEvent))throw new Error("[VIEW ERROR] Could not attach event to this["+c.replace(".","][")+"], it does not have an addEvent method.");return null}}),b.Storage=new Class({store:function(){try{a.localStorage.setItem(this.getId(),JSON.encode(this.toJSON())),this.fireEvent("store")}catch(b){}},retrieve:function(){try{var b=a.localStorage.getItem(this.getId());return this.fireEvent("retrieve"),JSON.decode(b)}catch(c){}},eliminate:function(){return a.localStorage.removeItem(this.getId()),this.fireEvent("eliminate")}});var c={templates:{},cleanKey:function(a){return a.toLowerCase().trim().replace(/\s/g,"")},register:function(a,b){return"function"==typeof b?(c.registerScript(a,b),void 0):(a=c.cleanKey(a),b=b.replace(/<\!\-\-.*?\-\->/g,"").trim().replace(/\n/g," ").replace(/\s+/g," "),c.templates[a]=c.templates[a]||{},c.templates[a].dom=new Element('markup[html="'+b+'"]'),c.templates[a].markup=b,void 0)},registerScript:function(a,b){a=c.cleanKey(a),c.templates[a]=c.templates[a]||{},c.templates[a].script=b},getScript:function(a){if(a=c.cleanKey(a),c.templates[a]&&c.templates[a].script)return c.templates[a].script;throw new Error("Ain't no script for the template called "+a+" ("+typeOf(c.templates[a].script)+")")},check:function(a){return!!c.templates[c.cleanKey(a)]},get:function(a){var b;if(a=c.cleanKey(a),b=c.templates[a]){if(window.html5&&window.html5.supportsUnknownElements===!1){var d=html5.createElement("markup");return d.innerHTML=b.markup,$(d).set("data-templateid",a)}return b.dom.clone().set("data-templateid",a)}throw new Error("Ain't no template called "+a+" ("+typeOf(c.templates[a])+")")},inflateOnce:function(a,b,d){var e=c.inflate(a,b,d);return[e||[]].flatten().each(function(a){a.removeProperty("data-bind"),a.getElements("[data-bind]").removeProperty("data-bind")}),e},inflate:function(a,b,d){if("string"===typeOf(a)&&(a=c.get(a)),a){var e;return a.getElements("markup").each(function(a){var e,f;f=a.get("class")||null,e=c.inflate(a.get("template"),b,null!=d?d:!0),e="array"!==typeOf(e)?[e]:e,e.reverse().each(function(b){b.inject(a,"after"),f&&b.addClass(f)}),a.destroy()}),e=a.getChildren(),e.each(function(b){b.set("data-tpl",(b.get("data-tpl")||"").split(" ").include(a.get("data-templateid")).join(" ").clean())}),e=1===e.length?e[0]:e,!d&&c.init(e,b),e}return null},inflateSurround:function(a,b,d,e){var f,g;if(d=d||{},f="element"===typeOf(a)||"elements"===typeOf(a)||"array"===typeOf(a)?a:c.inflate(a,d,e)){if(b&&c.check(b))return g=(d||{})[b]||(d||{}).surround||{},g.els=f,c.inflate(b,g);throw new Error("Could not find the surround template: "+b)}},init:function(a,b){(a?"element"===typeOf(a)?[a]:a:[]).each(function(a){if(a.get("data-tpl")){var d=a.get("data-tpl").split(" ");d.each(function(d){c.templates[d].script?c.templates[d].script(a,b&&(b[d]||b[d.replace("tpl:","")])||b):c.bind(a,b)})}else c.bind(a,b)})},bind:function(a,b){b=b||{},"string"!==typeOf(b)||"element"!==typeOf(a)||0!==a.getChildren().length||a.get("data-bind")||(a.set("data-bind","value"),b={value:b}),(a?"element"===typeOf(a)?[a]:a:[]).each(function(a){var d,e;d=a.getElements("[data-bind]"),a.get("data-bind")&&d.unshift(a),d.length&&(e=a.getElements("*[data-tpl] *[data-bind]"),d=d.filter(function(a){return!e.contains(a)}),d.each(function(a){var d;d=a.get("data-bind").replace(/\s+/," ").trim().split(" ")||[],d.each(function(d){var e,f;f=b[d],void 0===f&&(f=null),e=a.get("data-bind-"+d)?a.get("data-bind-"+d).split(" "):["default"],e.each(function(b){if(0===b.indexOf("style:"))f=f&&0===String(f).indexOf("http")?"url("+f+")":f,a.setStyle(b.replace("style:",""),f);else if(0===b.indexOf("tpl:")&&c.check(b.replace("tpl:","")))if(a.empty(),"array"===typeOf(f)){var e=document.createDocumentFragment();f.each(function(a){var d=c.inflate(b.replace("tpl:",""),a,!1);d.removeProperty("data-tpl").getElements("*[data-tpl]").removeProperty("data-tpl"),e.appendChild(d)}),a.empty().appendChild(e)}else f&&a.grab(c.inflate(b.replace("tpl:",""),f));else"class"===b||"class"===d&&"default"===b?f&&a.addClass(f):"html"!==b&&"default"!==b||!/^element/.test(typeOf(f))?"default"===b?(b=/input|textarea|select/.test(a.get("tag"))?"value":"html",a.set(b,null!==f?f:"")):null!==f?a.set(b,f):a.removeProperty(b,f):(a.empty(),Array.from(f).forEach(function(b){a.grab(b)}))})})}));var f,g;f=a.getElements("*[data-tpl]"),f.length&&(g=a.getElements("*[data-tpl] *[data-tpl]"),f=f.filter(function(a){if(g.contains(a))return!1;var c=a.get("data-tpl");return b&&(b[c]||b[c.replace("tpl:","")])?!0:"false"!==a.get("data-autobind")}),f.each(function(a){var d=a.get("data-tpl");c.init(a,b&&(b[d]||b[d.replace("tpl:","")])||b)}))})},scrape:function(){$$('script[type="text/x-tpl"]').each(function(a){c.register(a.get("id"),a.get("text")),a.destroy()})}};b.templates=c,window&&window.html5&&window.html5.supportsUnknownElements===!1&&(window.html5.elements+=" markup",html5.shivDocument(document)),document.createElement("markup"),b.templates.scrape()}(this);