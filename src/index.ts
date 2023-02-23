declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

interface VnodeElem {
  tag: string;
}

function elem( selector: string ): VnodeElem {
  return {
    tag: selector
  }
}

export default {
  elem
};