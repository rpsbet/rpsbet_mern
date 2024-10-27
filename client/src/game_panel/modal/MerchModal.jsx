import React, { Component } from 'react';
import Modal from 'react-modal';
import { Button } from '@material-ui/core';

Modal.setAppElement('#root');

const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        background: 'transparent',
        padding: 0,
        border: 'none',
    }
}

class MerchModal extends Component {
    constructor(props) {
        super(props);
        this.productComponentId1 = 'product-component-1730054915298'; // ID for the first product component
        this.productComponentId2 = 'product-component-1730055121143'; // ID for the second product component
    }

    componentDidMount() {
        if (this.props.modalIsOpen) {
            this.loadShopifyScript();
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.modalIsOpen && !prevProps.modalIsOpen) {
            this.loadShopifyScript(); // Load script again if the modal opens
        }
    }

    loadShopifyScript = () => {
        const scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
        
        // Load the script and initialize components
        if (window.ShopifyBuy) {
            if (window.ShopifyBuy.UI) {
                this.initializeShopifyUI();
            } else {
                this.injectScript(scriptURL);
            }
        } else {
            this.injectScript(scriptURL);
        }
    }

    injectScript = (scriptURL) => {
        const script = document.createElement('script');
        script.async = true;
        script.src = scriptURL;
        script.onload = this.initializeShopifyUI;
        document.head.appendChild(script);
    }

    initializeShopifyUI = () => {
        const client = ShopifyBuy.buildClient({
            domain: 'jgjzbk-i0.myshopify.com',
            storefrontAccessToken: '105dc54e13d53c95a919c160ec36e20d',
        });

        ShopifyBuy.UI.onReady(client).then((ui) => {
        

            // Create the first product component
            ui.createComponent('product', {
                id: '9819962507598',
                node: document.getElementById(this.productComponentId1),
                moneyFormat: '%C2%A3%7B%7Bamount%7D%7D',
                options: {
                    product: {
                        styles: {
                            product: {
                                '@media (min-width: 601px)': {
                                    'max-width': 'calc(25% - 20px)',
                                    'margin-left': '20px',
                                    'margin-bottom': '50px',
                                },
                            },
                        },
                        buttonDestination: 'checkout',
                        text: {
                            button: 'Buy Now',
                        },
                    },
                    modalProduct: {
                        contents: {
                            img: false,
                            imgWithCarousel: true,
                            button: false,
                            buttonWithQuantity: true,
                        },
                        styles: {
                            product: {
                                '@media (min-width: 601px)': {
                                    'max-width': '100%',
                                    'margin-left': '0px',
                                    'margin-bottom': '0px',
                                },
                            },
                        },
                        buttonDestination: 'checkout',

                        text: {
                            button: 'Buy Now',
                        },
                    },
                    cart: {
                        text: {
                            total: 'Subtotal',
                            button: 'Checkout',
                        },
                    },
                },
            });

            // Create the second product component
            ui.createComponent('product', {
                id: '9819962147150',
                node: document.getElementById(this.productComponentId2),
                moneyFormat: '%C2%A3%7B%7Bamount%7D%7D',
                options: {
                    product: {
                        styles: {
                            product: {
                                '@media (min-width: 601px)': {
                                    'max-width': 'calc(25% - 20px)',
                                    'margin-left': '20px',
                                    'margin-bottom': '50px',
                                },
                            },
                        },
                        buttonDestination: 'checkout',

                        text: {
                            button: 'Buy Now',
                        },
                    },
                    modalProduct: {
                        contents: {
                            img: false,
                            imgWithCarousel: true,
                            button: false,
                            buttonWithQuantity: true,
                        },
                        styles: {
                            product: {
                                '@media (min-width: 601px)': {
                                    'max-width': '100%',
                                    'margin-left': '0px',
                                    'margin-bottom': '0px',
                                },
                            },
                        },
                        buttonDestination: 'checkout',

                        text: {
                            button: 'Buy Now',
                        },
                    },
                    cart: {
                        text: {
                            total: 'Subtotal',
                            button: 'Checkout',
                        },
                    },
                },
            });
        });
    }

    render() {
        return (
            <Modal
                isOpen={this.props.modalIsOpen}
                onRequestClose={this.props.closeModal}
                style={customStyles}
                contentLabel="Merch Modal"
            >
                <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                    <div className='modal-header'>
                        <h2 className="modal-title title">
                            <span style={{ color: "#d81719" }}>RPS</span>.<span style={{ color: "#ebddca" }}>Game</span> Merch
                        </h2>
                        <Button className="btn-close title" onClick={this.props.closeModal}>×</Button>
                    </div>
                    <div className="modal-body edit-modal-body merch-modal-body"  style={{background:"#fff"}}>
                        {/* Container for the first product component */}
                        <div id={this.productComponentId1}></div>
                        {/* Container for the second product component */}
                        <div id={this.productComponentId2}></div>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default MerchModal;