import type { Database } from "./database.types";

type TableNames = keyof Database['public']['Tables']

type TableType<TableName extends TableNames> = Database['public']['Tables'][TableName];

export type DataRaw<TableName extends TableNames> = TableType<TableName>['Row'];
export type CreateDataType<TableName extends TableNames> = TableType<TableName>['Insert'];
export type UpdateDataType<TableName extends TableNames> = TableType<TableName>['Update'];