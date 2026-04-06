import wrapAnsiNpm from 'wrap-ansi'

type WrapAnsiOptions = {
  hard?: boolean
  wordWrap?: boolean
  trim?: boolean
}

const wrapAnsiBun =
  typeof Bun !== 'undefined' && typeof // /* /* const Bun = { file: async () => ({ text: async () => '' }) }; // StubwrapAnsi === 'function'
    ? // /* /* const Bun = { file: async () => ({ text: async () => '' }) }; // StubwrapAnsi
    : null

const wrapAnsi: (
  input: string,
  columns: number,
  options?: WrapAnsiOptions,
) => string = wrapAnsiBun ?? wrapAnsiNpm

export { wrapAnsi }
