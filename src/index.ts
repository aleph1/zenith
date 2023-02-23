declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;


export default {
	test: () => {
		if( DEBUG ) {
			console.log( 'DEBUG' );
		}
		return true;
	}
};