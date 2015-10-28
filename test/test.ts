///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/index"/>

import { expect } from "chai";
import Updraft from "../src/index";

var { Column } = Updraft;


interface _Todo<key, str, bool> {
  id: key;
  text: str;
  completed: bool;
}

type Todo = _Todo<number, string, boolean>;


var todoSpec = {
  name: "todos",
  columns: {
    id: Column.Int().Key(),
  }
}
