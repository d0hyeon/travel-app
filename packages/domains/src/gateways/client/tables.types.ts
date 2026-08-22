import type { Database, Json } from "./_database.types";

export type { Json };

type TableNames = keyof Database['public']['Tables']

type TableType<TableName extends TableNames> = Database['public']['Tables'][TableName];

export type DataRaw<TableName extends TableNames> = TableType<TableName>['Row'];
export type CreateDataType<TableName extends TableNames> = TableType<TableName>['Insert'];
export type UpdateDataType<TableName extends TableNames> = TableType<TableName>['Update'];
