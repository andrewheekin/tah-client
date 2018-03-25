import React, { Component } from 'react';
import { API, Storage } from 'aws-amplify';
import styled from 'styled-components';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import debounce from 'lodash.debounce';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import LoaderButton from '../components/LoaderButton';
import RichEditor from '../components/RichEditor';
import { s3Upload } from '../libs/awsLib';
import config from '../config';

const Input = styled.input`
  border: 1px solid grey;
  border-radius: 5px;
`;

export default class Notes extends Component {
  state = {
    isLoading: null,
    isDeleting: null,
    note: null,
    initialState: EditorState.createEmpty(),
    tag: 'New Note',
    attachmentURL: null,
    editing: false,
    file: null,
  };

  async componentDidMount() {
    try {
      let attachmentURL;
      const note = await API.get('notes', `/notes/${this.props.match.params.id}`);
      const { content, tag, attachment } = note;
      const initialState = content
        ? EditorState.createWithContent(convertFromRaw(JSON.parse(content)))
        : EditorState.createEmpty();

      if (attachment) attachmentURL = await Storage.vault.get(attachment);
      this.setState({ note, tag, initialState, attachmentURL });
    } catch (e) {
      alert(e);
    }
  }

  formatFilename(str) {
    return str.length < 50 ? str : str.substr(0, 20) + '...' + str.substr(str.length - 20, str.length);
  }

  saveChange = debounce(async editorState => {
    // only stringify and convert to raw when saving to dynamo
    const content = JSON.stringify(convertToRaw(editorState));

    let attachment;

    if (this.state.file && this.state.file.size > config.MAX_ATTACHMENT_SIZE)
      return alert('Please pick a file smaller than 5MB');

    this.setState({ isLoading: true });

    try {
      if (this.state.file) attachment = await s3Upload(this.state.file);

      await API.put('notes', `/notes/${this.props.match.params.id}`, {
        body: {
          ...this.state.note,
          content,
          tag: this.state.tag,
          attachment: attachment || this.state.note.attachment,
        },
      });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }, 1000);

  handleTagChange = event => {
    this.setState({ tag: event.target.value });
  };

  handleFileChange = event => {
    this.setState({ file: event.target.files[0] });
  };

  handleClickEdit = () => {
    this.setState({ editing: !this.state.editing });
  };

  handleDelete = async event => {
    event.preventDefault();

    const confirmed = window.confirm('Are you sure you want to delete this note?');

    if (!confirmed) return;
    this.setState({ isDeleting: true });

    try {
      await API.del('notes', `/notes/${this.props.match.params.id}`);
      this.props.history.push('/');
    } catch (e) {
      alert(e);
      this.setState({ isDeleting: false });
    }
  };

  render() {
    const { editing, initialState } = this.state;
    return (
      <div style={{ paddingBottom: '15px' }}>
        {this.state.note && (
          <form>
            <Input type="text" value={this.state.tag} onChange={this.handleTagChange} />
            <FormGroup controlId="content">
              <RichEditor isReadOnly={!editing} saveChange={this.saveChange} initialState={initialState} />
            </FormGroup>
            {this.state.note.attachment && (
              <FormGroup>
                <ControlLabel>Attachment</ControlLabel>
                <FormControl.Static>
                  <a target="_blank" rel="noopener noreferrer" href={this.state.note.attachment}>
                    {this.formatFilename(this.state.note.attachment)}
                  </a>
                </FormControl.Static>
              </FormGroup>
            )}
            <FormGroup controlId="file">
              {!this.state.note.attachment && <ControlLabel>Attachment</ControlLabel>}
              <FormControl onChange={this.handleFileChange} type="file" />
            </FormGroup>
            <LoaderButton
              block
              bsStyle="primary"
              bsSize="large"
              isLoading={this.state.isLoading}
              onClick={this.handleClickEdit}
              text={editing ? 'Finish' : 'Edit'}
              loadingText="Saving…"
            />
            <LoaderButton
              block
              bsStyle="danger"
              bsSize="large"
              isLoading={this.state.isDeleting}
              onClick={this.handleDelete}
              text="Delete"
              loadingText="Deleting…"
            />
          </form>
        )}
      </div>
    );
  }
}
