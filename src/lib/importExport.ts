import { newLine, type Line } from './Line';

const invisCharToMetaLookup = {
  '-': String.fromCharCode(0x00ad),
  '|': String.fromCharCode(0x200b),
  '/': String.fromCharCode(0x200c),
  '[': String.fromCharCode(0x200e),
  ']': String.fromCharCode(0x200f),
  '"': String.fromCharCode(0x206a),
  ',': String.fromCharCode(0x2060),
  '0': String.fromCharCode(0x2061),
  '1': String.fromCharCode(0x2062),
  '2': String.fromCharCode(0x2063),
  '3': String.fromCharCode(0x2064),
};

interface ImportRes {
  prog: string;
  lines: Line[];
  selectedLine: number;
}

function decode(str) {
  if (str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
  } else {
    return [];
  }
}

export function importFromVPA(importValue: string) {
  const [flags, header, code, footer, inputs] = decode(new URL(importValue).hash.slice(1));
  return code;
}

function convertControlToMetadata(text: String) {
  function swapKeysAndValues(obj: Record<string, any>): Record<string, any> {
    const swappedObj: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        swappedObj[value] = key;
      }
    }

    return swappedObj;
  }
  const invertedLookup = swapKeysAndValues(invisCharToMetaLookup);
  let data = '';
  for (let char of text) {
    data += invertedLookup[char] || char;
  }

  return data;
}

function parseMetadata(data: string, prog: string): ImportRes {
  // -<line number>|[<code>]|<flags>/...-

  let selectedLine: number;
  let lines = [];

  data
    .slice(1, data.length - 1)
    .split('/')
    .filter(x => x)
    .forEach(subdata => {
      const components = subdata.split('|');
      const lineNumber = parseInt(components[0], 4);
      const [ignoreCode, noComment] = components[components.length - 1]
        .split(',')
        .map(x => x === '1');

      const positions = ignoreCode
        ? []
        : JSON.parse(components[1])
            .filter(x => x)
            .map(x => x.map(y => parseInt(y, 4)));

      while (lines.length <= lineNumber) {
        lines.push(newLine());
      }

      const thisLine = lines[lineNumber];
      selectedLine = lineNumber;
      thisLine.ignoreCode = ignoreCode;
      thisLine.noComment = noComment;
      thisLine.code = [];
      let input = prog.matchAll(
        new RegExp(
          `${metadataToControl('[' + lineNumber.toString(4))}([^${metadataToControl(
            '01234',
          )}].*)\n?`,
          'g',
        ),
      );

      if (input !== null) {
        thisLine.input = [...input].map(x => x[1]).join('\n');
      }
      if (positions.length) {
        for (let pos of positions) {
          if (!thisLine.code[pos[0]]) {
            thisLine.code[pos[0]] = [];
          }
          thisLine.code[pos[0]][pos[1]] = true;
        }
      }
    });

  return { prog, lines, selectedLine };
}

function importFromMetadata(text: string): ImportRes | null {
  const metadata = text.match(
    new RegExp(`${invisCharToMetaLookup['-']}.*${invisCharToMetaLookup['-']}`),
  );
  if (metadata) {
    return parseMetadata(convertControlToMetadata(metadata[0]), text);
  }
  return null;
}

export function importFromText(importValue: string, commentChar: string): ImportRes {
  const fromMetadata = importFromMetadata(importValue);
  if (fromMetadata) {
    return fromMetadata;
  }

  let explanationLines = importValue.split('\n');
  let text: string;
  if (explanationLines.includes('')) {
    // Collect until first empty line
    text = explanationLines.slice(0, explanationLines.indexOf('')).join('\n');

    explanationLines = explanationLines.slice(explanationLines.indexOf('') + 1);
  } else {
    text = explanationLines[0];
    explanationLines = explanationLines.slice(1);
  }

  if (text.includes(invisCharToMetaLookup['-'])) {
    text = text.slice(0, text.indexOf(invisCharToMetaLookup['-']));
  }

  const textLines = text.split('\n');

  let maxLen = Math.max(...textLines.map(x => x.length));

  const range = n => Array.from({ length: n }, (value, key) => key);
  let groups: Array<Array<String>> = [];
  let group = [];
  for (let line of explanationLines) {
    group.push(line);
    if (line.length > maxLen) {
      groups.push(group);
      group = [];
    }
  }

  if (group.length) {
    groups.push(group);
  }

  let selectedLine: number;
  const lines = [];

  for (let group of groups) {
    const comment = group[group.length - 1].slice(maxLen + commentChar.length + 3);
    const codeBlock = group.slice(0, group.length - 1);
    codeBlock.push(group[group.length - 1].slice(0, maxLen));

    lines.push(newLine());
    selectedLine = lines[lines.length - 1].id;
    // if all lines are blank, skip, marking the lines as "no padding"

    if (group[0].startsWith(commentChar) && !textLines.some(x => x.startsWith(commentChar))) {
      lines[lines.length - 1].ignoreCode = true;
      lines[lines.length - 1].input = group.join('\n').slice(commentChar.length + 1);
      continue;
    }

    lines[lines.length - 1].input = comment;

    for (let line of codeBlock) {
      let row = 0;
      for (let newline of textLines) {
        if (!range(line.length).every(x => textLines[row][x] === line[x] || line[x] === ' ')) {
          row++;
        } else {
          let col = 0;
          for (let char of line) {
            if (textLines[row][col] === char && char !== ' ') {
              if (!lines[lines.length - 1].code[row]) {
                lines[lines.length - 1].code[row] = [];
              }
              lines[lines.length - 1].code[row][col] = true;
            }
            col++;
          }
        }
      }
    }
  }

  return { prog: text, selectedLine, lines };
}

export function metadataToControl(text: String) {
  let data = '';
  for (let char of text) {
    data += invisCharToMetaLookup[char] || char;
  }

  return data;
}

export function exportToMetadata(lines: Line[]) {
  let data = '-';
  lines.map((line, idx) => {
    if (line.code.length || line.ignoreCode) {
      data += `${idx.toString(4)}|${JSON.stringify(
        line.code
          .map((row, rowIdx) =>
            row.map((col, colIdx) => (col == true ? [rowIdx.toString(4), colIdx.toString(4)] : '')),
          )
          .flat(),
      )}|${line.ignoreCode ? '1' : '0'},${line.noComment ? '1' : '0'}/`;
    }
  });
  data += '-';
  return metadataToControl(data);
}
