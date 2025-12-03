export type HighlightLines = {
    startLineNumber: number;
    endLineNumber: number;
  };
  
  // The editor will have a height of 100% and will scroll.
  export type ParentHeight = {
    type: 'parent';
  };
  
  // The editor will always have its height set to the height of the content.
  // You can consider setting this to `false` if you are experiencing issues with
  // the editor growing infinitely in height in your layout.
  export type ContentHeight = {
    type: 'content';
    // The editor's height will not exceed this value if it's defined. If the
    // content's length is greater than this height, then the editor's height will
    // be capped at this value and will scroll. If the content's height is less
    // than this value, then the editor will shrink to match the content height.
    maxHeightRem?: number;
  };
  
  export const maxHeightPixels = (heightObj: ContentHeight): number => {
    const { maxHeightRem } = heightObj;
    if (!maxHeightRem) {
      return Number.MAX_SAFE_INTEGER;
    }
    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize || '16',
    );
    return Math.round(maxHeightRem * fontSize);
  };
  
  