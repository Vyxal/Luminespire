export interface Line {
  code: boolean[][];
  input: string;
  id: number;
  ignoreCode: boolean;
  noComment: boolean;
}

export function newLine() {
  return {
    code: [],
    input: '',
    id: Math.round(Math.random() * 1000) + new Date().getTime(),
    ignoreCode: false,
    noComment: false,
  };
}
