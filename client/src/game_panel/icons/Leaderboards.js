
import React from 'react';

const Leaderboards = () => {
  return (
<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
	<title>Leaderboards</title>
	<defs>
		<image width="86" height="86" id="img2" href="data:image/png;base64,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"/>
	</defs>
	<style>
	</style>
	<g id="Layer">
		<use id="icons8-rank" href="#img2" transform="matrix(1,0,0,1,5,5)"/>
	</g>
</svg>      );
};

export default Leaderboards;

