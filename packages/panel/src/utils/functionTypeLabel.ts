import { UdfType } from '../types';

export const functionTypeLabel = (udfType: UdfType) => {
  let text = "";
  switch (udfType) {
    case "query":
      text = "Query";
      break;
    case "mutation":
      text = "Mutation";
      break;
    case "action":
      text = "Action";
      break;
    case "httpaction":
      text = "HTTP";
      break;
    default:
      text = "Function";
  }
  return text;
}; 