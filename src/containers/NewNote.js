import React, { Component } from 'react';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import debounce from 'lodash.debounce';
import { EditorState, convertToRaw } from 'draft-js';
import RichEditor from '../components/RichEditor';
import LoaderButton from '../components/LoaderButton';
import { invokeApig, s3Upload } from '../libs/awsLib';
import config from '../config';
import './NewNote.css';

export default class NewNote extends Component {
  state = {
    isLoading: null,
    isCreating: false,
    content: EditorState.createEmpty(),
    editing: false,
    file: null,
  };

  handleClickEdit = () => {
    this.setState({ editing: !this.state.editing });
  };

  handleFileChange = event => {
    this.setState({ file: event.target.files[0] });
  };

  saveChange = debounce(async content => {
    this.setState({ content });
  }, 1000);

  handleSubmit = async event => {
    this.setState({ isCreating: true });
    event.preventDefault();
    const content = JSON.stringify(convertToRaw(this.state.content));

    if (this.state.file && this.state.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert('Please pick a file smaller than 5MB');
      return;
    }

    this.setState({ isLoading: true });

    try {
      const uploadedFilename = this.state.file ? (await s3Upload(this.state.file)).Location : null;

      await this.createNote({
        content,
        attachment: uploadedFilename,
      });
      this.props.history.push('/');
    } catch (e) {
      alert(e);
    } finally {
      this.setState({ isLoading: false });
      this.setState({ isCreating: false });
    }
  };

  createNote(note) {
    return invokeApig({
      path: '/notes',
      method: 'POST',
      body: note,
    });
  }

  render() {
    const { editing, content } = this.state;
    console.log('cont in nn', content);
    return (
      <div className="NewNote">
        <form>
          <FormGroup controlId="content">
            <RichEditor isReadOnly={!editing} saveChange={this.saveChange} content={content} />
          </FormGroup>
          <FormGroup controlId="file">
            <ControlLabel>Attachment</ControlLabel>
            <FormControl onChange={this.handleFileChange} type="file" />
          </FormGroup>
          <LoaderButton
            block
            bsStyle="primary"
            bsSize="large"
            isLoading={this.state.isLoading}
            onClick={this.handleClickEdit}
            text={editing ? 'Save' : 'Edit'}
            loadingText="Saving…"
          />
          <LoaderButton
            block
            bsStyle="primary"
            bsSize="large"
            isLoading={this.state.isCreating}
            onClick={this.handleSubmit}
            text={'Create!'}
            loadingText="Creating..."
          />
        </form>
      </div>
    );
  }
}
