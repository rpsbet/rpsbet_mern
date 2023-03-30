import { createGlobalStyle } from 'styled-components';
import { styleColor } from './styleThem';

const GlobalStyle = createGlobalStyle`
*,
*::after,
*::before {
    margin: 0;
    padding: 0;
    box-sizing: inherit;
}
body {
    box-sizing: border-box;
    font-family: "Lato", sans-serif;
    font-weight: 400;
    line-height: 1.7;
    color: ${styleColor.color.greyDark};
}
::selection {
    background-color: ${styleColor.primary.main};
    color: ${styleColor.color.white};
}
/* width */
::-webkit-scrollBar {
    width: 10px;
}
  
/* Track */
::-webkit-scrollBar-track {
    box-shadow: none; 
    background: transparent
}
/* Handle */
::-webkit-scrollBar-thumb {
    background-image:  linear-gradient(
        to right bottom,
       #e5e5e5,
       #e5e5e5 
    );
    border-radius: 3px;
    transition: all .2s ease-out;
}
  
/* Handle on hover */
::-webkit-scrollBar-thumb:hover {
    background:${styleColor.primary.main}; 
}
`;

export default GlobalStyle;
