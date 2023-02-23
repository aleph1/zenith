declare global {
  // used to specify debug or production build
  var DEBUG: boolean;
}
const DEBUG = window.DEBUG;

interface VnodeElem {
  tag: string;
  children: array;
}

function elem(selector: string): VnodeElem {
  const children = [];
  return {
    tag: selector
    children
  }
}

export default {
  elem
};