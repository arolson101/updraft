'use strict';

import * as Column_ from "./Column";
import * as Mutate_ from "./Mutate";
import * as Query_ from "./Query";
import * as Store_ from "./Store";
import * as Table_ from "./Table";
import * as SQLiteWrapper_ from "./SQLiteWrapper";
import * as WebsqlWrapper_ from "./WebsqlWrapper";

export namespace Updraft {
	export import Query = Query_;
	export import Mutate = Mutate_;
	
	export import ColumnType = Column_.ColumnType;
	export import Column = Column_.Column;
	export import OrderBy = Table_.OrderBy;
	export import Table = Table_.Table;
	export import TableSpec = Table_.TableSpec;
	export import TableChange = Table_.TableChange;

	export import Store = Store_.Store;
	export import createStore = Store_.createStore;

	export import mutate = Mutate_.mutate;

	export import wrapSql = SQLiteWrapper_.wrapSql;
	export import wrapWebSql = WebsqlWrapper_.wrapWebsql;
}


// declare var module: any;
// if (typeof module !== "undefined") {
// 	module.exports = Updraft;
// }

export default Updraft;
