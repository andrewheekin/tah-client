import React from 'react';
import { Route, Switch, Link, withRouter } from 'react-router-dom';
import { authUser, signOutUser } from './libs/awsLib';
import AppliedRoute from './components/AppliedRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import UnauthenticatedRoute from './components/UnauthenticatedRoute';
import Home from './containers/Home';
import Login from './containers/Login';
import Notes from './containers/Notes';
import Signup from './containers/Signup';
import NewNote from './containers/NewNote';
import NotFound from './containers/NotFound';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isAuthenticating: true,
    };
  }

  async componentDidMount() {
    try {
      if (await authUser()) {
        this.userHasAuthenticated(true);
      }
    } catch (e) {
      alert(e);
    }

    this.setState({ isAuthenticating: false });
  }

  userHasAuthenticated = authenticated => {
    this.setState({ isAuthenticated: authenticated });
  };

  handleLogout = event => {
    signOutUser();

    this.userHasAuthenticated(false);

    this.props.history.push('/login');
  };

  render() {
    const authStatus = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
    };

    return (
      !this.state.isAuthenticating && (
        <div className="App container">
          <Link to="/">Scratch</Link>
          {this.state.isAuthenticated ? (
            <div onClick={this.handleLogout}>Logout</div>
          ) : (
            <div>
              <Link to="/signup">Signup</Link>
              <Link to="/login">Login</Link>
            </div>
          )}
          <Switch>
            <AppliedRoute path="/" exact component={Home} props={authStatus} />
            <UnauthenticatedRoute path="/login" exact component={Login} props={authStatus} />
            <UnauthenticatedRoute path="/signup" exact component={Signup} props={authStatus} />
            <AuthenticatedRoute path="/notes/new" exact component={NewNote} props={authStatus} />
            <AuthenticatedRoute path="/notes/:id" exact component={Notes} props={authStatus} />
            {/* Finally, catch all unmatched routes */}
            <Route component={NotFound} />
          </Switch>
        </div>
      )
    );
  }
}

export default withRouter(App);
