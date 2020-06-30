import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setUrl } from '../../../../redux/Auth/user.actions';
import { acGetCustomerInfo, updateCustomer } from '../../../../redux/Customer/customer.action';
import ContainerHeader from '../../../../components/ContainerHeader';
import EditCustomerForm from './EditCustomerForm';
import { warningMsgBar, infoMsgBar } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';

class EditCustomerPage extends Component {
  state = {
    _id: '',
    balance: 0,
    username: '',
    email: '',
    avatar: '',
    bio: '',
    buttonDisable: true,
  };

  async componentDidMount() {
    if (this.props.match.params._id && this.state._id !== this.props.match.params._id) {
      this.setState({_id: this.props.match.params._id});
    }

    this.props.setUrl(this.props.match.path);
    const user = await this.props.acGetCustomerInfo(this.props.match.params._id);
    if (user)
      this.setState({
        balance: user.balance / 100.0,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      });
  }

  handleCancel = () => {
    this.setState({
      buttonDisable: true,
    });
    history.push(`/admin/customers/`);
  };

  onSaveForm = e => {
    e.preventDefault();
    console.log(this.state);
    this.props.updateCustomer({
      _id: this.state._id,
      balance: this.state.balance
    })
  };

  render() {
    return (
      <>
        <ContainerHeader title='Edit Customer Profile' />
        <EditCustomerForm
          handleCancel={this.handleCancel}
          handleChange={(e) => {
            this.setState({
              [e.target.name]: e.target.value
            });
          }}
          onSaveForm={this.onSaveForm}
          _id={this.state._id}
          balance={this.state.balance}
          username={this.state.username}
          email={this.state.email}
          bio={this.state.bio}
          avatar={this.state.avatar}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({
  _id: state.itemReducer._id,
  productName: state.itemReducer.productName,
  price: state.itemReducer.price,
  image: state.itemReducer.image,
  startDateTime: state.itemReducer.startDateTime,
  expireDateTime: state.itemReducer.expireDateTime
});

const mapDispatchToProps = {
  setUrl,
  warningMsgBar,
  infoMsgBar,
  acGetCustomerInfo,
  updateCustomer
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditCustomerPage);
