import * as Query_ from "./Query";
import * as Mutate_ from "./Mutate";
import * as Table_ from "./Table";
import * as Column_ from "./Column";

export module Updraft {
	export import Query = Query_;
	export import Mutate = Mutate_;

	export import ColumnType = Column_.ColumnType;
	export import Column = Column_.Column;
	export import Table = Table_.Table;
	export import TableSpec = Table_.TableSpec;
	export import Store = Table_.Store;
	
	export import mutate = Mutate_.mutate;
}


// declare var module: any;
// if (typeof module !== "undefined") {
// 	module.exports = Updraft;
// }

export default Updraft;
