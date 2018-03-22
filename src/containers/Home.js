import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, ListGroup, ListGroupItem } from 'react-bootstrap';
import styled from 'styled-components';
import { invokeApig } from '../libs/awsLib';
import './Home.css';

const Container = styled.div`
  padding: 80px 0;
  text-align: center;
`;

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      notes: [],
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) return;

    try {
      const results = await invokeApig({ path: '/notes' });
      this.setState({ notes: results });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  handleNoteClick = event => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute('href'));
  };

  renderLander() {
    return (
      <Container>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </Container>
    );
  }

  renderNotes() {
    return (
      <div className="notes">
        <a href="/notes/new" onClick={this.handleNoteClick}>
          <b>{'\uFF0B'}</b> Create a new note
        </a>
        <ListGroup>
          {!this.state.isLoading &&
            this.state.notes.map(note => (
              <div key={note.noteId} href={`/notes/${note.noteId}`} onClick={this.handleNoteClick}>
                <div>
                  Name: {JSON.parse(note.content).blocks[0].text.trim()}, Created:{' '}
                  {new Date(note.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
        </ListGroup>
      </div>
    );
  }

  render() {
    return <div className="Home">{this.props.isAuthenticated ? this.renderNotes() : this.renderLander()}</div>;
  }
}
