export type CustomQuery = {
    type: 'customQuery';
    table: string | null;
    componentId?: string | null;
};