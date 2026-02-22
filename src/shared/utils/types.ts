export type OmitPartial<T, Key extends keyof T> = Partial<Omit<T, Key>> & Pick<T, Key>;

export type PickPartial<T, Key extends keyof T> = Partial<Pick<T, Key>> & Omit<T, Key>;

export type ValueOf<T> = T[keyof T];