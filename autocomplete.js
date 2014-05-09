(function(window, document, undefined) {
	'use strict';
	function getPosition(parent) {
		var pos = {left:0, top: 0};;
		while (parent) {
			pos.left += parent.offsetLeft;
			pos.top += parent.offsetTop;
			parent = parent.parentElement;
		}
		return pos;
	};

	// source can be undefined or ['item1', ...] or Callback
	function dataSource (source) {
		var ds = {}; // {str: [], ...}

		var self = {
			async: false,
			set: function(data, str) {
				str = str || '';
				ds[str] = data;
			},
			get: function(str, callback) {
				var subset = [];

				for( var k in ds ) {
					if (str.indexOf(k) !== -1) {
						var data = ds[k], subset = [];
						for (var i=0; i < data.length; i++)	{
							if (data[i].match(new RegExp(str,"i"))) subset.push(data[i]);
						}
						// if we already have the data, use it.
						if (self.async && callback !== undefined) callback(subset);
						return subset;
					}
				}
				if (self.async) {
					source(str, function(subset) {
						// Store data for future use
						ds[str] = subset;
						callback(subset);
					});
				}
				return [];
			}
		};
		if (source.constructor == Function) self.async = true; 
		else if (source !== undefined) ds[''] = source;

		return self;
	};

	// Creates an instance of a drop down and binds it to the element and data source
	function createDropDown (elem, ds) {
		var listElem;
		var current = null;
		var keyTimer = null;
		var mouseTimer = null;

		function createList() {
			var listElem = document.createElement("div");
			listElem.className = 'options';
			listElem.style.position = "absolute";

			var pos = getPosition(elem);
			listElem.style.left = pos.left + 'px';
			listElem.style.top = (elem.offsetHeight + pos.top) + 'px';
			listElem.style.width = elem.clientWidth + 'px';
			listElem.style.display = "none";
			document.getElementsByTagName('body')[0].appendChild(listElem);
			listElem.onclick = function(e) {
				if (e.target.tagName === 'A') pick(e.target);
			}
			return listElem;
		}

		function pick(me) {
			current = null;
			elem.value = me.innerHTML;
			self.clear();
		}

		var self = {
			clear: function () {
				listElem.innerHTML = '';
				listElem.style.display = "none";
				current = null;
				return true;
			},
			render: function(d) {
				listElem.innerHTML = '';
				current = null;
				for ( var i in d ) {
					var t = document.createElement("a");
					t.innerHTML = d[i];
					listElem.appendChild(t);
				}
				listElem.style.display = "block";
			},
			selectNext: function() {
				var temp = current;
				var next = (current) ? current.nextSibling || current : listElem.children[0];
				if (current) current.className = "";
				next.className = "selected";
				current = next;
				return (temp === current);
			},
			selectPrev: function() {
				if (!current) return true;
				var prev = current.previousSibling || current;
				current.className = "";
				prev.className = "selected";
				current = prev;
			},
			useCurrent: function() {
				if (current) {
					pick(current);
					return false;
				} else {
					listElem.style.display = "none";
					return true;
				}
			},
			update: function() {
				clearTimeout(keyTimer);
				keyTimer = setTimeout(function(){
					if (elem.value.length === 0) return;
					if (ds.async) {
						// creating a closure as the value of element could change before the callback respon
						ds.get(elem.value, (function(str){
							return function(ds) {
								if (elem.value === str) self.render(ds);
								else self.update();						
							}
						})(elem.value));
					} else self.render(ds.get(elem.value));
				}, 100);
			}
		};

		listElem = createList();
		listElem.onmouseover = function() {
			clearTimeout(mouseTimer);
			if (current) {
				current.className = "";
				current = null;
			}
		}
		listElem.onmouseout = function() {
			mouseTimer = setTimeout(function(){
				self.clear();
			}, 400);
		}

		return self;
	}

	// Handle key press events on dropdown
	function keyBind(elem, dropdown) {
		elem.onkeydown = function(e) {
			// tab key
			if (e.which === 9) return dropdown.useCurrent();
		};

		elem.onkeyup = function(e) {
			if (elem.value.length === 0) return dropdown.clear();
			switch (e.which) {
				case 40: // down key
					return dropdown.selectNext();
					break;
				case 38: // up key
					return dropdown.selectPrev();
					break;
				case 13: // enter
					return dropdown.useCurrent();
					break;
				case 9:
					return true;
					break;
				default:
					dropdown.update();
					return true;
					break;
			}
		};
	};
	
	// Main object
	function autoComplete(elem, d) {
		var ds = dataSource(d);
		if (elem.constructor == String)	{
			elem = document.querySelectorAll(elem);
		} 
		if (elem.length && elem.length > 0) {
			for (var i in elem) {
				var dd = createDropDown(elem[i], ds);
				keyBind(elem[i], dd);
			}
		} else {
			var dd = createDropDown(elem, ds);
			keyBind(elem, dd);
		}

		return {
			// This can be extended to more methods as required
			data: ds
		};
	}

	window.autoComplete = autoComplete;
})(window, document);