const $ = x => document.querySelector(x);
const $$ = x => document.querySelectorAll(x);

// hashmap of all lines and indexes of characters in the program

const lines = new Map();
let selectedLine = -1;
let lineCount = 1;

function refreshTable() {
  const tr = document.createElement('tr');
  $("#cells").innerHTML = "";
  $("#cells").appendChild(tr);

  const program = $("#program").value.split("");

  program.forEach((char, index) => {
    const td = document.createElement('td');
    td.addEventListener('click', () => {
      if (selectedLine === -1) {
        return;
      }
      const line = lines.get(`line${selectedLine}`);
      const table = $("#cells");
      const row = table.rows[0];

      if (line.includes(index)) {
        line.splice(line.indexOf(index), 1);

        // Also highlight the character in the program

        row.cells[index].style.backgroundColor = "white";
      } else {
        line.push(index);
        line.sort((a, b) => a - b);

        // Also dehighlight the character in the program
        row.cells[index].style.backgroundColor = "yellow";
      }
      lines.set(`line${selectedLine}`, line);

      const element = $(`#line${selectedLine}`);
      const code = line
        .map((index) => $("#program").value[index])
        .join("");
      element.children[0].rows[0].cells[2].innerHTML = "{" + code + "}";
    });

    if (lines.get(`line${selectedLine}`)?.includes(index)) {
      td.style.backgroundColor = 'yellow';
    }
    td.innerText = char;
    tr.appendChild(td);
  });
}

$('#program').addEventListener('input', refreshTable);

function updateSelect(id) {
  selectedLine = id;
  refreshTable();
}

function addLine() {
  // Dynamically add a row to the "lines" table
  const table = document.createElement("table");
  const row = table.insertRow(-1);
  const cellSelect = row.insertCell(0);
  const cellName = row.insertCell(1);
  const cellCode = row.insertCell(2);
  const cellInput = row.insertCell(3);
  const cellRemove = row.insertCell(4);
  const cellEmpty = row.insertCell(5);
  const id = lineCount;
  cellSelect.innerHTML = `<input type="radio" name="line" onclick="updateSelect(${id})" value="line${id}">`;
  cellName.innerHTML = `Line ${id}`;
  cellCode.innerHTML = "{}";
  cellInput.innerHTML = `<textarea id="line${id}"></textarea>`;
  cellRemove.innerHTML = `<button onclick="removeLineX(${id - 1
    })">Remove</button>`;
  cellEmpty.innerHTML = `<button onclick="clearLine(${id})">Clear</button>`;

  // Add the line to the hashmap
  lines.set(`line${id}`, []);

  const sections = $("#sections");
  const newLine = document.createElement("li");
  newLine.appendChild(table);
  newLine.setAttribute("id", `line${id}`);
  sections.appendChild(newLine);

  lineCount++;
}

$('.add-line').addEventListener('click', addLine);

function removeLine() {
  // Remove the last li from the "sections" ul
  const element = $(`#line${lineCount - 1}`);
  element.parentNode.removeChild(element);
  lines.delete(`line${lineCount - 1}`);
  lineCount--;
}

$('.remove-line').addEventListener('click', removeLine);

function removeLineX(x) {
  // Remove the nth li from the "sections" ul
  const element = $(`#line${x + 1}`);
  element.parentNode.removeChild(element);
  lines.delete(`line${x + 1}`);

  lineCount--;

  // update the second cell of the table in each li
  const sections = $("#sections");
  for (let i = 0; i < sections.children.length; i++) {
    const table = sections.children[i].children[0];
    table.rows[0].cells[1].innerHTML = `Line ${i + 1}`;
  }
}

function clearLine(x) {
  // Clear the textarea of the nth li from the "sections" ul
  const element = $(`#line${x}`);
  element.children[0].rows[0].cells[2].innerHTML = "{}";
  lines.set(`line${x}`, []);
}

function generateExplanation() {
  const output = $("#output");
  // repeat the string "" for each line. Place in array
  let explanationLines = Array.from({ length: lineCount }, () => "");
  let program = $("#program").value.split("");
  for (let i = 1; i < lineCount; i++) {
    let line = lines.get(`line${i}`);
    console.log(line);
    explanationLines[i] = program.map((char, index) => {
      if (line.includes(index)) {
        return char;
      } else {
        return " ";
      }
    }).join("") + "  # " + $("#line" + i).children[0].rows[0].cells[3].children[0].value;
    output.value = program.join("") + "\n" + explanationLines.join("\n");
  }
}

$('.generate-explanation').addEventListener('click', generateExplanation);

new Sortable($("#sections"), {
  animation: 150,
  onEnd: () => {
    const sections = $("#sections");

    const tempLines = new Map();

    for (let i = 0; i < sections.children.length; i++) {
      const table = sections.children[i].children[0];
      const oldIndex = +table.rows[0].cells[0].innerHTML.substring(4);

      if (selectedLine === oldIndex) {
        selectedLine = i;
      }

      table.rows[0].cells[1].innerHTML = `Line ${i + 1}`;
      tempLines.set(`line${i}`, lines.get(sections.children[i].id));
      sections.children[i].id = `line${i}`;
    }

    refreshTable();
  },
});
