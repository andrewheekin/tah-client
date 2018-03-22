import React, { Component } from 'react';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import debounce from 'lodash.debounce';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import LoaderButton from '../components/LoaderButton';
import RichEditor from '../components/RichEditor';
import { invokeApig, s3Upload } from '../libs/awsLib';
import config from '../config';
import './Notes.css';

export default class Notes extends Component {
  constructor(props) {
    super(props);

    this.file = null;

    this.state = {
      isLoading: null,
      isDeleting: null,
      note: null,
      content: EditorState.createEmpty(),
      editing: false,
    };
  }

  async componentDidMount() {
    try {
      const note = await this.getNote();
      let { content } = note;
      content = content
        ? EditorState.createWithContent(convertFromRaw(JSON.parse(content)))
        : EditorState.createEmpty();
      this.setState({ note, content });
    } catch (e) {
      alert(e);
    }
  }

  getNote() {
    return invokeApig({ path: `/notes/${this.props.match.params.id}` });
  }

  deleteNote() {
    return invokeApig({
      path: `/notes/${this.props.match.params.id}`,
      method: 'DELETE',
    });
  }

  saveNote(note) {
    return invokeApig({
      path: `/notes/${this.props.match.params.id}`,
      method: 'PUT',
      body: note,
    });
  }

  formatFilename(str) {
    return str.length < 50 ? str : str.substr(0, 20) + '...' + str.substr(str.length - 20, str.length);
  }

  saveChange = debounce(async content => {
    content = JSON.stringify(convertToRaw(content));

    let uploadedFilename;

    if (this.file && this.file.size > config.MAX_ATTACHMENT_SIZE) return alert('Please pick a file smaller than 5MB');

    this.setState({ isLoading: true });

    try {
      if (this.file) {
        uploadedFilename = (await s3Upload(this.file)).Location;
      }

      await this.saveNote({
        ...this.state.note,
        content,
        attachment: uploadedFilename || this.state.note.attachment,
      });
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }, 1000);

  handleFileChange = event => {
    this.file = event.target.files[0];
  };

  handleClickEdit = () => {
    this.setState({ editing: !this.state.editing });
  };

  handleDelete = async event => {
    event.preventDefault();

    const confirmed = window.confirm('Are you sure you want to delete this note?');

    if (!confirmed) {
      return;
    }

    this.setState({ isDeleting: true });

    try {
      await this.deleteNote();
      this.props.history.push('/');
    } catch (e) {
      alert(e);
      this.setState({ isDeleting: false });
    }
  };

  render() {
    const { editing, content } = this.state;
    return (
      <div className="Notes">
        {this.state.note && (
          <form>
            <FormGroup controlId="content">
              <RichEditor isReadOnly={!editing} saveChange={this.saveChange} content={content} />
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
