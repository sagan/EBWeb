import React from "react";
import Modal from "react-modal";
import { ebtext2html, wordGlobalId, getCanonicalUrlSearch } from "../functions";
import WordShareDialog from "./WordShareDialog.jsx";
import AddNotebookIcon from "./AddNotebookIcon.jsx";
import PlaySoundIcon from "./PlaySoundIcon.jsx";
import FurigaraIcon from "./FurigaraIcon.jsx";

export default class DictContent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let {
      notebookEdit,
      notebookPut,
      searchDict,
      rootPath,
      userConfig,
      furiganaEnable,
      toggleFurigana,
    } = this.props;
    return (
      <div>
        {!!this.props.showTitle && (
          <h3 className="dict-title">
            <b>{searchDict}</b>の検索結果 ({this.props.words.length})
          </h3>
        )}
        {this.props.words.map((word, i) => {
          let id = this.props.wordIds[i];
          let globalId = wordGlobalId(word, searchDict);
          let note = this.props.wordNotes.find(
            (note) => note.dictid == globalId
          );
          return (
            <div className="word" id={id} key={id}>
              <h2 className="word-title">
                <a
                  className="word-permalink"
                  title="この単語のリンク（パーマリンク）"
                  href={`${rootPath}${getCanonicalUrlSearch({
                    dict: searchDict,
                    page: word.page,
                    offset: word.offset,
                  })}`}
                >
                  <span
                    className="word-title-text"
                    dangerouslySetInnerHTML={{
                      __html: ebtext2html(word.heading, rootPath, searchDict),
                    }}
                  />
                </a>
                <span
                  title="単語を共有する"
                  aria-label="単語を共有する"
                  className="emoji needjs"
                  aria-pressed={this.props.sharing === word ? "true" : "false"}
                  onClick={(e) => this.props.openShare(word)}
                  role="button"
                >
                  🔗
                </span>
                <AddNotebookIcon
                  note={note}
                  word={word}
                  dict={searchDict}
                  notebookEdit={notebookEdit}
                  notebookPut={notebookPut}
                />
                <PlaySoundIcon
                  word={word}
                  wordId={globalId}
                  dict={searchDict}
                  playSound={this.props.playSound}
                  playingSoundWordId={this.props.playingSoundWordId}
                  playing={this.props.playing}
                />
                {furiganaEnable ? (
                  <FurigaraIcon
                    userConfig={userConfig}
                    word={word}
                    dict={searchDict}
                    toggleFurigana={toggleFurigana}
                  />
                ) : null}
              </h2>
              <div
                className="content"
                dangerouslySetInnerHTML={{
                  __html: ebtext2html(
                    word.furiganaStatus == 2 ? word.furiganaText : word.text,
                    rootPath,
                    searchDict
                  ),
                }}
              />
            </div>
          );
        })}
        <Modal
          isOpen={!!this.props.sharing}
          onRequestClose={this.props.closeShare}
        >
          {this.props.sharing ? (
            <WordShareDialog
              publicUrl={this.props.publicUrl}
              rootPath={rootPath}
              searchDict={searchDict}
              dict={this.props.dict}
              defaultDict={this.props.defaultDict}
              word={this.props.sharing}
              close={this.props.closeShare}
            />
          ) : null}
        </Modal>
      </div>
    );
  }
}
