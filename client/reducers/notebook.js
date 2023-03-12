const { combineReducers } = require("redux");
const { updateArrayState } = require("../functions.js");

const rootReducer = combineReducers({
  ankiStatus,
  modal,
  notes,
  editError,
  editing,
  showingId,
  tags,
  tagFilter,
  wordNotes,
  importStatus,
  queryLoading,
  q,
  queryQ,
  queryTag,
  offset,
  hasNext,
  currentPageMarker,
  nextPageMarker,
  prevPageMarkers,
});

function q(state = "", action) {
  switch (action.type) {
    case "NOTEBOOK_Q":
      return action.q;
    case "NOTEBOOK_QUERY":
      return !action.queryQ ? "" : state;
    default:
      return state;
  }
}

function ankiStatus(state = 0, action) {
  switch (action.type) {
    case "ANKI_CONNECT":
      return 1;
    case "ANKI_SYNC":
      return 2;
    case "ANKI_CONNECT_DONE":
    case "ANKI_SYNC_DONE":
    case "ANKI_DISCONNECT":
      return 0;
    default:
      return state;
  }
}

function tagFilter(state = "", action) {
  switch (action.type) {
    case "NOTEBOOK_TAGFILTER":
      return action.tagFilter;
    default:
      return state;
  }
}

function importStatus(state = 0, action) {
  switch (action.type) {
    case "NOTEBOOK_IMPORT":
      return 1;
    case "NOTEBOOK_IMPORT_DONE":
      return 0;
    default:
      return state;
  }
}

function modal(state = 0, action) {
  switch (action.type) {
    case "NOTEBOOK_MODAL":
      return +!state;
    default:
      return state;
  }
}

function hasNext(state = false, action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY":
      return false;
    case "NOTEBOOK_QUERY_RESULT":
      return action.hasNext || false;
    case "NOTEBOOK_QUERY_ERROR":
      return false;
    default:
      return state;
  }
}

function editError(state = null, action) {
  switch (action.type) {
    case "NOTEBOOK_EDIT_ERROR":
      return action.error;
    case "NOTEBOOK_EDIT":
    case "NOTEBOOK_EDIT_END":
      return null;
    default:
      return state;
  }
}

function editing(state = null, action) {
  switch (action.type) {
    case "NOTEBOOK_PUT":
      if (state) {
        if (action.insert) {
          if (!state.note.id) {
            return { note: action.note };
          }
        } else if (state.note.id === action.note.id) {
          return { ...state, note: action.note };
        }
      }
      return state;
    case "NOTEBOOK_EDIT_END":
    case "SEARCH_START":
      return null;
    case "NOTEBOOK_CREATE":
      return {
        note: {},
      };
    case "NOTEBOOK_EDIT":
      let { note, word, dict } = action;
      if (!dict && note.dictid) {
        dict = note.dictid.slice(0, note.dictid.indexOf("_"));
      }
      return {
        note,
        word,
        dict,
      };
    default:
      return state;
  }
}

function showingId(state = null, action) {
  switch (action.type) {
    case "NOTEBOOK_CLEAR":
    case "NOTEBOOK_QUERY":
      return null;
    case "NOTEBOOK_TOGGLE":
      let id = typeof action.note == "object" ? action.note.id : action.note;
      return state == id ? null : id;
    default:
      return state;
  }
}

function wordNotes(state = [], action) {
  switch (action.type) {
    case "NOTEBOOK_PUT":
      state = state.slice();
      let i = state.findIndex((note) => note.id === action.note.id);
      if (i != -1) {
        state.splice(i, 1, action.note);
      } else {
        state.unshift(action.note);
      }
      return state;
    case "NOTEBOOK_WORDNOTES":
      return action.wordNotes || [];
    case "NOTEBOOK_DELETE":
      let j = state.findIndex((note) => note.id === action.id);
      if (j != -1) {
        state = state.slice();
        state.splice(j, 1);
      }
      return state;
    default:
      return state;
  }
}

function tags(state = [], action) {
  switch (action.type) {
    case "NOTEBOOK_PUT":
    case "NOTEBOOK_DELETE":
      return updateArrayState(state, action.putTags, action.deleteTags, "name");
    case "NOTEBOOK_TAGS":
      return action.tags || [];
    default:
      return state;
  }
}

function queryLoading(state = false, action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY":
      return true;
    case "NOTEBOOK_QUERY_RESULT":
      return false;
    case "NOTEBOOK_QUERY_ERROR":
      return false;
    default:
      return state;
  }
}

function notes(state = [], action) {
  switch (action.type) {
    case "NOTEBOOK_PUT":
      if (action.insert) {
        state = state.slice();
        state.unshift(action.note);
      } else {
        let i = state.findIndex((note) => note.id === action.note.id);
        if (i != -1) {
          state = state.slice();
          state.splice(i, 1, action.note);
        }
      }
      return state;
    case "NOTEBOOK_DELETE":
      let j = state.findIndex((note) => note.id === action.id);
      if (j != -1) {
        state = state.slice();
        state.splice(j, 1);
      }
      return state;
    case "NOTEBOOK_CLEAR":
      return [];
    case "NOTEBOOK_QUERY":
      return action.clear ? [] : state;
    case "NOTEBOOK_QUERY_RESULT":
      return action.notes || [];
    default:
      return state;
  }
}

function queryTag(state = "", action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY":
      return action.queryTag ?? "";
    case "NOTEBOOK_CLEAR":
      return "";
    default:
      return state;
  }
}

function queryQ(state = "", action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY":
      return action.queryQ ?? "";
    case "NOTEBOOK_CLEAR":
      return "";
    default:
      return state;
  }
}

function offset(state = 0, action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY_RESULT":
      return action.offset || 0;
    case "NOTEBOOK_CLEAR":
      return 0;
    default:
      return state;
  }
}

function currentPageMarker(state = null, action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY_RESULT":
      return action.currentPageMarker || null;
    default:
      return state;
  }
}

function nextPageMarker(state = null, action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY_RESULT":
      return action.nextPageMarker || null;
    default:
      return state;
  }
}

function prevPageMarkers(state = [], action) {
  switch (action.type) {
    case "NOTEBOOK_QUERY_RESULT":
      return action.prevPageMarkers || [];
    default:
      return state;
  }
}

module.exports = rootReducer;
