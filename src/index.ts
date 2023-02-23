declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;
function elem( selector: string ) {
interface VnodeElem {
  tag: string;
}

  return {
    tag: selector
  }
}

export default {
  elem
};