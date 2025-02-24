import { combineReducers } from "redux";
import { searchRepositories } from "../action-creators";

const reducers = combineReducers({
  repositories: searchRepositories,
});

export default reducers;
