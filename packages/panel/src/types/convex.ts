export type UdfType = 'query' | 'mutation' | 'action' | 'httpAction';

export type ExecutableUdfType = 'query' | 'mutation' | 'action';

export type UdfVisibility = {
  kind: 'public' | 'internal';
};

export type Udf = {
  name: string;
  identifier: string;
  udfType: UdfType;
  visibility: UdfVisibility;
};