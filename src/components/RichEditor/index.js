import React from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import './RichEditor.css';
import './Draft.css';

class RichEditor extends React.Component {
  static propTypes = {
    isReadOnly: PropTypes.bool.isRequired,
    initialState: PropTypes.object.isRequired,
    saveChange: PropTypes.func.isRequired,
  };

  state = { editorState: this.props.initialState };

  focus = () => this.editor.focus();

  handleKeyCommand = command => {
    const { editorState } = this.state;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.setState({ editorState: newState });
      return true;
    }
    return false;
  };

  onChange = editorState => {
    const content = editorState.getCurrentContent();
    this.props.saveChange(content);
    this.setState({ editorState });
  };

  onTab = e => {
    const maxDepth = 4;
    this.setState({ editorState: RichUtils.onTab(e, this.state.editorState, maxDepth) });
  };

  toggleBlockType = blockType => {
    this.setState({ editorState: RichUtils.toggleBlockType(this.state.editorState, blockType) });
  };

  toggleInlineStyle = inlineStyle => {
    this.setState({ editorState: RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle) });
  };

  render() {
    const { editorState } = this.state;
    const { isReadOnly } = this.props;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    if (!isReadOnly) className += ' RichEditor-topborder';
    const contentState = editorState.getCurrentContent();
    if (
      !contentState.hasText() &&
      contentState
        .getBlockMap()
        .first()
        .getType() !== 'unstyled'
    ) {
      className += ' RichEditor-hidePlaceholder';
    }

    let rootClass;
    if (!isReadOnly) rootClass = 'RichEditor-root';

    return (
      <div className={rootClass}>
        {!isReadOnly && (
          <div>
            <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
            <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
          </div>
        )}
        <div className={className} onClick={this.focus}>
          <Editor
            readOnly={this.props.isReadOnly}
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            onTab={this.onTab}
            placeholder="Tell a story..."
            ref={ref => (this.editor = ref)}
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = 'RichEditor-styleButton';
    if (this.props.active) {
      className += ' RichEditor-activeButton';
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = ({ editorState, onToggle }) => {
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = ({ editorState, onToggle }) => {
  const currentStyle = editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

export default RichEditor;
