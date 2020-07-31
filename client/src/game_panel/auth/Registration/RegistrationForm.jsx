import React, { Component } from 'react';
import { connect } from 'react-redux';
import { userSignUp } from '../../../redux/Auth/user.actions';
import AvatarUpload from './upload/AvatarUpload';
import { BsCaretDown } from 'react-icons/bs';

class RegistrationForm extends Component {
  state = {
    userName: '',
    password: '',
    email: '',
    bio: '',
    avatar: '',
    disable: true
  };

  handleSubmit = event => {
    event.preventDefault();
    this.props.userSignUp(this.state);
  };

  handleInputChange = event => {
    this.setState({ [event.target.name]: event.target.value }, () =>
      this.handleDisableButton()
    );
  };

  handleDisableButton = () => {
    const { userName, password, email } = this.state;
    if (userName.length >= 2) {
      if (password.length >= 3) {
        if (email.length >= 4) {
          this.setState({ disable: false });
        } else {
          this.setState({ disable: true });
        }
      } else {
        this.setState({ disable: true });
      }
    } else {
      this.setState({ disable: true });
    }
  };

  render() {
    const { userName, password, disable, email } = this.state;
    return (
      <div className="login_form">
        <div className="row">
          <img className="logo" src="/img/logo.png" alt="RPS Bet Logo"/>
        </div>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <AvatarUpload setImageFilename={(filename) => {
              this.setState({avatar: filename});
            }} />
          </div>
          <div className="form-group">
            <label>Pick a Username</label>
            <input maxLength="15" type="text" className="form-control" placeholder="Username" name="userName" value={userName} onChange={this.handleInputChange} />
          </div>
          <div className="form-group">
            <label>Real Email</label>
            <input type="email" className="form-control" placeholder="Email Address" name="email" value={email} onChange={this.handleInputChange} />
          </div>
          <div className="form-group">
            <label>Secure Password</label>
            <input type="password" className="form-control" placeholder="password" name="password" value={password} onChange={this.handleInputChange} />
          </div>
          {/*
          <div className="form-group">
            <label>Your Biography (92 char)</label>
            <input type="text" className="form-control" placeholder="Bio" name="bio" value={bio} onChange={this.handleInputChange} />
          </div> */}
          <div className="form-group">
            <button className={"btn btn-info btn-block " + disable}>Register</button>
            <a href="/signin" className="btn btn-block" id="btn_signup">Login</a>
          </div>
          <div className="disclaimer">
          <p>You must be <span>18+</span> years to register. By registering, you agree to our site's explicit and coherent Policies and Terms <BsCaretDown /></p>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  userSignUp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RegistrationForm);

