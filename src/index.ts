declare global {
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