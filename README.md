MooVeeStar
==========

MooVeeStar is a MV* Framework built ontop of MooTools. It has been based off other MVC Frameworks such as Backbone.js and Epitome.

---
#Documentation

## MooVeeStar

`MooVeeStar` is the object/namespace that holds the MooVeeStar modules. However, the `MooVeeStar` object itself is an instantiated MooTools Events object, and can therefore be used as a global mediator as:
```javascript
MooVeeStar.addEvent('eventname', function(eventObject){ ... }));
MooVeeStar.fireEvent('eventname', eventObject);
````

## MooVeeStar.Model
The MooVeeStar.Model is a MooTools class that implements the Events class already.

### Methods

#### constructor/initialize
---
```javascript
(model) new MooVeeStar.Model([(Object) json]);
```
* **Parameters**
  * _**json**_ - A json object that will be dereferenced and set as the properties for the model.
* **Returns**
  * The MooVeeStar Model object
* **Example**

  ```javascript
  var employee = new MooVeeStar.Model({'id':123,'name':'John Smith','sex':'male'})
  ```


#### set
---
```javascript
(model) model.set((String) key, (Mixed) value, [(Boolean) slient]);
(model) model.set((Object) object, [(Boolean) slient]);
```
* **Parameters**
  * **key** - The model key to store the _value_
  * **value** - The value to store
  * _**silent**_ - Pass `true` to suppress events firing
  * -- _or_ --
  * **object** - An object with the key & values to set
  * _**silent**_ - Pass `true` to suppress events firing
* **Returns**
  * The MooVeeStar Model object
* **Events** _(if `silent != true`)_
  * **change:&lt;key&gt;** - Fired for each successfull key changed
  * **error:&lt;key&gt;** - Fired for and errors resulting from validation
  * **change** - Fired once if and after any successfull changes
  * **error** - Fired once if and after any errors


#### get
---
```javascript
(Mixed) model.get((String) key, [(Boolean) raw]);
(Object) model.get((Array) keys, [(Boolean) raw]);
```
* **Parameters**
  * **key/keys** - A single key, or an array of keys
  * _**raw**_ - Return the raw value, skipping any `properties.get` overrides
* **Returns**
  * The value of the key, or an object of `{key:value}` for a passed array.


#### getId
---
```javascript
(String) model.getId();
```
* **Returns**
  * The `idProperty` of the model, or the `cid` here if it has not been set.


#### unset
---
```javascript
(model) model.unset((String) key, [(Boolean) silent]);
(model) model.unset((Array) keys, [(Boolean) silent]);
```
* **Parameters**
  * **key/keys** - The key or array of keys to unset from the model
  * _**silent**_ - Pass `true` to suppress events firing
* **Returns**
  * The MooVeeStar Model object
* **Events** _(if `silent != true`)_
  * **change:&lt;key&gt;** - Fired for each successfull key unset
  * **error:&lt;key&gt;** - Fired for any errors while unsetting
  * **change** - Fired once if and after any successfull unsets
  * **error** - Fired once if and after any errors


#### destroy
---
```javascript
(model) model.destroy();
```
* **Returns**
  * The MooVeeStar Model object
* **Events**
  * **destroy**


#### toJSON
---
```javascript
(Object) model.toJSON();
```
* **Returns**
  * A recursively dereferenced clone of the model's properties



### Properties

#### idProperty
---
* **Description**
  * A configurable key that will be used to uniquely identify the model. It will default to `id`.
* **Example**
    
    ```javascript
    var Employee = new Class({
      Extends: MooVeeStar.Model,
      idProperty: 'ssn'
    });
    var employee = new Employee({'ssn':'123-45-6789', 'name':'John Smith'});
   ```

#### properties
---
* **Description**
  * A configurable object with properties set Set an `initial` value; Override the default `get` and/or `set` methods; Define `validate` and/or `sanitize` methods for each property.
* **Example**
  
  ```javascript
    var Employee = new Class({
      Extends: MooVeeStar.Model,
      idProperty: 'ssn',
      properties: {
        employed: {
          initial: true
        },
        fullname: {
          set: function(value){
            var names = value.split(' ');
            this.set('firstname', names[0]);
            this.set('lastname', names[1]);
          },
          get: function(){
            return this.get('firstname')+' '+this.get('lastname');
          }
        },
        ssn: {
          validate: function(value){
            return /^\d{3}-\d{2}-\d{4}$/.test(value) || 'The SSN was not formatted correctly';
          }
        }
      }
    });
    var employee = new Employee({'ssn':'123-45-6789', 'firstname':'John','lastname':'Smith'});
    employee.addEvent('error:ssn', function(event){
      console.error(event.error);
    });
    console.log(employee.get('fullname'));
    employee.set('123456789');
  ```

#### cid
---
* **Description**
  * An internal unique identifier. Lazily set in `getId()`, it will be assigned a unique string if the model has no `idProperty` value


#### changed
---
* **Description**
  * An array of all the changed properties of the last set call


#### errors
---
* **Description**
  * An array of all the properties that had an error of the last set call



## MooVeeStar.Collection

### Methods

#### constructor/initialize
---

#### add
---
```javascript
(collection) collection.add((String) item, [(Boolean) slient]);
(collection) collection.add((Array) items, [(Boolean) slient]);
```
* **Description**
  * Add an item or items


#### remove
---
```javascript
(collection) collection.remove((String) model, [(Boolean) slient]);
(collection) collection.remove((Array) model, [(Boolean) slient]);
(collection) collection.remove((Number) index, [(Boolean) slient]);
(collection) collection.remove((String) cid, [(Boolean) slient]);
```
* **Description**
  * Removes a model or models from the collection by model, models, index or cid


#### getId
---
```javascript
(String) collection.getId();
```
* **Returns**
  * The unique cid for the collection


#### getLength
---
```javascript
(Number) collection.getLength();
```

#### at
---
```javascript
(model) collection.at((Number) index);
```

#### get
---
```javascript
(model) collection.get((String) cid);
(model) collection.get((Number) index);
(Array) collection.get();
```

#### getAll
---
```javascript
(Array) collection.getAll();
```

#### find
---
```javascript
(Array) collection.find((Array) values, [(String) against]);
(Array) collection.find((Mixed) values, [(String) against]);
```

#### findFirst
---
```javascript
(model) collection.find((Mixed) values, [(String) against]);
```

#### toJSON
---
```javascript
(Object) collection.toJSON();
```

### Model Methods
A MooVeeStar.Collection can call Model methods for all the models in the collection

#### set
---

### Array Methods
A MooVeeStar.Collection also implements these Array methods:
`forEach`, `each`,`every`,`invoke`,`filter`,`map`,`some`,`indexOf`,`contains`,`getRandom`,`getLast`

