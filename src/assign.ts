
namespace Updraft {
	/* istanbul ignore next */
	function toObject(val: any) {
		if (val === null || val === undefined) {
			throw new TypeError("Object.assign cannot be called with null or undefined");
		}
		return Object(val);
	}
	
	/* istanbul ignore next */
	let ObjectAssign = (<any>Object).assign || function (target: Object, source: Object) {
		const hasOwnProperty = Object.prototype.hasOwnProperty;
		const propIsEnumerable = Object.prototype.propertyIsEnumerable;
		let from: Object;
		let to = toObject(target);
		let symbols: any[];
	
		for (let s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);
	
			for (let key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}
	
			if ((<any>Object).getOwnPropertySymbols) {
				symbols = (<any>Object).getOwnPropertySymbols(from);
				for (let i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}
	
		return to;
	};
	
	export var assign = ObjectAssign;
}
