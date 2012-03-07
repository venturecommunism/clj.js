/**
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *                    Version 2, December 2004
 *
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 **/

Clojure = (function () {
	function keyword (string) {
		string         = new String(string);
		string.keyword = true;

		return string;
	}

	function symbol (string) {
		string        = new String(string);
		string.symbol = true;

		return string;
	}

	function vector (array) {
		array.vector = true;

		return array;
	}

	function list (array) {
		array.list = true;

		return array;
	}

	function set (array) {
		for (var i = 0; i < array.length; i++) {
			var value = array[i];

			for (var j = 0; j < array.length; j++) {
				if (i !== j && value !== array[j]) {
					throw new Error("the array contains non unique values");
				}
			}
		}

		array.set = true;

		return array;
	}

	var Rational = function () {
		var c = function (string) {
			var matches = string.match(/^(.*?)\/(.*?)$/);

			this.numerator   = parseInt(matches[1]);
			this.denominator = parseInt(matches[2]);
		}

		c.prototype.toNumber = function () {
			return this.numerator / this.denominator;
		}

		return c;
	}

	var Printer = (function () {
		function rfc3339 (date) {
			function pad (value, length) {
				var string = value.toString();

				return (new Array(length - string.length + 1).join('0')) + string;
			}

			var offset = date.getTimezoneOffset();
			
			return pad(date.getFullYear(), 4)
				+ "-" + pad(date.getMonth() + 1, 2)
				+ "-" + pad(date.getDate(), 2)
				+ "T" + pad(date.getHours(), 2)
				+ ":" + pad(date.getMinutes(), 2)
				+ ":" + pad(date.getSeconds(), 2)
				+ "." + pad(date.getMilliseconds(), 3)
				+ (offset > 0 ? "-" : "+")
				+ pad(Math.floor(Math.abs(offset) / 60), 2)
				+ ":" + pad(Math.abs(offset) % 60, 2);
		}

		function inspect (string) {
			var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
					meta      = {
						'\b': '\\b',
						'\t': '\\t',
						'\n': '\\n',
						'\f': '\\f',
						'\r': '\\r',
						'"' : '\\"',
						'\\': '\\\\'
					};

			escapable.lastIndex = 0;

			return '"' + (escapable.test(string) ? string.replace(escapable, function (a) {
				var c = meta[a];

				return typeof c === 'string' ? c :
					'\\\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) : string) + '"';
		}

		function stringify (obj, options) {
			if (obj == null) {
				return 'nil';
			}

			switch (typeof obj) {
				case 'boolean': return obj.toString();
				case 'number':  return obj.toString();
				case 'string':  return inspect(obj);
			}
			
			if (obj instanceof String) {
				if (obj.keyword) {
					return ":" + obj.toString();
				}
				else if (obj.symbol) {
					return obj.toString();
				}
				else {
					return inspect(obj.toString());
				}
			}
			else if (obj instanceof Number) {
				return obj.toString();
			}
			else if (obj instanceof Boolean) {
				return obj.toString();
			}
			else if (obj instanceof Array) {
				var result = '';

				for (var i = 0; i < obj.length; i++) {
					result += stringify(obj[i]) + ' ';
				}

				result = result.substr(0, result.length - 1);

				if (obj.list) {
					return '(' + result + ')';
				}
				else if (obj.set) {
					return '#{' + result + '}';
				}
				else {
					return '[' + result + ']';
				}
			}
			else if (obj instanceof RegExp) {
				return '#"' + obj.toString().substr(1).replace(/\/\w*$/, '') + '"';
			}
			else if (obj instanceof Date) {
				return '#inst "' + rfc3339(obj) + '"';
			}
			else {
				var result = '';

				for (var key in obj) {
					if (options.keys_are_keywords && typeof key === 'string') {
						key = keyword(key);
					}

					result += stringify(key) + ' ' + stringify(obj[key]) + ' ';
				}

				return '{' + result.substr(0, result.length - 1) + '}';
			}

			throw new Error('unknown object');
		}


		var c = function (object, options) {
			this.options = options || {};
			this.object  = object;
		}

		c.prototype.show = function () {
			return stringify(this.object, this.options);
		}

		return c;
	})();

	var Reader = (function () {
		function unescape (string) {
			var escapee = {
				'"':  '"',
				'\\': '\\',
				'/':  '/',
				b:    '\b',
				f:    '\f',
				n:    '\n',
				r:    '\r',
				t:    '\t'
			}

			var position = 0;
			var result   = '';

			while (string[position]) {
				if (string[position] === '\\') {
					position++;

					if (string[position] === 'u') {
						uffff = 0;
						for (i = 0; i < 4; i += 1) {
							hex = parseInt(string[++position], 16);

							if (!isFinite(hex)) {
								break;
							}

							uffff = uffff * 16 + hex;
						}

						result += String.fromCharCode(uffff);
					}
					else if (typeof escapee[string[position]] === 'string') {
						result += escapee[string[position]];
					}
					else {
						break;
					}
				}
				else {
					result += string[position];
				}

				position++;
			}

			return result;
		}

		function rfc3339 (string) {

		}

		function is_ignored (ch) {
			return ch == null || ch === ' ' || ch === ',' || ch === '\t' || ch === '\n' || ch === '\n'
		}

		function is_symbol (ch) {
			return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'z') || (ch >= 'A' || ch <= 'Z') || ch === '+' || ch === '!' || ch === '-' || ch === '_' || ch === '?' || ch === '.' || ch === ':' || ch === '/';
		}

		function is_both_separator (ch) {
			return ch == null || ch === ' ' || ch === ',' || ch === '"' || ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '#' || ch === ':' || ch === '\n' || ch === '\r' || ch === '\t';
		}

		function is_keyword_separator (ch) {
			return ch == null || ch === ' ' || ch === ',' || ch === '"' || ch === '{' || ch === '}' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '#' || ch === ':' || ch === '\'' || ch === '^' || ch === '@' || ch === '`' || ch === '~' || ch === '\\' || ch === ';' || ch === '\n' || ch === '\r' || ch === '\t';
		}

		var c = function (string, options) {
			this.options  = options || {};
			this.string   = string
			this.position = 0;
		}

		c.prototype.current = function () {
			return this.string[this.position];
		}

		c.prototype.seek = function (n) {
			return this.position += n;
		}

		c.prototype.after = function (n) {
			return this.string[this.position + n];
		}
		
		c.prototype.substr = function (start, length) {
			return this.string.substr(this.position + start, length);
		}

		c.prototype.start_with = function start_with (match) {
			for (var i = 0; i < match.length; i++) {
				if (this.string[this.position + i] !== match[i]) {
					return false;
				}
			}

			return true;
		}

		c.prototype.eof = function () {
			return this.position >= this.string.length;
		}

		c.prototype.remaining_length = function () {
			return this.string.length - this.position;
		}

		c.prototype.ignore = function () {
			var current = this.current();

			while (!this.eof() && is_ignored(current)) {
				this.seek(1);

				current = this.string[this.position];
			}
		}

		c.prototype.next_type = function () {
			var current = this.current();

			if (current === '-' || current === '+' || !isNaN(parseInt(current))) {
				return "number";
			}

			switch (current) {
				case '^':           return "metadata";
				case 't': case 'f': return "boolean";
				case 'n':           return "nil";
				case '\\':          return "char";
				case ':':           return "keyword";
				case '"':           return "string";
				case '{':           return "map";
				case '(':           return "list";
				case '[':           return "vector";
			}

			if (current == '#') {
				switch (this.after(1)) {
					case 'i': return "instant";
					case '{': return "set";
					case '"': return "regexp";
				}
			}

			return "symbol";
		}

		c.prototype.read_next = function () {
			this.ignore();

			if (this.eof()) {
				throw new Error('unexpected EOF');
			}

			var type   = this.next_type(),
			    result = this["read_" + type]();

			if ((type === "nil" || type === "boolean") && typeof result === 'string') {
				type = "symbol";
			}

			if (type !== "map" && type !== "nil") {
				result.type = type;
			}

			return result;
		}

		c.prototype.read_metadata = function () {
			var metadatas = [];

			while (this.current() === '^') {
				this.seek(1);

				metadatas.push(this.read_next());
			}

			return this.read_next();
		}

		c.prototype.read_nil = function () {
			if (this.remaining_length() < 3 || !this.start_with("nil") || !is_both_separator(this.after(3))) {
				return this.read_symbol();
			}

			this.seek(3);

			return null;
		}

		c.prototype.read_boolean = function () {
			if (this.current() === 't') {
				if (this.remaining_length() < 4 || !this.start_with("true") || !is_both_separator(this.after(4))) {
					return this.read_symbol();
				}

				this.seek(4);

				return true;
			}
			else {
				if (this.remaining_length() < 5 || !this.start_with("false") || !is_both_separator(this.after(5))) {
					return this.read_symbol();
				}

				this.seek(5);

				return false;
			}
		}

		c.prototype.read_number = function () {
			var length = 0;

			while (!is_both_separator(this.after(length))) {
				length++;
			}

			var string = this.substr(0, length);

			this.seek(length);

			if (string.indexOf('/') != -1) {
				return new Rational(string);
			}
			else if (string.indexOf('r') != -1 || string.indexOf('R') != -1) {
				var parts = string.toLowerCase().split('r')
				var base  = parts.shift();

				return parseInt(parts.join('r'), base);
			}
			else {
				if (string[string.length - 1] == 'N' || string[string.length - 1] == 'M') {
					string = string.substr(0, string.length - 1);
				}

				return parseFloat(string);
			}
		}

		c.prototype.read_char = function () {
			return null;
		}

		c.prototype.read_symbol = function () {
			var length = 0;

			while (is_symbol(this.after(length))) {
				length++;
			}

			var string = this.substr(0, length);

			this.seek(length);

			return symbol(string);
		}

		c.prototype.read_keyword = function () {
			var length = 0;

			this.seek(1);

			while (!is_keyword_separator(this.after(length))) {
				length++;
			}

			var string = this.substr(0, length);

			this.seek(length);

			return keyword(string);
		}

		c.prototype.read_string = function () {
			var length = 0;

			this.seek(1);

			while (this.after(length) !== '"') {
				if (this.after(length) === '\\') {
					length++;
				}

				length++;
			}

			var string = this.substr(0, length);

			this.seek(length + 1);

			return unescape(string);
		}

		c.prototype.read_regexp = function () {
			var length = 0;

			this.seek(2);

			while (this.after(length) !== '"') {
				if (this.after(length) === '\\') {
					length++;
				}

				length++;
			}

			var string = this.substr(0, length);

			this.seek(length + 1);

			return new RegExp(string);
		}

		c.prototype.read_instant = function () {
			return null;
		}

		c.prototype.read_list = function () {
			var result = [];

			this.seek(1); this.ignore();

			while (this.current() != ')') {
				result.push(this.read_next());

				this.ignore();
			}

			this.seek(1)

			return list(result);
		}

		c.prototype.read_set = function () {
			var result = [];

			this.seek(2); this.ignore();

			while (this.current() != '}') {
				result.push(this.read_next());

				this.ignore();
			}

			this.seek(1)

			return set(result);
		}

		c.prototype.read_vector = function () {
			var result = [];

			this.seek(1); this.ignore();

			while (this.current() != ']') {
				result.push(this.read_next());

				this.ignore();
			}

			this.seek(1)

			return vector(result);
		}

		c.prototype.read_map = function () {
			var result = {};

			this.seek(1); this.ignore();

			while (this.current() != '}') {
				var key = this.read_next();
				this.ignore();
				var value = this.read_next();
				this.ignore();

				result[key] = value;
			}

			this.seek(1)

			return result;
		}

		c.prototype.parse = function () {
			var result = this.read_next();

			this.ignore();

			if (this.current()) {
				throw new Error("there is some unconsumed input");
			}

			return result;
		}

		return c;
	})();

	return {
		keyword: keyword,
		symbol:  symbol,
		vector:  vector,
		list:    list,
		set:     set,

		Rational: Rational,

		Printer: Printer,
		Reader: Reader,

		stringify: function (obj, options) {
			return new Printer(obj, options).show();
		},

		parse: function (obj, options) {
			return new Reader(obj, options).parse();
		}
	};
})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Clojure
}
