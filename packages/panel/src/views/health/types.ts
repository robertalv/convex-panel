export type TimeSeriesData = Array<[{
  secs_since_epoch: number;
  nanos_since_epoch: number;
}, number | null]>;

export type APIResponse = Array<[string, TimeSeriesData]>;

export type ChartData = {
  timestamps: number[];
  functionData: Map<string, Map<number, number | null>>;
};

export type TimeRange = {
  start: string;
  end: string;
};

