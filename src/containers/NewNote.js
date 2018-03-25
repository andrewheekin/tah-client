import React, { Component } from 'react';
import { API } from 'aws-amplify';
import styled from 'styled-components';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import debounce from 'lodash.debounce';
import { EditorState, convertToRaw } from 'draft-js';
import RichEditor from '../components/RichEditor';
import LoaderButton from '../components/LoaderButton';
import { s3Upload } from '../libs/awsLib';
import config from '../config';
import './NewNote.css';

const Input = styled.input`
  border: 1px solid grey;
  border-radius: 5px;
`;

export default class NewNote extends Component {
  state = {
    isLoading: null,
    isCreating: false,
    initialState: EditorState.createEmpty(),
    tag: 'New Note',
    editing: false,
    file: null,
  };

  handleClickEdit = () => {
    this.setState({ editing: !this.state.editing });
  };

  handleFileChange = event => {
    this.setState({ file: event.target.files[0] });
  };

  saveChange = debounce(async initialState => {
    this.setState({ initialState });
  }, 1000);

  handleTagChange = event => {
    this.setState({ tag: event.target.value });
  };

  handleSubmit = async event => {
    this.setState({ isCreating: true });
    event.preventDefault();
    const content = JSON.stringify(convertToRaw(this.state.initialState));

    if (this.state.file && this.state.file.size > config.MAX_ATTACHMENT_SIZE) {
      alert('Please pick a file smaller than 5MB');
      return;
    }

    this.setState({ isLoading: true });

    try {
      const attachment = this.state.file ? await s3Upload(this.state.file) : null;
      await API.post('notes', '/notes', { body: { content, tag: this.state.tag, attachment } });
      this.props.history.push('/');
    } catch (e) {
      alert(e);
    } finally {
      this.setState({ isLoading: false });
      this.setState({ isCreating: false });
    }
  };

  render() {
    const { editing, initialState } = this.state;
    return (
      <div className="NewNote">
        <form>
          <Input type="text" value={this.state.tag} onChange={this.handleTagChange} />
          <FormGroup controlId="content">
            <RichEditor isReadOnly={!editing} saveChange={this.saveChange} initialState={initialState} />
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
