import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { timingSafeEqual } from 'crypto';


var emoji = require("./emoji.json");
const ipcRenderer = window.require('electron')
const clipboard = window.require('electron')
const electron = window.require('electron')
const giphyApi = require('giphy-api')();


/**
 * TODO:
 * rewrite app in typescript and streamline data processing
 */
class CircularArray {
  constructor(max) {
    this.ptr = 0;
    this.max = 10;
    this.buf = Array(this.max);
  }
  push(T) {
    if (++this.ptr > this.max)
      this.ptr = 0;
    this.buf[this.ptr] = T;
  }
}

function requestSendKeys(data) {
  electron.ipcRenderer.send('request-keysend', {
    arg1: "test argument",
  });
}
function hideWindow() {
  electron.remote.getCurrentWindow().hide();
}

class EmojiIndex {
  constructor() {
    this.cache = new Array();

    this._emoji = emoji.filter(function (item) {
      item.keywords = item.keywords.split("|").map(function (item) {
        let i = item.trim().toLowerCase();
        return i;
      })

      //parse all expanded | keys to expand sentences into a flat array, 
      //possibly a performance issue tbh
      for (let i = 0; i < item.keywords.length; ++i) {
        let x = item.keywords[i].split(" ");
        if (x.length > 1) {
          item.keywords = item.keywords.concat(x);
        }
      }

      /*if (item.char.length > 2) {
        console.log("[EmojiIndex -> init] removed superfulous gender character")
        item.char = item.char.slice(0, -1);
      }*/
      return item;
    });
    console.log("[EmojiIndex] %d rows", this._emoji.length)
  }
  checkCache(phrase) {
    for (let i = 0; i < this.cache.length; ++i) {
      if (this.cache[i].key == phrase) {
        console.log("[EmojiIndex -> checkCache] hit cache");
        return this.cache[i].table;
      }
    }
    return null;
  }
  pushCache(phrase, m) {
    if (m.length == 0)
      return;
    for (let i = 0; i < this.cache.length; ++i) {
      if (this.cache[i].key == phrase) {
        return false;
      }
    }
    this.cache.push({ key: phrase, table: m });
  }
  get(phrase) {
    let p = phrase.split(" ").map(function (item) {
      return item.trim();
    });

    let cacheVal = this.checkCache(phrase);
    if (cacheVal != null)
      return cacheVal;

    var findOne = function (haystack, arr) {
      return arr.some(function (v) {
        if (v == "chinese") {
          console.log("break");
        }
        return haystack.indexOf(v) >= 0;
      });
    };
    let m = this._emoji.filter(function (item, index, array) {
      let found = findOne(item.keywords, p);
      if (found)
        console.log("Found matching:");
      return found;
    });
    this.pushCache(phrase, m);
    return m;
  }
  render() {
    return null;
  }
}
var emojiTable = new EmojiIndex();

class CEmoji extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onHover = this.onHover.bind(this);
  }
  onHover(e) {
    console.log("[CEmoji] onHover");
    this.props.handleOnHover(this);
  }
  onClick(e) {
    console.log("[CEmoji] click");
    this.props.handleOnClick(this);
  }
  render() {
    return <span
      style={{
        display: "inline-block"
      }}
      className="emoji"
      role="img"
      aria-label={this.props.label ? this.props.label : ""}
      aria-hidden={this.props.label ? "false" : "true"}
      onClick={this.onClick}
      onMouseEnter={this.onHover}
    //onMouseLeave={this.onHover}
    >
      {
        //String.fromCharCode(parseInt("0x" + this.props.symbol, 16))
        //String.Sprintf"\u" + this.props.symbol
      }
      {
        this.props.symbol
      }
    </span>
  }
}

class CEmojiHistory extends React.Component {
  constructor(props) {
    super(props);

  }
  render() {
    return null;
  }
}

class CViewGrid extends React.Component {
  constructor(props) {
    super(props);
    this.gridwidth = 14;
    this.gridheight = 200;
    this.renderContent = this.renderContent.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
    this.handleOnHover = this.handleOnHover.bind(this);
    this.tryCopySelection = this.tryCopySelection.bind(this);
    this.state = {
      dimensions: null,
      selected: "",
      Keyctrl: false,
      iconHistory: Array(),
    };
  }
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress, false);
    document.addEventListener("keyup", this.handleKeyUp, false);
    this.setState({
      dimensions: {
        width: this.container.offsetWidth,
        height: this.container.offsetHeight,
      },
    });
  }
  shouldComponentUpdate(nextProps, nextState) {
    return !(this.props.filterText == nextProps.filterText);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyPress, false);
    document.removeEventListener("keyup", this.handleKeyUp, false);
  }

  handleOnHover(c) {
    this.props.handleActiveIcon(c);
  }
  tryCopySelection() {
    this.props.handleSelection(this.state.selected);
    this.state.selected = "";
  }
  handleOnClick(c) {
    //append mode
    if (this.state.Keyctrl) {
      this.state.selected += c.props.symbol;
      this.state.iconHistory.push(c.props.symbol);
    } else {
      this.state.selected = c.props.symbol;
      this.tryCopySelection();

    }
  }
  handleKeyUp(e) {
    //if (!e.repeat)
    //  console.log("[handleKeyUp] event.key: ", e.key);
    if (!e.repeat && e.key == "Control") {
      this.state.Keyctrl = false;
      this.setState({ Keyctrl: false })
      if (this.state.selected.length > 0) {
        this.tryCopySelection();
      }
    }
  }
  handleKeyPress(e) {
    /*
      left = 37
      up = 38
      right = 39
      down = 40
   */
    //if (!e.repeat)
    //  console.log("[handleKeyPress] event.key: ", e.key);
    if (!e.repeat && e.key == "Control") {
      this.state.Keyctrl = true;
      this.setState({ Keyctrl: true })
    }
  }
  renderContent() {
    const { dimensions } = this.state;

    console.time('[CViewGrid] [performance]');
    let t = emojiTable.get(this.props.filterText);
    console.timeEnd('[CViewGrid] [performance]');

    return t.map((element, index) => {
      return <CEmoji
        key={index}
        tags={element.keywords}
        handleOnHover={this.handleOnHover}
        handleOnClick={this.handleOnClick}
        label={element.name}
        eid={element.no}
        symbol={element.char}
        x={50}
        y={50}
        width={30} height={30}
      />
    })
  }
  getXY(index) {
    return {
      x: index + this.gridheight * (index / this.gridwidth),
    }
  }
  getPos(x, y) {
    return x + y * this.gridwidth;
  }
  render() {
    console.log("[CViewGrid] rendering table\n");
    //let width = document.getElementById("grid").clientWidth;
    //this.gridwidth = width / 14;
    return (
      <div class="component-grid d-flex flex-column w-100">
        <small id="emailHelp" class="form-text text-muted mb-2">
          {this.state.Keyctrl ? "Group Select" : "Single"}
        </small>
        <div class="grid _flex-grow-1 y-overflow w-100" id="grid"
          onKeyPress={this.handleKeyPress}
          onKeyUp={this.handleKeyPress}
          ref={el => this.container = el}>
          {this.state.dimensions && this.renderContent()}
        </div>
      </div>
    )
  }
}

class CTimer {
  constructor() {
    this.ctx = null;
    this.fn = null;
    this.timer = null;
  }
  set(func, ctx) {
    //console.log("[CTimer] setting function timer\n");
    if (this.timer) {
      clearTimeout(this.timer);
      console.log("[CTimer] overrode timer\n");
    }
    this.fn = func;
    this.ctx = ctx;
    this.timer = setTimeout(function () {
      console.log("[CTimer] hit timer\n");
      this.fn(this.ctx);

      //reset
      this.fn = null;
      this.timer = null;
      this.ctx = null;
    }.bind(this), 1500);
  }
}

class CInput extends Component {
  constructor(props) {
    super(props);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.onTextFinished = this.onTextFinished.bind(this);
    this.timer = new CTimer()
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.state = {
      waiting: false,
    };
    //this.handleKeyPress;
  }
  //wait for text input to pause for a bit!
  setTextTimer() {

  }
  onTextFinished() {
    //if (this.props.onInputComplete) {
    this.setState({ waiting: false })
    this.props.handleInputComplete();
    //}
  }
  handleTextChange(e) {
    console.log("[CInput] update");
    this.setState({ waiting: true })
    this.timer.set(this.onTextFinished, this);
    this.props.handleTextChange(e.target.value);
  }
  handleKeyPress(e) {
    //this.props.handleKeyPress(e);
    if (e.key === 'Enter') {
      console.log('do validate');
      if (this.props.onEnter)
        this.props.onEnter(e.target.value);
    }
  }
  render() {
    return (
      <div class="input-group mb-0">
        <div class="input-group-prepend d-none">
          <span class="input-group-text" id="basic-addon1">$</span>
        </div>
        <input type="text"
          class={"form-control " + (this.state.waiting ? "waiting" : "")}
          id={this.props.id}
          aria-describedby="emailHelp"
          placeholder=":boop:"
          value={this.props.filterText}
          onKeyDown={this.handleKeyPress}
          onChange={this.handleTextChange} />
      </div>
    )
  }
}

class GifHandler {
  constructor(props) {
    this.getting = false;
    this.func = function () { };
    this.ctx = null;
  }
  isWaiting() {
    return this.getting;
  }
  get(name, fn, ctx) {
    if (this.isWaiting())
      return false;
    this.getting = true;
    this.fn = fn.bind(ctx);
    this.ctx = ctx;
    giphyApi.search({
      q: name,
      rating: 'g',
      //fmt: 'html'
    }, function (err, res) {
      //res;
      console.log("[GifHandler]", err, res);
      this.getting = false;
      this.fn(err, res);//.bind(this.ctx);
    }.bind(this));
    return true;
  }
}
var gifHandler = new GifHandler();

class CGif extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }
  onClick() {
    this.props.handleClick(this);
  }
  render() {
    return <img class="gif" src={this.props.src} onClick={this.onClick} />
  }
}

class GifView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      getState: 0,
    }
    this.handleSelection = this.handleSelection.bind(this);
  }
  handleSelection(e) {
    console.log("[GifView] selected image");
    this.props.handleSelection(e.props.id);
  }
  render() {
    if (!this.props.src) {
      return null;
    }
    //waiting
    return (
      this.props.src.data.map((value, index) => {
        console.log("[GifView] Index: %d", index, value.images.downsized.url);
        return <CGif
          src={value.images.downsized_medium.url}
          key={index}
          id={value.embed_url}
          handleClick={this.handleSelection} />
      })
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: '',
      inStockOnly: false,
      mode: 0,
      query: "",
    };
    this.handleFilterTextChange = this.handleFilterTextChange.bind(this);
    this.handleActiveIcon = this.handleActiveIcon.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.handleInputComplete = this.handleInputComplete.bind(this);
    this.handleSelection = this.handleSelection.bind(this);
    this.handleInputSearch = this.handleInputSearch.bind(this);
    //this.handleModeChange = this.handleModeChange.bind(this);
  }
  onKeyUp(e) {
    console.log("[App] on key up: ", e);
  }
  onKeyPress(e) {
    console.log("[App] on key press: ", e);
  }
  handleInputComplete() { }
  handleInputSearch(text) {
    if (this.state.mode == 2) {
      gifHandler.get(this.state.query, function (err, res, ctx) {
        this.setState({ gifset: res });
      }, this);
    }
  }
  handleSelection(text) {
    electron.clipboard.writeText(text)
    requestSendKeys(text)
    hideWindow();
  }
  handleActiveIcon(emoji) {
    this.setState({ activeEm: emoji })
  }
  handleFilterTextChange(filterText) {
    console.log("[handleFilterTextChange] update");
    this.setState({
      filterText: filterText,
      activeEm: {},
    });
    this.state.filterText = filterText;
    if (this.state.filterText.length > 0) {
      this.state.mode = 1
      if (this.state.filterText.startsWith("gif:", 0)) {
        this.state.query = this.state.filterText.split(":").pop();
        this.state.mode = 2;
      }
    } else {
      this.state.mode = 0;
    }
  }
  renderStatus() {
    const name = (this.state.activeEm && this.state.activeEm.props) ? this.state.activeEm.props.label : " ";
    const id = (this.state.activeEm && this.state.activeEm.props) ? this.state.activeEm.props.eid : " ";
    return <small id="emailHelp" class="form-text text-muted mb-2">{name} #{id}</small>
  }
  renderGif(pair) {
    return (
      <div class="component-grid d-flex flex-column w-100 y-overflow _mr-np _ml-np">
        <GifView src={this.state.gifset} handleSelection={this.handleSelection} />
      </div>
    )
  }
  renderCore() {
    switch (this.state.mode) {
      case 0:
        return (
          <div class="container m-auto">
            Nothing to display 😭
        </div>
        );
      case 1:
        return (
          <CViewGrid
            filterText={this.state.filterText}
            handleActiveIcon={this.handleActiveIcon}
            handleSelection={this.handleSelection}
          />
        )
      case 2:
        return this.renderGif()
    }
  }
  render() {
    return (
      <div class="app container d-flex flex-column"
        onKeyPress={this.onKeyPress}
        onKeyUp={this.onKeyUp}
        _className="App">
        <div class="form-group mt-2 mb-2">
          <CInput id="textInput1"
            filterText={this.state.filterText}
            handleTextChange={this.handleFilterTextChange}
            handleInputComplete={this.handleInputComplete}
            onEnter={this.handleInputSearch} />
        </div>
        <div class="bar animationTest d-none"> </div>
        <div class="d-flex flex-grow-1 flex-column mr-np _ml-np">
          {this.renderCore()}
        </div>
        <div class="container align-self-bottom py-2">
          {this.renderStatus()}
        </div>
      </div>
    );
  }
}

export default App;
