MooVeeStar
==========

MooVeeStar is a MV* Framework built ontop of MooTools. It has been based off other MVC Frameworks such as Backbone.js and Epitome.


## MooVeeStar

MooVeeStar inherits from Events, and can therefore be used as a mediator with `MooVeeStar.fireEvent('eventname', eventObject)` and `MooVeeStar.addEvent('eventname', function(eventObject){ ... }))`

## MooVeeStar.Model

### Methods

#### constructor/initialize
---
* *Expects:* JSON object of new model's properties
* *Returns:* The model object, `this`

```
var employee = new MooVeeStar.Model({'id':123,'name':'John Smith','sex':'male'})
```

#### set
----
* *Expects:* `(String) key, (Mixed) value, [(Boolean) slient]` or `(Object) object, [(Boolean) slient]`
* *Returns:* `this`


#### get
----
* *Expects:* `(String) key, [(Boolean) raw]` or `(Array) keys, [(Boolean) raw]`
* *Returns:* The value or null


#### getId
---
* *Expects:* _nada_
* *Returns:* The `idProperty` of the model. Also lazily set the `cid` here, if it has not been already.


#### unset
---
* *Expects:* `(String) key, [(Boolean) silent]` or `(Array) keys, [(Boolean) silent]`
* *Returns:* `this`


#### destroy
---
Destroy the model and fire the `destroy` passing the id.


#### toJSON
---
Return a copy of the models properties as stored. Note, this does not return properties' values with custom getters.



### Properties

#### idProperty
---
A model's unique identifier property to use. It will default to `id` unless otherwise set.
```javascript
var Employee = new Class({
  Extends: MooVeeStar.Model,
  idProperty: 'ssn'
});

var employee = new Employee({'ssn':'123-45-6789', 'name':'John Smith'});
```

#### cid
---
A unique identifier. Lazily set in `getId()`, it will be assigned a unique string if the model has no `idProperty` value


#### properties
---
Set an `initial` value; Override the default `get` and/or `set` methods; Define `validate` and/or `sanitize` methods for each property.

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


#### changed
---
An array of all the changed properties of the last set call


#### errors
---
An array of all the properties that had an error of the last set call
